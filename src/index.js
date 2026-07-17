import { DEFAULT_PORTFOLIO_SHEET_NAME, DEFAULT_PORTFOLIO_SOURCE_URL, loadPortfolioFromSource } from './portfolio.js';
import { captureOwnerAccessForCompany } from './cmpOwners.js';
import { startHermesApi } from './hermesApi.js';
import { loadLocalEnvFile } from './env.js';
import { createHermesSupabaseClient, upsertOwnerAccessRows } from './hermesStore.js';
import { loadHermesSnapshot } from './hermesRead.js';
import { runCardInventorySync, runCardStatusSync, runOwnersSync } from './hermesSync.js';
import { normalizeCompanyKey } from './companyKey.js';

const boot = async () => {
  const envLoad = loadLocalEnvFile();
  const mode = String(process.env.HERMES_MODE || 'dev').trim();
  const sourceUrl = String(process.env.HERMES_ZOHO_XLSX_URL || DEFAULT_PORTFOLIO_SOURCE_URL).trim();
  const sheetName = String(process.env.HERMES_ZOHO_SHEET_NAME || DEFAULT_PORTFOLIO_SHEET_NAME).trim();
  const command = String(process.argv[2] || 'boot').trim();

  console.log(`[Hermes] booting in ${mode} mode`);
  console.log(`[Hermes] portfolio source: ${sheetName}`);
  console.log('[Hermes] workers: portfolio loader, CMP access, CMP card status, audit writer');
  if (envLoad.loaded) {
    console.log(`[Hermes] loaded env file ${envLoad.path} (${envLoad.loadedCount} vars)`);
  }

  try {
    if (command === 'owners') {
      const portfolio = await loadPortfolioFromSource({
        sourceUrl,
        desiredSheetName: sheetName
      });
      console.log(`[Hermes] loaded ${portfolio.companies.length} companies from ${portfolio.sheetName}`);

      const supabase = createHermesSupabaseClient();
      const baseUrl = String(process.env.HERMES_CMP_URL || '').trim();
      if (!baseUrl) {
        throw new Error('HERMES_CMP_URL is required for the owners worker');
      }

      if (process.env.HERMES_TARGET_COMPANY) {
        const companyName = String(process.env.HERMES_TARGET_COMPANY || '').trim();
        const companyRecord =
          portfolio.companies.find((company) => String(company.companyName || '').trim().toLowerCase() === companyName.toLowerCase()) ||
          portfolio.companies.find((company) => normalizeCompanyKey(company.companyName || '') === normalizeCompanyKey(companyName));
        if (!companyRecord) {
          throw new Error(`Company "${companyName}" was not found in portfolio sheet ${portfolio.sheetName}`);
        }
        const ownerResult = await captureOwnerAccessForCompany(companyName, { baseUrl });
        const now = new Date().toISOString();
        await upsertOwnerAccessRows(supabase, [{
          company_key: companyRecord.companyKey,
          company_name: companyRecord.companyName,
          owner_name: ownerResult.ownerName || null,
          owner_email: ownerResult.ownerEmail || null,
          username: ownerResult.username || null,
          password_ciphertext: ownerResult.password || null,
          password_hint: ownerResult.passwordPopup || null,
          password_reference: ownerResult.rowSummary || null,
          last_synced_at: now,
          source: 'cmp',
          source_metadata: {
            row_cells: ownerResult.rowCells || [],
            popup_text: ownerResult.passwordPopup || null,
            row_text: ownerResult.rowText || null
          },
          updated_at: now
        }]);
        console.log(JSON.stringify({
          companyName: ownerResult.companyName || companyRecord.companyName,
          ownerName: ownerResult.ownerName || null,
          ownerEmail: ownerResult.ownerEmail || null,
          username: ownerResult.username || null,
          rowCellCount: Array.isArray(ownerResult.rowCells) ? ownerResult.rowCells.length : 0
        }, null, 2));
        console.log(`[Hermes] seeded owner access for ${companyRecord.companyName}`);
      } else {
        const syncResult = await runOwnersSync({
          supabase,
          portfolio,
          baseUrl
        });
        console.log(JSON.stringify(syncResult, null, 2));
      }
    } else if (command === 'cards') {
      const portfolio = await loadPortfolioFromSource({
        sourceUrl,
        desiredSheetName: sheetName
      });
      console.log(`[Hermes] loaded ${portfolio.companies.length} companies from ${portfolio.sheetName}`);

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
    } else if (command === 'inventory') {
      const portfolio = await loadPortfolioFromSource({
        sourceUrl,
        desiredSheetName: sheetName
      });
      console.log(`[Hermes] loaded ${portfolio.companies.length} companies from ${portfolio.sheetName}`);

      const supabase = createHermesSupabaseClient();
      const baseUrl = String(process.env.HERMES_CMP_URL || '').trim();
      if (!baseUrl) {
        throw new Error('HERMES_CMP_URL is required for the inventory worker');
      }

      const syncResult = await runCardInventorySync({
        supabase,
        portfolio,
        baseUrl
      });
      console.log(JSON.stringify(syncResult, null, 2));
    } else if (command === 'api') {
      const supabase = createHermesSupabaseClient();
      await startHermesApi({
        supabase,
        mode
      });
      return;
    }

    console.log('[Hermes] ready for the first orchestration layer');
  } catch (error) {
    console.error(`[Hermes] portfolio load failed: ${error.message}`);
    process.exitCode = 1;
  }
};

boot();
