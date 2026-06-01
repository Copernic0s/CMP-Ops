import { DEFAULT_PORTFOLIO_SHEET_NAME, DEFAULT_PORTFOLIO_SOURCE_URL, loadPortfolioFromSource } from './portfolio.js';
import { captureOwnerAccessForCompany } from './cmpOwners.js';
import { createHermesSupabaseClient } from './hermesStore.js';
import { loadHermesSnapshot } from './hermesRead.js';
import { runCardStatusSync, runOwnersSync } from './hermesSync.js';

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
      const supabase = createHermesSupabaseClient();
      const baseUrl = String(process.env.HERMES_CMP_URL || '').trim();
      if (!baseUrl) {
        throw new Error('HERMES_CMP_URL is required for the owners worker');
      }

      if (process.env.HERMES_TARGET_COMPANY) {
        const companyName = String(process.env.HERMES_TARGET_COMPANY || '').trim();
        const ownerResult = await captureOwnerAccessForCompany(companyName, { baseUrl });
        console.log(JSON.stringify(ownerResult, null, 2));
      } else {
        const syncResult = await runOwnersSync({
          supabase,
          portfolio,
          baseUrl
        });
        console.log(JSON.stringify(syncResult, null, 2));
      }
    } else if (command === 'cards') {
      const supabase = createHermesSupabaseClient();
      const baseUrl = String(process.env.HERMES_CMP_URL || '').trim();
      if (!baseUrl) {
        throw new Error('HERMES_CMP_URL is required for the card status worker');
      }

      const syncResult = await runCardStatusSync({
        supabase,
        portfolio,
        baseUrl
      });
      console.log(JSON.stringify(syncResult, null, 2));
    } else if (command === 'snapshot') {
      const supabase = createHermesSupabaseClient();
      const snapshot = await loadHermesSnapshot(supabase);
      console.log(JSON.stringify(snapshot, null, 2));
    }

    console.log('[Hermes] ready for the first orchestration layer');
  } catch (error) {
    console.error(`[Hermes] portfolio load failed: ${error.message}`);
    process.exitCode = 1;
  }
};

boot();
