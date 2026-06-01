import { createSyncAuditRun, finishSyncAuditRun, upsertOwnerAccessRows } from './hermesStore.js';
import { captureOwnerAccessForCompany } from './cmpOwners.js';

const toOwnerAccessRow = (company, snapshot) => ({
  company_key: company.companyKey,
  company_name: company.companyName,
  owner_name: snapshot.ownerName || null,
  owner_email: snapshot.ownerEmail || null,
  username: snapshot.username || null,
  password_ciphertext: snapshot.password || null,
  password_hint: snapshot.passwordPopup || null,
  password_reference: snapshot.rowSummary || null,
  last_synced_at: new Date().toISOString(),
  source: 'cmp',
  source_metadata: {
    row_cells: snapshot.rowCells || [],
    popup_text: snapshot.passwordPopup || null,
    row_text: snapshot.rowText || null
  },
  updated_at: new Date().toISOString()
});

export const runOwnersSync = async ({
  supabase,
  portfolio,
  baseUrl,
  companyFilter = null
}) => {
  if (!supabase) {
    throw new Error('Supabase client is required for owners sync');
  }
  if (!portfolio?.companies?.length) {
    throw new Error('Portfolio is empty');
  }

  const filteredCompanies = companyFilter
    ? portfolio.companies.filter((company) => String(company.companyName || '').toLowerCase().includes(String(companyFilter).toLowerCase()))
    : portfolio.companies;

  const audit = await createSyncAuditRun(supabase, {
    runType: 'owners_sync',
    metadata: {
      portfolio_sheet: portfolio.sheetName,
      company_filter: companyFilter || null
    }
  });

  const results = [];
  let updatedCount = 0;

  try {
    for (const company of filteredCompanies) {
      const snapshot = await captureOwnerAccessForCompany(company.companyName, { baseUrl });
      const row = toOwnerAccessRow(company, snapshot);
      await upsertOwnerAccessRows(supabase, [row]);
      results.push({ company: company.companyName, ok: true });
      updatedCount += 1;
      console.log(`[Hermes] synced owner access for ${company.companyName}`);
    }

    await finishSyncAuditRun(supabase, audit.id, {
      recordsFound: filteredCompanies.length,
      recordsUpdated: updatedCount,
      metadata: {
        portfolio_sheet: portfolio.sheetName,
        company_filter: companyFilter || null,
        finished: true
      }
    });
  } catch (error) {
    await finishSyncAuditRun(supabase, audit.id, {
      recordsFound: filteredCompanies.length,
      recordsUpdated: updatedCount,
      errorMessage: error.message,
      metadata: {
        portfolio_sheet: portfolio.sheetName,
        company_filter: companyFilter || null,
        finished: false
      }
    }).catch(() => {});
    throw error;
  }

  return {
    auditId: audit.id,
    totalCompanies: filteredCompanies.length,
    updatedCount,
    results
  };
};
