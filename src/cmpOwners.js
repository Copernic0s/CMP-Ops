import { chromium } from 'playwright-core';
import { ensureChromeDebugger, resolveChromeSettings } from './chrome.js';

const OWNERS_TAB_NAMES = ['Owners', 'User management', 'Users', 'Owners & users'];
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

const findOwnersNavigation = async (page) =>
  firstVisible(OWNERS_TAB_NAMES.map((label) => page.getByRole('tab', { name: label, exact: false })))
  || firstVisible(OWNERS_TAB_NAMES.map((label) => page.getByRole('button', { name: label, exact: false })))
  || firstVisible(OWNERS_TAB_NAMES.map((label) => page.getByText(label, { exact: false })));

const findSearchBox = async (page) =>
  firstVisible([
    page.getByRole('textbox', { name: 'Search', exact: false }),
    page.getByPlaceholder('Search', { exact: false }),
    page.getByPlaceholder('Search company', { exact: false }),
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

  await openPasswordPopup(activePage, row);
  const passwordPayload = await readPopupPassword(activePage);

  const result = {
    companyName,
    rowText: String(rowText || '').trim(),
    passwordPopup: passwordPayload.popupText,
    clipboardPassword: passwordPayload.clipboardText
  };

  if (browser) {
    await browser.close().catch(() => {});
  }

  return result;
};
