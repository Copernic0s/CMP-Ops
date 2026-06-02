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
const DEFAULT_START_PAGE = 1;

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

const resolveInventoryStartPage = (env = process.env) => {
  const requested = Number(env.HERMES_INVENTORY_START_PAGE || DEFAULT_START_PAGE);
  if (!Number.isFinite(requested) || requested < 1) return 1;
  return Math.floor(requested);
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
  const scope = await findPaginationScope(page);
  const searchRoots = scope ? [scope, page] : [page];
  const candidates = [];

  for (const root of searchRoots) {
    candidates.push(
      ...(await Promise.all([
        root.getByRole('button', { name: /next/i }).all().catch(() => []),
        root.locator('button, a, [role="button"], [tabindex]').filter({ hasText: /next/i }).all().catch(() => []),
        root.getByText(/next/i).all().catch(() => [])
      ]))
    );
  }

  for (const bucket of candidates) {
    for (let index = bucket.length - 1; index >= 0; index -= 1) {
      const candidate = bucket[index];
      const visible = await candidate.isVisible().catch(() => false);
      if (visible) return candidate;
    }
  }

  return null;
};

const getVisibleButtonLabel = async (candidate) => {
  const ariaLabel = String(await candidate.getAttribute('aria-label').catch(() => '') || '').trim();
  const text = String(await candidate.innerText().catch(() => '') || '').trim();
  return ariaLabel || text;
};

const findPaginationScope = async (page) => {
  const markers = [
    page.getByText(/\b\d+-\d+ of \d+ items\b/i),
    page.getByText(/previous/i),
    page.getByText(/next/i),
    page.getByText(/go to:/i)
  ];

  for (const marker of markers) {
    const count = await marker.count().catch(() => 0);
    for (let index = 0; index < count; index += 1) {
      const candidate = marker.nth(index);
      const visible = await candidate.isVisible().catch(() => false);
      if (!visible) continue;

      let current = candidate;
      for (let depth = 0; depth < 8; depth += 1) {
        current = current.locator('xpath=ancestor::*[1]');
        const text = String(await current.innerText().catch(() => '') || '').trim();
        if (/\b(previous|next|go to:)\b/i.test(text) && /\b\d+-\d+ of \d+ items\b/i.test(text)) {
          return current;
        }
        if (/\b(previous|next|go to:)\b/i.test(text) && /\b\d+\s+\.\.\.\s+\d+\b/i.test(text)) {
          return current;
        }
      }
    }
  }

  return null;
};

const findGoToPageInput = async (page) => {
  const scope = await findPaginationScope(page);
  const roots = scope ? [scope, page] : [page];
  const candidates = [];

  for (const root of roots) {
    candidates.push(
      ...await root.getByRole('spinbutton').all().catch(() => []),
      ...await root.getByRole('textbox', { name: /go to/i }).all().catch(() => []),
      ...await root.locator('input').all().catch(() => [])
    );
  }

  for (const candidate of candidates) {
    const visible = await candidate.isVisible().catch(() => false);
    if (!visible) continue;

    const label = String(await getVisibleButtonLabel(candidate).catch(() => '') || '').trim();
    const placeholder = String(await candidate.getAttribute('placeholder').catch(() => '') || '').trim();
    const ariaLabel = String(await candidate.getAttribute('aria-label').catch(() => '') || '').trim();
    const value = String(await candidate.inputValue().catch(() => '') || '').trim();
    const combined = `${label} ${placeholder} ${ariaLabel} ${value}`.toLowerCase();

    if (combined.includes('go to')) {
      return candidate;
    }
  }

  return null;
};

const findCurrentPaginationPage = async (page) => {
  const candidates = await page
    .locator('button[aria-current="page"], button[data-state="active"]')
    .filter({ hasText: /^\d+$/ })
    .all()
    .catch(() => []);

  for (const candidate of candidates) {
    const visible = await candidate.isVisible().catch(() => false);
    if (!visible) continue;
    const text = String(await candidate.textContent().catch(() => '') || '').trim();
    const pageNumber = Number(text);
    if (Number.isFinite(pageNumber) && pageNumber > 0) {
      return pageNumber;
    }
  }

  return null;
};

const parsePaginationRange = (text) => {
  const match = String(text || '').match(/\b(\d+)-(\d+) of (\d+) items\b/i);
  if (!match) return null;
  return {
    start: Number(match[1]),
    end: Number(match[2]),
    total: Number(match[3])
  };
};

const findPaginationRangeText = async (page) => {
  const candidates = await page
    .getByText(/\b\d+-\d+ of \d+ items\b/i)
    .all()
    .catch(() => []);

  for (const candidate of candidates) {
    const visible = await candidate.isVisible().catch(() => false);
    if (!visible) continue;

    const text = String(await candidate.textContent().catch(() => '') || '').trim();
    if (parsePaginationRange(text)) return text;
  }

  return '';
};

const findCurrentPageFromFooter = async (page, pageSize) => {
  const rangeText = await findPaginationRangeText(page);
  const range = parsePaginationRange(rangeText);
  if (!range) return null;

  const size = Number(pageSize);
  if (!Number.isFinite(size) || size <= 0) return null;

  return Math.max(1, Math.ceil(range.start / size));
};

const jumpToInventoryPage = async (page, targetPage, log) => {
  const desiredPage = Number(targetPage);
  if (!Number.isFinite(desiredPage) || desiredPage < 1) return false;

  const input = await findGoToPageInput(page);
  if (!input) {
    log('go to page control not found');
    return false;
  }

  const previousSignature = await getInventoryTableSignature(page);
  log(`jumping directly to page ${desiredPage}`);
  await input.scrollIntoViewIfNeeded().catch(() => {});
  await input.click({ timeoutMs: 10000 }).catch(() => {});
  await input.press('Control+A').catch(() => {});
  await input.press('Backspace').catch(() => {});
  await input.type(String(desiredPage), { delay: 20 }).catch(() => {});
  await input.press('Enter').catch(() => {});

  const transition = await waitForPaginationTransition(page, desiredPage - 1, previousSignature, log);
  if (transition.changed) {
    if (transition.pageNumber) {
      log(`active page is now ${transition.pageNumber}`);
    } else {
      log(`inventory table changed after jump to page ${desiredPage}`);
    }
    return true;
  }

  log(`jump to page ${desiredPage} did not change the table`);
  return false;
};

const waitForPaginationTransition = async (page, previousPageNumber, previousSignature, log) => {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    await sleep(250);
    const currentPageNumber = await findCurrentPaginationPage(page);
    const currentSignature = await getInventoryTableSignature(page);
    if (Number.isFinite(previousPageNumber) && currentPageNumber && currentPageNumber !== previousPageNumber) {
      return { pageNumber: currentPageNumber, changed: true };
    }
    if (!Number.isFinite(previousPageNumber) && currentPageNumber) {
      return { pageNumber: currentPageNumber, changed: true };
    }
    if (previousSignature && currentSignature && currentSignature !== previousSignature) {
      return { pageNumber: currentPageNumber || null, changed: true };
    }
  }

  log('pagination click did not update the active page or table body');
  return { pageNumber: null, changed: false };
};

const findVisiblePaginationPageButtons = async (page) => {
  const scope = await findPaginationScope(page);
  const buttons = await (scope || page).locator('button, a, [role="button"], [tabindex]').all().catch(() => []);
  const results = [];

  for (const candidate of buttons) {
    const visible = await candidate.isVisible().catch(() => false);
    if (!visible) continue;

    const label = String(await getVisibleButtonLabel(candidate).catch(() => '') || '').trim();
    const numericMatch = label.match(/^\s*(\d+)\s*$/) || String(await candidate.textContent().catch(() => '') || '').trim().match(/^\s*(\d+)\s*$/);
    if (!numericMatch) continue;

    const pageNumber = Number(numericMatch[1]);
    if (!Number.isFinite(pageNumber) || pageNumber <= 0) continue;
    results.push({ candidate, pageNumber });
  }

  results.sort((left, right) => left.pageNumber - right.pageNumber);
  return results;
};

const findPaginationPageButton = async (page, targetPageNumber) => {
  if (!Number.isFinite(targetPageNumber) || targetPageNumber <= 0) return null;
  const label = new RegExp(`^${targetPageNumber}$`);
  const scope = await findPaginationScope(page);
  const roots = scope ? [scope, page] : [page];
  const candidates = [];

  for (const root of roots) {
    candidates.push(...await root.getByRole('button', { name: label }).all().catch(() => []));
    candidates.push(...await root.locator('button, a, [role="button"], [tabindex]').filter({ hasText: label }).all().catch(() => []));
    candidates.push(...await root.getByText(label).all().catch(() => []));
  }

  for (const candidate of candidates) {
    const visible = await candidate.isVisible().catch(() => false);
    if (visible) return candidate;
  }
  return null;
};

const getInventoryTableSignature = async (page) => {
  const bodyText = String(await page.locator('table tbody').innerText().catch(() => '') || '').trim();
  const rowCount = await page.locator('table tbody tr').count().catch(() => 0);
  return `${rowCount}:${bodyText.slice(0, 240)}`;
};

const waitForInventoryPageChange = async (page, previousSignature, log) => {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    await sleep(250);
    const currentSignature = await getInventoryTableSignature(page);
    if (currentSignature && currentSignature !== previousSignature) {
      return true;
    }
  }

  log('pagination click did not change the table body');
  return false;
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

const clickNextPage = async (page, log) => {
  const currentPageNumber = await findCurrentPaginationPage(page)
    || await findCurrentPageFromFooter(page, resolveInventoryPageSize(process.env));
  const numericButtons = await findVisiblePaginationPageButtons(page);
  const preferredTarget = Number.isFinite(currentPageNumber) ? currentPageNumber + 1 : null;
  const currentSignature = await getInventoryTableSignature(page);

  let numericCandidate = null;
  if (preferredTarget) {
    numericCandidate = numericButtons.find(({ pageNumber }) => pageNumber === preferredTarget) || null;
  }
  if (!numericCandidate) {
    numericCandidate = numericButtons.find(({ pageNumber }) => pageNumber > (Number.isFinite(currentPageNumber) ? currentPageNumber : 1)) || null;
  }

  if (numericCandidate) {
    log(`clicking numeric page ${numericCandidate.pageNumber}`);
    const disabled = await numericCandidate.candidate.isDisabled().catch(() => true);
    if (!disabled) {
      await numericCandidate.candidate.scrollIntoViewIfNeeded().catch(() => {});
      await numericCandidate.candidate.click({ timeoutMs: 15000, force: true });
      const transition = await waitForPaginationTransition(page, currentPageNumber, currentSignature, log);
      if (transition.changed) {
        if (transition.pageNumber) {
          log(`active page is now ${transition.pageNumber}`);
        } else {
          log('inventory table body changed after numeric page click');
        }
        return true;
      }
      log(`numeric page ${numericCandidate.pageNumber} did not advance the table`);
    } else {
      log(`numeric page ${numericCandidate.pageNumber} is disabled`);
    }
  }

  if (numericButtons.length === 0) {
    const labels = await page
      .getByRole('button')
      .all()
      .catch(() => []);
    const visibleLabels = [];
    for (const candidate of labels) {
      const visible = await candidate.isVisible().catch(() => false);
      if (!visible) continue;
      const label = String(await getVisibleButtonLabel(candidate).catch(() => '') || '').trim();
      if (label) visibleLabels.push(label);
    }
    log(`no numeric pagination buttons found; visible buttons: ${visibleLabels.slice(0, 20).join(' | ')}`);
  }

  const nextButton = await findPaginationButton(page);
  if (!nextButton) {
    log('pagination button not found');
    return false;
  }

  const disabled = await nextButton.isDisabled().catch(() => true);
  if (disabled) {
    log('pagination button is disabled');
    return false;
  }

  log('clicking next pagination control');
  await nextButton.scrollIntoViewIfNeeded().catch(() => {});
  await nextButton.click({ timeoutMs: 15000, force: true });
  const transition = await waitForPaginationTransition(page, currentPageNumber, currentSignature, log);
  return Boolean(transition.changed);
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
  const startPage = resolveInventoryStartPage(process.env);
  await setInventoryPageSize(activePage, desiredPageSize, log);
  await waitForInventoryTable(activePage, log);

  let effectiveStartPage = await findCurrentPageFromFooter(activePage, desiredPageSize)
    || await findCurrentPaginationPage(activePage)
    || 1;

  if (startPage > 1) {
    const jumped = await jumpToInventoryPage(activePage, startPage, log);
    if (!jumped) {
      log(`could not jump directly to page ${startPage}, continuing from current page`);
    }
    await waitForInventoryTable(activePage, log);
    effectiveStartPage = await findCurrentPageFromFooter(activePage, desiredPageSize)
      || await findCurrentPaginationPage(activePage)
      || effectiveStartPage;
    if (jumped) {
      effectiveStartPage = startPage;
    }
  }

  const rows = [];
  const seen = new Set();
  const maxPages = Number(process.env.HERMES_INVENTORY_MAX_PAGES || 500);
  let pagesProcessed = 0;
  let lastPageProcessed = effectiveStartPage;

  for (let pageIndex = 0; pageIndex < maxPages; pageIndex += 1) {
    const currentLogicalPage = effectiveStartPage + pageIndex;
    await waitForInventoryTable(activePage, log);
    const headers = await gatherTableHeaders(activePage);
    log(`reading page ${currentLogicalPage} with ${headers.length} headers`);
    const pageRows = await extractRowsFromPage(activePage, headers);
    log(`found ${pageRows.length} visible rows on page ${currentLogicalPage}`);

    for (const row of pageRows) {
      const key = String(row.cardNumber || '').trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      rows.push({
        ...row,
        source: 'cmp',
        source_metadata: {
          page_index: currentLogicalPage,
          row_cells: row.rowCells || [],
          row_summary: row.rowSummary || ''
        }
      });
    }
    pagesProcessed += 1;
    lastPageProcessed = currentLogicalPage;

    const advanced = await clickNextPage(activePage, log);
    if (!advanced) {
      log('pagination ended');
      break;
    }
    log(`advanced to next page after ${currentLogicalPage}`);
  }

  log(`inventory crawl complete with ${rows.length} unique card rows`);

  if (browser && typeof browser.disconnect === 'function') {
    browser.disconnect();
  }

  return {
    totalRecords: rows.length,
    rows,
    startPage: effectiveStartPage,
    endPage: lastPageProcessed,
    pagesProcessed
  };
};
