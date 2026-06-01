import { DEFAULT_PORTFOLIO_SHEET_NAME, DEFAULT_PORTFOLIO_SOURCE_URL, loadPortfolioFromSource } from './portfolio.js';
import { captureOwnerAccessForCompany } from './cmpOwners.js';

const boot = async () => {
  const mode = String(process.env.HERMES_MODE || 'dev').trim();
  const sourceUrl = String(process.env.HERMES_ZOHO_XLSX_URL || DEFAULT_PORTFOLIO_SOURCE_URL).trim();
  const sheetName = String(process.env.HERMES_ZOHO_SHEET_NAME || DEFAULT_PORTFOLIO_SHEET_NAME).trim();
  const command = String(process.argv[2] || 'boot').trim();

  console.log(`[Hermes] booting in ${mode} mode`);
  console.log(`[Hermes] portfolio source: ${sheetName}`);
  console.log('[Hermes] workers: portfolio loader, CMP access, CMP card status, audit writer');

  try {
    const portfolio = await loadPortfolioFromSource({
      sourceUrl,
      desiredSheetName: sheetName
    });

    console.log(`[Hermes] loaded ${portfolio.companies.length} companies from ${portfolio.sheetName}`);

    if (command === 'owners') {
      const companyName = String(process.env.HERMES_TARGET_COMPANY || portfolio.companies[0]?.companyName || '').trim();
      if (!companyName) {
        throw new Error('No company available for the owners worker');
      }
      const ownerResult = await captureOwnerAccessForCompany(companyName);
      console.log(JSON.stringify(ownerResult, null, 2));
    }

    console.log('[Hermes] ready for the first orchestration layer');
  } catch (error) {
    console.error(`[Hermes] portfolio load failed: ${error.message}`);
    process.exitCode = 1;
  }
};

boot();
