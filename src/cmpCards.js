import { chromium } from 'playwright-core';
import { ensureChromeDebugger, resolveChromeSettings } from './chrome.js';

const DEFAULT_CARD_TAB_NAMES = ['Card status', 'Card Status', 'Cards', 'Statuses'];
const DEFAULT_SEARCH_TEXTS = ['Search', 'Search company', 'Company'];

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
  String(env.HERMES_CARD_TAB_NAMES || DEFAULT_CARD_TAB_NAMES.join('|'))
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);

const getSearchTexts = (env = process.env) =>
  String(env.HERMES_CARD_SEARCH_TEXTS || DEFAULT_SEARCH_TEXTS.join('|'))
    .split('|')
    .map((item) => item.trim())
    .filter(Boolean);

const findCardNavigation = async (page) => {
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

const findCompanyRow = async (page, companyName) =>
  firstVisible([
    page.getByRole('row', { name: companyName, exact: false }),
    page.locator('tr', { hasText: companyName }),
    page.locator('[role="row"]', { hasText: companyName }),
    page.getByText(companyName, { exact: false })
  ]);

const textFromRow = async (row) => {
  const cells = await row.locator('td, [role="cell"]').allTextContents().catch(() => []);
  const cleaned = cells.map((value) => String(value || '').trim()).filter(Boolean);
  const fallback = await row.textContent({ timeoutMs: 10000 }).catch(() => '');
  return {
    cells: cleaned,
    summary: String(fallback || '').trim()
  };
};

const extractCardRecords = async (page, companyName) => {
  const tableRows = await page.locator('tr, [role="row"]').all().catch(() => []);
  const results = [];

  for (const row of tableRows) {
    const visible = await row.isVisible().catch(() => false);
    if (!visible) continue;
    const summary = await row.textContent({ timeoutMs: 5000 }).catch(() => '');
    const text = String(summary || '').trim();
    if (!text) continue;
    if (!text.toLowerCase().includes(String(companyName || '').toLowerCase())) continue;

    const { cells } = await textFromRow(row);
    const accountIdentifier = cells[1] || cells[0] || companyName;
    const currentStatus = cells.find((value) => /active|blocked|locked|suspended|pending|unknown|open|closed|ready|review/i.test(value)) || 'unknown';
    const lastSeenStatus = currentStatus;

    results.push({
      companyName,
      accountIdentifier,
      currentStatus,
      lastSeenStatus,
      rowSummary: text,
      rowCells: cells,
      sourceMetadata: {
        row_text: text,
        row_cells: cells
      }
    });
  }

  return results;
};

export const captureCardStatusForCompany = async (companyName, options = {}) => {
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

  const cardNav = await findCardNavigation(activePage);
  if (!cardNav) {
    throw new Error('Card status navigation was not found in CMP');
  }
  await cardNav.click({ timeoutMs: 15000 });

  const searchBox = await findSearchBox(activePage);
  if (!searchBox) {
    throw new Error('Search box was not found in CMP card status view');
  }

  await searchBox.click({ timeoutMs: 15000 });
  await searchBox.fill(companyName, { timeoutMs: 15000 });
  await searchBox.press('Enter', { timeoutMs: 15000 });
  await sleep(1000);

  const cardRecords = await extractCardRecords(activePage, companyName);
  const rowText = await activePage.locator('body').innerText({ timeoutMs: 10000 }).catch(() => '');

  if (browser && typeof browser.disconnect === 'function') {
    browser.disconnect();
  }

  return {
    companyName,
    rowText: String(rowText || '').trim(),
    cards: cardRecords
  };
};
