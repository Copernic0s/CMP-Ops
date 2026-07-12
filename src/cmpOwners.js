import { chromium } from 'playwright-core';
import { ensureChromeDebugger, resolveChromeSettings } from './chrome.js';

const USERS_MANAGEMENT_TAB_NAMES = ['Users Management', 'User management', 'Users'];
const OWNERS_TAB_NAMES = ['Owners', 'Owners & users'];
const ACTION_MENU_TEXTS = ['...', 'More actions', 'Actions'];

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

const findNavigationItem = async (page, labels) =>
  firstVisible(labels.map((label) => page.getByRole('tab', { name: label, exact: false })))
  || firstVisible(labels.map((label) => page.getByRole('button', { name: label, exact: false })))
  || firstVisible(labels.map((label) => page.getByRole('link', { name: label, exact: false })))
  || firstVisible(labels.map((label) => page.getByText(label, { exact: false })));

const expandUsersManagement = async (page) => {
  const usersManagement = await findNavigationItem(page, USERS_MANAGEMENT_TAB_NAMES);
  if (!usersManagement) {
    return false;
  }

  const ariaExpanded = String(await usersManagement.getAttribute('aria-expanded').catch(() => '') || '').toLowerCase();
  if (ariaExpanded !== 'true') {
    await usersManagement.click({ timeoutMs: 15000 });
    await page.waitForTimeout(600);
  }

  return true;
};

const findOwnersNavigation = async (page) => {
  const directOwners = await findNavigationItem(page, OWNERS_TAB_NAMES);
  if (directOwners) {
    return directOwners;
  }

  const expanded = await expandUsersManagement(page);
  if (!expanded) {
    return null;
  }

  return findNavigationItem(page, OWNERS_TAB_NAMES);
};

const findSearchBox = async (page) =>
  firstVisible([
    page.getByRole('textbox', { name: 'Search', exact: false }),
    page.getByRole('textbox', { name: 'Search company', exact: false }),
    page.getByRole('textbox', { name: 'Company', exact: false }),
    page.getByPlaceholder('Search', { exact: false }),
    page.getByPlaceholder('Search company', { exact: false }),
    page.getByPlaceholder('Search company name', { exact: false }),
    page.locator('input[type="search"]'),
    page.locator('input[type="text"]')
  ]);

const findCompanyRow = async (page, companyName) =>
  firstVisible([
    page.getByRole('row', { name: companyName, exact: false }),
    page.locator('tr', { hasText: companyName }),
    page.locator(`[role="row"]`, { hasText: companyName })
  ]);

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
  const emailMatch = cleanedCells.find((value) => /@/.test(value)) || '';
  const companyMatch = cleanedCells[0] || companyName || '';
  const nonActionCells = cleanedCells.filter((value) => !/^(?:\.{3}|more actions|actions|show password|copy(?: to clipboard)?)$/i.test(value));
  const usernameMatch = nonActionCells.find((value) => value !== companyMatch && value !== emailMatch && !/@/.test(value)) || '';
  const ownerNameMatch = nonActionCells.find((value) => value !== companyMatch && value !== emailMatch && value !== usernameMatch && !/@/.test(value)) || '';

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

  const settings = resolveChromeSettings();
  const page = options.page || null;
  let browser = null;
  let context = null;
  let activePage = page;

  if (!activePage) {
    await ensureChromeDebugger(settings);
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${settings.debugPort}`);
    context = browser.contexts()[0] || await browser.newContext();
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: settings.startupUrl || 'http://localhost' });
    activePage = context.pages()[0] || await context.newPage();
  }

  const baseUrl = String(options.baseUrl || process.env.HERMES_CMP_URL || '').trim();
  if (!baseUrl) {
    throw new Error('HERMES_CMP_URL is required to open the CMP app');
  }

  await activePage.goto(baseUrl, { waitUntil: 'domcontentloaded' });

  const ownersNav = await findOwnersNavigation(activePage);
  if (!ownersNav) {
    throw new Error('Owners navigation was not found in CMP');
  }
  await ownersNav.click({ timeoutMs: 15000 });
  await activePage.waitForLoadState('networkidle').catch(() => {});

  const searchBox = await findSearchBox(activePage);
  if (!searchBox) {
    throw new Error('Search box was not found in CMP owners view');
  }

  await searchBox.click({ timeoutMs: 15000 });
  await searchBox.fill(companyName, { timeoutMs: 15000 });
  await searchBox.press('Enter', { timeoutMs: 15000 });

  const row = await findCompanyRow(activePage, companyName);
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

  if (browser && typeof browser.disconnect === 'function') {
    browser.disconnect();
  }

  return result;
};
