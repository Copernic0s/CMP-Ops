import { chromium } from 'playwright-core';
import { ensureChromeDebugger, resolveChromeSettings } from './chrome.js';
import { normalizeCompanyKey } from './companyKey.js';

const DEFAULT_INVENTORY_TAB_NAMES = [
  'Company account cards list',
  'Company account cards',
  'Company account cards List',
  'Cards list'
];

const DEFAULT_SEARCH_TEXTS = ['Search', 'Search card', 'Search card number', 'Card number'];
const DEFAULT_NEXT_TEXTS = ['Next', '›', '>', 'Next ›'];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  const headerCandidates = await page.locator('th, [role="columnheader"]').all().catch(() => []);
  for (const candidate of headerCandidates) {
    const visible = await candidate.isVisible().catch(() => false);
    if (!visible) continue;
  }

  const text = await page.locator('thead').textContent({ timeoutMs: 10000 }).catch(() => '');
  const headerText = String(text || '').trim();
  if (!headerText) return [];

  const table = await page.locator('table').first();
  const headerCells = await table.locator('thead th, thead [role="columnheader"]').allTextContents().catch(() => []);
  return headerCells.map((value) => String(value || '').trim()).filter(Boolean);
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
  const nextButton = await findNextButton(page);
  if (!nextButton) return false;

  const disabled = await nextButton.isDisabled().catch(() => true);
  if (disabled) return false;

  const previousContent = await page.locator('tbody').textContent({ timeoutMs: 10000 }).catch(() => '');
  await nextButton.click({ timeoutMs: 15000 });
  for (let i = 0; i < 20; i += 1) {
    await sleep(500);
    const currentContent = await page.locator('tbody').textContent({ timeoutMs: 10000 }).catch(() => '');
    if (String(currentContent || '').trim() && currentContent !== previousContent) {
      return true;
    }
  }

  return true;
};

export const captureCardInventory = async (options = {}) => {
  const settings = resolveChromeSettings();
  const page = options.page || null;
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

  await activePage.goto(baseUrl, { waitUntil: 'domcontentloaded' });

  const inventoryNav = await findInventoryNavigation(activePage);
  if (!inventoryNav) {
    throw new Error('Company account cards navigation was not found in CMP');
  }
  await inventoryNav.click({ timeoutMs: 15000 });

  const searchBox = await findSearchBox(activePage);
  if (searchBox) {
    await searchBox.fill('', { timeoutMs: 10000 }).catch(() => {});
  }

  const rows = [];
  const seen = new Set();
  const maxPages = Number(process.env.HERMES_INVENTORY_MAX_PAGES || 500);

  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    const headers = await gatherTableHeaders(activePage);
    const pageRows = await extractRowsFromPage(activePage, headers);

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
    if (!advanced) break;
  }

  if (browser && typeof browser.disconnect === 'function') {
    browser.disconnect();
  }

  return {
    totalRecords: rows.length,
    rows
  };
};
