import { chromium } from 'playwright-core';
import { ensureChromeDebugger, resolveChromeSettings } from './chrome.js';
import { normalizeCompanyKey } from './companyKey.js';

const DEFAULT_INVENTORY_TAB_NAMES = [
  'Company account cards list',
  'Company account cards',
  'Company account cards List',
  'Cards list'
];

const DEFAULT_SEARCH_TEXTS = ['Search', 'Search...', 'Search card', 'Search card number', 'Card number'];
const DEFAULT_NEXT_TEXTS = ['Next', '>', '›', 'Next >', 'Next ›'];
const DEFAULT_INVENTORY_PATH = '/company-account-cards';
const DEFAULT_PAGE_SIZE = 100;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createLogger = (options = {}) => {
  const log = typeof options.log === 'function' ? options.log : console.log;
  return (message, extra = null) => {
    if (extra === null || extra === undefined) {
      log(`[Hermes][inventory] ${message}`);
      return;
    }
    log(`[Hermes][inventory] ${message}`, extra);
  };
};

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

const getTabNames = (env = process.env) =>
  String(env.HERMES_INVENTORY_TAB_NAMES || DEFAULT_INVENTORY_TAB_NAMES.join('|'))
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);

const getSearchTexts = (env = process.env) =>
  String(env.HERMES_INVENTORY_SEARCH_TEXTS || DEFAULT_SEARCH_TEXTS.join('|'))
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);

const getNextTexts = (env = process.env) =>
  String(env.HERMES_INVENTORY_NEXT_TEXTS || DEFAULT_NEXT_TEXTS.join('|'))
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);

const resolveInventoryUrl = (baseUrl, inventoryPath) => {
  const path = String(inventoryPath || process.env.HERMES_CMP_INVENTORY_PATH || DEFAULT_INVENTORY_PATH).trim();
  if (!path) return baseUrl;
  if (/^https?:\/\//i.test(path)) return path;
  return `${String(baseUrl || '').replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
};

const resolveInventoryPageSize = (env = process.env) => {
  const requested = Number(env.HERMES_INVENTORY_PAGE_SIZE || DEFAULT_PAGE_SIZE);
  if (requested >= 100) return 100;
  if (requested >= 50) return 50;
  if (requested >= 20) return 20;
  return 10;
};

const findInventoryNavigation = async (page) => {
  const tabNames = getTabNames();
  return firstVisible([
    ...tabNames.map((label) => page.getByRole('tab', { name: label, exact: false })),
    ...tabNames.map((label) => page.getByRole('button', { name: label, exact: false })),
    ...tabNames.map((label) => page.getByText(label, { exact: false }))
  ]);
};

const findSearchBox = async (page) => {
  const searchTexts = getSearchTexts();
  return firstVisible([
    ...searchTexts.map((label) => page.getByRole('textbox', { name: label, exact: false })),
    ...searchTexts.map((label) => page.getByPlaceholder(label, { exact: false })),
    page.locator('input[placeholder="Search..."]'),
    page.locator('input[type="search"]'),
    page.locator('input[type="text"]')
  ]);
};

const findNextButton = async (page) => {
  const nextTexts = getNextTexts();
  return firstVisible([
    ...nextTexts.map((label) => page.getByRole('button', { name: label, exact: false })),
    ...nextTexts.map((label) => page.getByText(label, { exact: false })),
    page.locator('button[aria-label*="next" i]'),
    page.locator('button:not([disabled])', { hasText: 'Next' })
  ]);
};

const normalizeHeader = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const headerIndexMap = (headers) => {
  const map = new Map();
  headers.forEach((header, index) => {
    map.set(normalizeHeader(header), index);
  });
  return map;
};

const pickIndex = (map, candidates) => {
  for (const candidate of candidates) {
    const normalized = normalizeHeader(candidate);
    if (map.has(normalized)) return map.get(normalized);
  }
  return -1;
};

const parseInventoryRow = (cells, headers) => {
  const headerMap = headerIndexMap(headers);
  const get = (...candidates) => {
    const index = pickIndex(headerMap, candidates);
    if (index < 0) return '';
    return String(cells[index] || '').trim();
  };

  const cardNumber = get('card number', 'card no', 'card #', 'card');
  const companyName = get('company', 'company name');
  const companyStatus = get('company status', 'status');
  const cardStatus = get('card status');
  const organization = get('organization', 'org');
  const efsAccount = get('efs account', 'efs organization', 'efs org');
  const driverName = get('driver name');
  const driverId = get('driver id', 'driver');
  const unitNumber = get('unit number', 'unit');
  const lastUsedDate = get('last used date', 'last used');

  return {
    cardNumber,
    companyName,
    companyStatus,
    cardStatus,
    organization,
    efsAccount,
    driverName,
    driverId,
    unitNumber,
    lastUsedDate
  };
};

export const normalizeInventoryCompanyKey = normalizeCompanyKey;

const gatherTableHeaders = async (page) => {
  const table = await page.locator('table').first();
  const headerCells = await table.locator('thead th, thead [role="columnheader"]').allTextContents().catch(() => []);
  return headerCells.map((value) => String(value || '').trim()).filter(Boolean);
};

const setInventoryPageSize = async (page, desiredSize, log) => {
  const pageSizeLabel = `${desiredSize} per page`;
  const combobox = await firstVisible([
    page.getByRole('combobox').filter({ hasText: /per page/i }),
    page.getByRole('combobox', { name: /per page/i }),
    page.getByText(/per page/i)
  ]);

  if (!combobox) {
    log('page size control not found, continuing with default page size');
    return false;
  }

  const currentLabel = String(await combobox.textContent().catch(() => '') || '').trim();
  if (currentLabel.includes(pageSizeLabel)) {
    log(`page size already set to ${pageSizeLabel}`);
    return true;
  }

  log(`setting page size to ${pageSizeLabel}`);
  await combobox.click({ timeoutMs: 10000 });
  await page.waitForTimeout(300);

  const option = await firstVisible([
    page.getByRole('option', { name: pageSizeLabel, exact: false }),
    page.getByText(pageSizeLabel, { exact: false })
  ]);

  if (!option) {
    log(`page size option ${pageSizeLabel} not found, keeping current size`);
    await page.keyboard.press('Escape').catch(() => {});
    return false;
  }

  await option.click({ timeoutMs: 10000 });
  await page.waitForTimeout(800);
  return true;
};

const waitForInventoryTable = async (page, log) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const headers = await gatherTableHeaders(page);
    const rowCount = await page.locator('table tbody tr').count().catch(() => 0);
    const bodyText = String(await page.locator('table tbody').innerText().catch(() => '') || '').trim();
    const hasPlaceholder = /nothing found/i.test(bodyText);
    if (headers.length > 0 && rowCount > 1 && !hasPlaceholder) {
      log(`table ready with ${headers.length} headers and ${rowCount} rows`);
      return;
    }
    await sleep(500);
  }

  const headers = await gatherTableHeaders(page);
  const rowCount = await page.locator('table tbody tr').count().catch(() => 0);
  const bodyText = String(await page.locator('table tbody').innerText().catch(() => '') || '').trim();
  log(`table wait ended with ${headers.length} headers and ${rowCount} rows; body="${bodyText.slice(0, 120)}"`);
};

const waitForInventoryShell = async (page, log) => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const headingVisible = await page
      .getByRole('heading', { name: /company account cards list/i })
      .isVisible()
      .catch(() => false);
    const searchVisible = await page
      .locator('input[placeholder="Search..."]')
      .isVisible()
      .catch(() => false);
    const tableReady = (await page.locator('table').count().catch(() => 0)) > 0;

    if ((headingVisible || searchVisible) && tableReady) {
      log('inventory shell is ready');
      return;
    }

    await sleep(500);
  }

  log('inventory shell wait timed out, continuing carefully');
};

const findPaginationButton = async (page) => {
  const buttons = await page.getByRole('button', { name: /next/i }).all().catch(() => []);
  for (let index = buttons.length - 1; index >= 0; index -= 1) {
    const candidate = buttons[index];
    const visible = await candidate.isVisible().catch(() => false);
    if (visible) return candidate;
  }

  return null;
};

const extractRowsFromPage = async (page, headers) => {
  const rows = await page.locator('tbody tr, [role="row"]').all().catch(() => []);
  const results = [];

  for (const row of rows) {
    const visible = await row.isVisible().catch(() => false);
    if (!visible) continue;

    const cells = await row.locator('td, [role="cell"]').allTextContents().catch(() => []);
    const cleaned = cells.map((value) => String(value || '').trim());
    if (cleaned.length === 0) continue;
    if (cleaned.length === 1 && /nothing found/i.test(cleaned[0] || '')) continue;

    const summary = String(await row.textContent({ timeoutMs: 10000 }).catch(() => '') || '').trim();
    const parsed = parseInventoryRow(cleaned, headers);
    if (!parsed.cardNumber) continue;

    results.push({
      ...parsed,
      rowSummary: summary,
      rowCells: cleaned
    });
  }

  return results;
};

const clickNextPage = async (page) => {
  const nextButton = await findPaginationButton(page);
  if (!nextButton) return false;

  const disabled = await nextButton.isDisabled().catch(() => true);
  if (disabled) return false;

  const previousRange = String(await page.locator('body').innerText().catch(() => '') || '').match(/\b\d+-\d+ of \d+ items\b/i)?.[0] || '';
  await nextButton.click({ timeoutMs: 15000 });
  for (let i = 0; i < 20; i += 1) {
    await sleep(500);
    const bodyText = String(await page.locator('body').innerText().catch(() => '') || '');
    const currentRange = bodyText.match(/\b\d+-\d+ of \d+ items\b/i)?.[0] || '';
    const rowCount = await page.locator('table tbody tr').count().catch(() => 0);
    const hasPlaceholder = /nothing found/i.test(bodyText);
    if (currentRange && currentRange !== previousRange && rowCount > 1 && !hasPlaceholder) {
      return true;
    }
  }

  return true;
};

export const captureCardInventory = async (options = {}) => {
  const settings = resolveChromeSettings();
  const page = options.page || null;
  const log = createLogger(options);
  let browser = null;
  let context = null;
  let activePage = page;

  if (!activePage) {
    await ensureChromeDebugger(settings);
    browser = await chromium.connectOverCDP(`http://127.0.0.1:${settings.debugPort}`);
    context = browser.contexts()[0] || await browser.newContext();
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
      origin: settings.startupUrl || 'http://localhost'
    });
    activePage = context.pages()[0] || await context.newPage();
  }

  const baseUrl = String(options.baseUrl || process.env.HERMES_CMP_URL || '').trim();
  if (!baseUrl) {
    throw new Error('HERMES_CMP_URL is required to open the CMP app');
  }

  const inventoryUrl = resolveInventoryUrl(baseUrl, options.inventoryPath);
  log(`opening profile ${settings.profileDir} at ${settings.userDataDir}`);
  log(`profile landing page is allowed, but worker will redirect to inventory route if needed`);
  log(`navigating to ${inventoryUrl}`);
  await activePage.goto(inventoryUrl, { waitUntil: 'domcontentloaded' });
  await activePage.waitForLoadState('networkidle').catch(() => {});

  const currentUrl = activePage.url();
  log(`current url ${currentUrl}`);

  const inventoryNav = await findInventoryNavigation(activePage);
  const isInventoryPage = String(currentUrl || '').includes('/company-account-cards');
  if (!inventoryNav && !isInventoryPage) {
    throw new Error('Company account cards navigation was not found in CMP');
  }

  if (!isInventoryPage) {
    log('redirecting directly to company-account-cards');
    await activePage.goto(inventoryUrl, { waitUntil: 'domcontentloaded' });
    await activePage.waitForLoadState('networkidle').catch(() => {});
  } else if (inventoryNav) {
    log('clicking Company account cards navigation');
    await inventoryNav.click({ timeoutMs: 15000 });
    await activePage.waitForLoadState('networkidle').catch(() => {});
  }

  await waitForInventoryShell(activePage, log);
  const searchBox = await findSearchBox(activePage);
  if (searchBox) {
    log('search box found, clearing it');
    await searchBox.fill('', { timeoutMs: 10000 }).catch(() => {});
  } else {
    log('search box not found, continuing with visible table');
  }

  const desiredPageSize = resolveInventoryPageSize(process.env);
  await setInventoryPageSize(activePage, desiredPageSize, log);
  await waitForInventoryTable(activePage, log);

  const rows = [];
  const seen = new Set();
  const maxPages = Number(process.env.HERMES_INVENTORY_MAX_PAGES || 500);

  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    await waitForInventoryTable(activePage, log);
    const headers = await gatherTableHeaders(activePage);
    log(`reading page ${pageIndex + 1} with ${headers.length} headers`);
    const pageRows = await extractRowsFromPage(activePage, headers);
    log(`found ${pageRows.length} visible rows on page ${pageIndex + 1}`);

    for (const row of pageRows) {
      const key = String(row.cardNumber || '').trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      rows.push({
        ...row,
        source: 'cmp',
        source_metadata: {
          page_index: pageIndex + 1,
          row_cells: row.rowCells || [],
          row_summary: row.rowSummary || ''
        }
      });
    }

    const advanced = await clickNextPage(activePage);
    if (!advanced) {
      log('pagination ended');
      break;
    }
    log(`advanced to next page after ${pageIndex + 1}`);
  }

  log(`inventory crawl complete with ${rows.length} unique card rows`);

  if (browser && typeof browser.disconnect === 'function') {
    browser.disconnect();
  }

  return {
    totalRecords: rows.length,
    rows
  };
};
