import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { ensureChromeDebugger, resolveChromeSettings } from './chrome.js';

const CUSTOMERS_SERVICES_TAB_NAMES = ['Customers Services', 'Customer Services', 'Customers'];
const USERS_MANAGEMENT_TAB_NAMES = ['Users Management', 'User management', 'Users'];
const OWNERS_TAB_NAMES = ['Owners', 'Owners & users'];
const ACTION_MENU_TEXTS = ['...', 'More actions', 'Actions'];
const OWNERS_PATH = '/owners';

const firstVisible = async (locators) => {
  for (const locator of locators) {
    const count = await locator.count();
    for (let index = 0; index < count; index += 1) {
      const candidate = locator.nth(index);
      const visible = await candidate.isVisible().catch(() => false);
      if (visible) return candidate;
    }
  }
  return null;
};

export const resolveOwnersUrl = (baseUrl = '') => {
  const rawUrl = String(baseUrl || '').trim();
  const resolved = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : 'http://localhost');
  resolved.pathname = OWNERS_PATH;
  resolved.search = '';
  resolved.hash = '';
  return resolved.toString();
};

const readProfileAuthTokens = async (settings) => {
  const leveldbPaths = [
    path.join(settings.userDataDir, settings.profileDir, 'Local Storage', 'leveldb', '000015.log'),
    path.join(settings.userDataDir, settings.profileDir, 'Local Storage', 'leveldb', '000017.ldb')
  ];

  const extractToken = (buffer, key) => {
    const text = buffer.toString('utf8');
    const regex = new RegExp(`${key}\\u0001\\u0001(eyJ[0-9A-Za-z._-]+)`, 'g');
    const matches = [...text.matchAll(regex)];
    if (matches.length) {
      return matches[matches.length - 1][1];
    }

    const looseRegex = new RegExp(`${key}[^\\n\\r]{0,200}?(eyJ[0-9A-Za-z._-]+)`, 'g');
    const looseMatches = [...text.matchAll(looseRegex)];
    if (looseMatches.length) {
      return looseMatches[looseMatches.length - 1][1];
    }

    return null;
  };

  const extractUser = (buffer) => {
    const text = buffer.toString('utf8');
    const userKeyIndex = text.lastIndexOf('\u0001user');
    const accessKeyIndex = text.lastIndexOf('accessToken');
    if (userKeyIndex === -1 || accessKeyIndex === -1 || userKeyIndex > accessKeyIndex) {
      return null;
    }

    const slice = text.slice(userKeyIndex, accessKeyIndex);
    const openBrace = slice.indexOf('{');
    if (openBrace === -1) {
      return null;
    }

    let depth = 0;
    let closeBrace = -1;
    for (let index = openBrace; index < slice.length; index += 1) {
      const character = slice[index];
      if (character === '{') {
        depth += 1;
      } else if (character === '}') {
        depth -= 1;
        if (depth === 0) {
          closeBrace = index;
          break;
        }
      }
    }

    if (closeBrace === -1) {
      return null;
    }

    const candidate = slice.slice(openBrace, closeBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      return null;
    }
  };

  for (const candidatePath of leveldbPaths) {
    try {
      const buffer = await fs.readFile(candidatePath);
      const accessToken = extractToken(buffer, 'accessToken');
      const refreshToken = extractToken(buffer, 'refreshToken');
      const user = extractUser(buffer);
      if (accessToken || refreshToken || user) {
        return {
          accessToken,
          refreshToken,
          user
        };
      }
    } catch {
      // Try the next storage snapshot.
    }
  }

  return {
    accessToken: null,
    refreshToken: null,
    user: null
  };
};

export const openOwnerAccessSession = async ({ baseUrl } = {}) => {
  const settings = resolveChromeSettings();
  const startupUrl = resolveOwnersUrl(baseUrl || settings.startupUrl || 'http://localhost');
  const origin = new URL(startupUrl).origin;
  const authTokens = await readProfileAuthTokens(settings);

  await ensureChromeDebugger({
    ...settings,
    startupUrl
  });

  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${settings.debugPort}`);
  const context = browser.contexts()[0] || await browser.newContext();
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin }).catch(() => {});

  if (authTokens.accessToken || authTokens.refreshToken) {
    await context.addInitScript(({ accessToken, refreshToken, targetOrigin }) => {
      try {
        if (location.origin === targetOrigin) {
          if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
            sessionStorage.setItem('accessToken', accessToken);
          }
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
            sessionStorage.setItem('refreshToken', refreshToken);
          }
        }
      } catch {
        // Ignore storage injection errors and continue with the session.
      }
    }, {
      accessToken: authTokens.accessToken,
      refreshToken: authTokens.refreshToken,
      targetOrigin: origin
    });
  }
  if (authTokens.user) {
    await context.addInitScript(({ user, targetOrigin }) => {
      try {
        if (location.origin === targetOrigin && user) {
          const payload = JSON.stringify(user);
          localStorage.setItem('user', payload);
          sessionStorage.setItem('user', payload);
        }
      } catch {
        // Ignore storage injection errors and continue with the session.
      }
    }, {
      user: authTokens.user,
      targetOrigin: origin
    });
  }

  const page = context.pages()[0] || await context.newPage();
  await page.goto(startupUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
  return {
    mode: 'cdp',
    browser,
    context,
    page,
    close: async () => {
      if (browser && typeof browser.disconnect === 'function') {
        browser.disconnect();
      }
    }
  };
};

const findNavigationItem = async (page, labels) =>
  firstVisible(labels.map((label) => page.getByRole('tab', { name: label, exact: false })))
  || firstVisible(labels.map((label) => page.getByRole('button', { name: label, exact: false })))
  || firstVisible(labels.map((label) => page.getByRole('link', { name: label, exact: false })))
  || firstVisible(labels.map((label) => page.getByText(label, { exact: false })));

const expandNavigationSection = async (page, labels) => {
  const section = await firstVisible([
    ...labels.map((label) => page.getByRole('button', { name: label, exact: false })),
    ...labels.map((label) => page.getByText(label, { exact: false }))
  ]);
  if (!section) {
    return false;
  }

  const ariaExpanded = String(await section.getAttribute('aria-expanded').catch(() => '') || '').toLowerCase();
  if (ariaExpanded !== 'true') {
    await section.click({ timeoutMs: 15000 });
    await page.waitForTimeout(600);
  }

  return true;
};

const expandCustomersServices = async (page) =>
  expandNavigationSection(page, CUSTOMERS_SERVICES_TAB_NAMES);

const expandUsersManagement = async (page) =>
  expandNavigationSection(page, USERS_MANAGEMENT_TAB_NAMES);

const findOwnersNavigation = async (page) => {
  const directOwners = page.locator('a[href="/owners"], [href="/owners"]').first();
  if (directOwners && await directOwners.isVisible().catch(() => false)) {
    return directOwners;
  }

  const directOwnersByText = await findNavigationItem(page, OWNERS_TAB_NAMES);
  if (directOwnersByText) {
    return directOwnersByText;
  }

  await expandCustomersServices(page);
  const expanded = await expandUsersManagement(page);
  if (!expanded) {
    const fallbackExpanded = await expandCustomersServices(page);
    if (!fallbackExpanded) {
      return null;
    }
  }

  const ownersByHref = page.locator('a[href="/owners"], [href="/owners"]').first();
  await ownersByHref.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  if (await ownersByHref.isVisible().catch(() => false)) {
    return ownersByHref;
  }

  const directOwnersAfterExpand = await findNavigationItem(page, OWNERS_TAB_NAMES);
  if (directOwnersAfterExpand) {
    return directOwnersAfterExpand;
  }

  const anyOwners = page.getByText('Owners', { exact: false }).first();
  if (anyOwners && await anyOwners.isVisible().catch(() => false)) {
    return anyOwners;
  }

  return null;
};

const waitForOwnersShell = async (page) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 600000) {
    const currentUrl = String(page.url() || '');
    const loginVisible = currentUrl.includes('/auth') || await page.getByText('Login', { exact: false }).isVisible().catch(() => false);
    if (loginVisible) {
      await page.waitForTimeout(2000).catch(() => {});
      continue;
    }

    const shellReady = await firstVisible([
      page.getByRole('button', { name: 'Customers Services', exact: false }),
      page.getByRole('button', { name: 'Users Management', exact: false }),
      page.getByText('Customers Services', { exact: false }),
      page.getByText('Users Management', { exact: false }),
      page.getByText('Owners', { exact: false })
    ]);
    if (shellReady) {
      await shellReady.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      return;
    }

    await page.waitForTimeout(2000).catch(() => {});
  }
  throw new Error('CMP owners shell did not become ready in time');
};

const findCompanySelect = async (page) =>
  firstVisible([
    page.getByPlaceholder('Select company', { exact: false }),
    page.getByRole('textbox', { name: 'Select company', exact: false }),
    page.locator('input[placeholder="Select company"]'),
    page.locator('input[type="text"]')
  ]);

const findOwnersSearch = async (page) =>
  firstVisible([
    page.getByPlaceholder('Search...', { exact: false }),
    page.getByRole('textbox', { name: 'Search', exact: false }),
    page.locator('input[placeholder="Search..."]')
  ]);

const normalizeOwnerSearchText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(?:llc|inc|corp|co|company|ltd|lp|llp|transportation|transport|group|groups|solutions|services)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const buildOwnerSearchTerms = (companyName) => {
  const normalized = normalizeOwnerSearchText(companyName);
  const tokens = normalized.split(' ').filter(Boolean);
  const terms = [];

  const pushTerm = (term) => {
    const cleaned = normalizeOwnerSearchText(term);
    if (!cleaned || terms.includes(cleaned)) return;
    terms.push(cleaned);
  };

  pushTerm(companyName);
  pushTerm(normalized);

  for (let size = Math.min(4, tokens.length); size >= 1; size -= 1) {
    for (let start = 0; start <= tokens.length - size; start += 1) {
      pushTerm(tokens.slice(start, start + size).join(' '));
    }
  }

  return terms;
};

const rowMatchesCompany = (rowText, companyName) => {
  const rowTokens = normalizeOwnerSearchText(rowText).split(' ').filter(Boolean);
  const targetTokens = normalizeOwnerSearchText(companyName).split(' ').filter(Boolean);
  if (!rowTokens.length || !targetTokens.length) return false;

  return targetTokens.every((token) => rowTokens.includes(token));
};

const findCompanyRow = async (page, companyName) => {
  const rows = page.locator('tbody tr');
  const rowCount = await rows.count().catch(() => 0);

  for (let index = 0; index < rowCount; index += 1) {
    const candidate = rows.nth(index);
    const text = await candidate.textContent({ timeoutMs: 15000 }).catch(() => '');
    const cells = await candidate.locator('td').allTextContents().catch(() => []);
    const companyCell = String(cells[4] || '').trim();
    if (rowMatchesCompany(companyCell, companyName) || rowMatchesCompany(text, companyName)) {
      return candidate;
    }
  }

  return null;
};

const findNextButton = async (page) =>
  firstVisible([
    page.getByRole('button', { name: 'Next', exact: false }),
    page.getByText('Next', { exact: false }),
    page.getByRole('button', { name: '>', exact: false }),
    page.getByText('>', { exact: false })
  ]);

const findCompanyRowAcrossPages = async (page, companyName, maxPages = 25) => {
  let currentRow = await findCompanyRow(page, companyName);
  if (currentRow) {
    return currentRow;
  }

  for (let index = 0; index < maxPages; index += 1) {
    const nextButton = await findNextButton(page);
    if (!nextButton) {
      return null;
    }

    const disabled = String(await nextButton.getAttribute('disabled').catch(() => '') || '').toLowerCase();
    if (disabled === 'true') {
      return null;
    }

    await nextButton.click({ timeoutMs: 15000 }).catch(() => {});
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(2200);
    currentRow = await findCompanyRow(page, companyName);
    if (currentRow) {
      return currentRow;
    }
  }

  return null;
};

const findVisibleSuggestion = async (page, companyName, timeoutMs = 10000) => {
  const startedAt = Date.now();
  const candidates = () => [
    page.locator('[cmdk-item]').filter({ hasText: companyName }).first(),
    page.locator('[cmdk-item]').first(),
    page.locator('[role="option"]').filter({ hasText: companyName }).first(),
    page.locator('[role="option"]').first(),
    page.getByText(companyName, { exact: false }).first(),
    page.getByText(companyName.split(' ')[0] || companyName, { exact: false }).first()
  ];

  while (Date.now() - startedAt < timeoutMs) {
    const suggestion = await firstVisible(candidates());
    if (suggestion) {
      return suggestion;
    }
    await page.waitForTimeout(250);
  }

  return null;
};

const selectCompany = async (page, companySelect, companyName) => {
  await companySelect.click({ timeoutMs: 15000 });
  await companySelect.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A').catch(() => {});
  await companySelect.type(companyName, { timeoutMs: 15000, delay: 40 });

  const selectedSuggestion = await findVisibleSuggestion(page, companyName, 10000);

  if (selectedSuggestion) {
    await selectedSuggestion.click({ timeoutMs: 15000 });
    await page.waitForTimeout(1200);
    return true;
  }

  await companySelect.press('ArrowDown').catch(() => {});
  await companySelect.press('Enter').catch(() => {});
  await page.waitForTimeout(1200);
  return false;
};

const filterOwnersBySearch = async (page, companyName) => {
  const ownersSearch = await findOwnersSearch(page);
  if (!ownersSearch) {
    return false;
  }

  await ownersSearch.click({ timeoutMs: 15000 });
  await ownersSearch.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A').catch(() => {});
  await ownersSearch.type(companyName, { timeoutMs: 15000, delay: 40 });
  const searchSuggestion = await findVisibleSuggestion(page, companyName, 10000);
  if (searchSuggestion) {
    await searchSuggestion.click({ timeoutMs: 15000 }).catch(() => {});
  } else {
    await ownersSearch.press('ArrowDown').catch(() => {});
    await ownersSearch.press('Enter').catch(() => {});
  }
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(2200);
  return true;
};

const waitForMatchingRow = async (page, companyName, timeoutMs = 10000) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const row = await findCompanyRow(page, companyName);
    if (row) {
      return row;
    }
    await page.waitForTimeout(750);
  }
  return null;
};

const findActionMenuButton = async (row) =>
  firstVisible([
    ...ACTION_MENU_TEXTS.map((text) => row.getByRole('button', { name: text, exact: false })),
    row.locator('button[aria-label*="more" i]'),
    row.locator('button[aria-label*="action" i]'),
    row.locator('button')
  ]);

const openPasswordPopup = async (page, row) => {
  const actionButton = await findActionMenuButton(row);
  if (!actionButton) {
    throw new Error('Action menu button not found on CMP owners row');
  }

  await actionButton.click({ timeoutMs: 15000 });

  const showPassword = await firstVisible([
    page.getByText('Show password', { exact: false }),
    page.getByRole('menuitem', { name: 'Show password', exact: false }),
    page.getByRole('button', { name: 'Show password', exact: false })
  ]);

  if (!showPassword) {
    throw new Error('Show password action not found');
  }

  await showPassword.click({ timeoutMs: 15000 });
};

const readPopupPassword = async (page) => {
  const popup = await firstVisible([
    page.locator('[role="dialog"]'),
    page.locator('[role="tooltip"]'),
    page.locator('[data-state="open"]'),
    page.getByText('Copy to clipboard', { exact: false })
  ]);

  if (!popup) {
    throw new Error('Password popup did not appear');
  }

  const popupText = await popup.textContent({ timeoutMs: 15000 }).catch(() => '');
  const clipboardButton = await firstVisible([
    popup.getByRole('button', { name: 'Copy', exact: false }),
    popup.getByRole('button', { name: 'Copy to clipboard', exact: false }),
    popup.getByText('Copy', { exact: false })
  ]);

  if (clipboardButton) {
    await clipboardButton.click({ timeoutMs: 15000 });
  }

  let clipboardText = '';
  try {
    clipboardText = await page.evaluate(async () => navigator.clipboard.readText());
  } catch {
    clipboardText = '';
  }

  return {
    popupText: String(popupText || '').trim(),
    clipboardText: String(clipboardText || '').trim()
  };
};

const extractOwnerRowFields = async (row, companyName) => {
  const cells = await row.locator('td, [role="cell"]').allTextContents().catch(() => []);
  const cleanedCells = cells.map((value) => String(value || '').trim()).filter(Boolean);
  const firstNameMatch = cleanedCells[0] || '';
  const lastNameMatch = cleanedCells[1] || '';
  const emailMatch = cleanedCells.find((value) => /@/.test(value)) || '';
  const companyMatch = cleanedCells[4] || companyName || '';
  const nonActionCells = cleanedCells.filter((value) => !/^(?:\.{3}|more actions|actions|show password|copy(?: to clipboard)?)$/i.test(value));
  const usernameMatch = firstNameMatch || nonActionCells.find((value) => value !== companyMatch && value !== emailMatch && !/@/.test(value)) || '';
  const ownerNameMatch = [firstNameMatch, lastNameMatch].filter(Boolean).join(' ').trim();

  return {
    rowCells: cleanedCells,
    companyName: companyMatch || companyName || '',
    ownerEmail: emailMatch || '',
    username: usernameMatch || '',
    ownerName: ownerNameMatch || ''
  };
};

export const captureOwnerAccessForCompany = async (companyName, options = {}) => {
  if (!companyName) {
    throw new Error('companyName is required');
  }

  const page = options.page || null;
  let browser = null;
  let context = null;
  let activePage = page;

  if (!activePage) {
    const session = await openOwnerAccessSession({ baseUrl: options.baseUrl || process.env.HERMES_CMP_URL || '' });
    browser = session.browser;
    context = session.context;
    activePage = session.page;
    options._session = session;
  }

  const baseUrl = String(options.baseUrl || process.env.HERMES_CMP_URL || '').trim();
  if (!baseUrl) {
    throw new Error('HERMES_CMP_URL is required to open the CMP app');
  }
  const ownersUrl = resolveOwnersUrl(baseUrl);

  await activePage.goto(ownersUrl, { waitUntil: 'domcontentloaded' });
  await activePage.waitForLoadState('networkidle').catch(() => {});
  await waitForOwnersShell(activePage);

  const customersServicesNav = await firstVisible([
    activePage.getByRole('button', { name: 'Customers Services', exact: false }),
    activePage.getByRole('button', { name: 'Customer Services', exact: false }),
    activePage.getByText('Customers Services', { exact: false }),
    activePage.getByText('Customer Services', { exact: false })
  ]);
  if (!customersServicesNav) {
    throw new Error('Customers Services navigation was not found in CMP');
  }

  const customersExpanded = String(await customersServicesNav.getAttribute('aria-expanded').catch(() => '') || '').toLowerCase();
  if (customersExpanded !== 'true') {
    await customersServicesNav.click({ timeoutMs: 15000 });
    await activePage.waitForTimeout(800);
  }

  const usersManagementNav = await firstVisible([
    activePage.getByRole('button', { name: 'Users Management', exact: false }),
    activePage.getByRole('button', { name: 'User management', exact: false }),
    activePage.getByRole('button', { name: 'Users', exact: false }),
    activePage.getByText('Users Management', { exact: false }),
    activePage.getByText('User management', { exact: false }),
    activePage.getByText('Users', { exact: false })
  ]);
  if (!usersManagementNav) {
    throw new Error('User management navigation was not found in CMP');
  }

  const expanded = String(await usersManagementNav.getAttribute('aria-expanded').catch(() => '') || '').toLowerCase();
  if (expanded !== 'true') {
    await usersManagementNav.click({ timeoutMs: 15000 });
    await activePage.waitForTimeout(800);
  }

  const ownersNav = await findOwnersNavigation(activePage);
  if (!ownersNav) {
    throw new Error('Owners navigation was not found in CMP');
  }
  await ownersNav.click({ timeoutMs: 15000 });
  await activePage.waitForLoadState('networkidle').catch(() => {});

  const companySelect = await findCompanySelect(activePage);
  if (!companySelect) {
    throw new Error('Company selector was not found in CMP owners view');
  }

  let row = null;

  const clearableSearch = await findOwnersSearch(activePage);
  if (clearableSearch) {
    await clearableSearch.fill('').catch(() => {});
  }

  let selectedCompany = false;
  if (!row) {
    selectedCompany = await selectCompany(activePage, companySelect, companyName);
    row = await waitForMatchingRow(activePage, companyName, 12000) || await findCompanyRowAcrossPages(activePage, companyName);
  }

  if (!row) {
    const filteredBySearch = await filterOwnersBySearch(activePage, companyName);
    if (filteredBySearch) {
      row = await waitForMatchingRow(activePage, companyName, 12000) || await findCompanyRowAcrossPages(activePage, companyName);
    }
  }

  if (!row) {
    row = await waitForMatchingRow(activePage, companyName, 12000) || await findCompanyRowAcrossPages(activePage, companyName);
  }

  if (!row && !selectedCompany) {
    throw new Error(`No company suggestion appeared for "${companyName}" and owners search did not resolve a row`);
  }

  if (!row) {
    throw new Error(`Company "${companyName}" was not found in CMP owners`);
  }

  const rowText = await row.textContent({ timeoutMs: 15000 }).catch(() => '');
  const rowFields = await extractOwnerRowFields(row, companyName);

  await openPasswordPopup(activePage, row);
  const passwordPayload = await readPopupPassword(activePage);

  const result = {
    companyName: rowFields.companyName || companyName,
    ownerEmail: rowFields.ownerEmail || '',
    username: rowFields.username || '',
    ownerName: rowFields.ownerName || '',
    rowCells: rowFields.rowCells || [],
    rowText: String(rowText || '').trim(),
    passwordPopup: passwordPayload.popupText,
    clipboardPassword: passwordPayload.clipboardText,
    password: passwordPayload.clipboardText || passwordPayload.popupText,
    rowSummary: String(rowText || '').trim().slice(0, 500)
  };

  if (options._session && typeof options._session.close === 'function') {
    await options._session.close().catch(() => {});
  } else if (browser && typeof browser.disconnect === 'function') {
    browser.disconnect();
  }

  return result;
};
