import { DEFAULT_PORTFOLIO_SHEET_NAME, DEFAULT_PORTFOLIO_SOURCE_URL, loadPortfolioFromSource } from './portfolio.js';

const boot = async () => {
  const mode = String(process.env.HERMES_MODE || 'dev').trim();
  const sourceUrl = String(process.env.HERMES_ZOHO_XLSX_URL || DEFAULT_PORTFOLIO_SOURCE_URL).trim();
  const sheetName = String(process.env.HERMES_ZOHO_SHEET_NAME || DEFAULT_PORTFOLIO_SHEET_NAME).trim();

  console.log(`[Hermes] booting in ${mode} mode`);
  console.log(`[Hermes] portfolio source: ${sheetName}`);
  console.log('[Hermes] workers: portfolio loader, CMP access, CMP card status, audit writer');

  try {
    const portfolio = await loadPortfolioFromSource({
      sourceUrl,
      desiredSheetName: sheetName
    });

    console.log(`[Hermes] loaded ${portfolio.companies.length} companies from ${portfolio.sheetName}`);
    console.log('[Hermes] ready for the first orchestration layer');
  } catch (error) {
    console.error(`[Hermes] portfolio load failed: ${error.message}`);
    process.exitCode = 1;
  }
};

boot();
