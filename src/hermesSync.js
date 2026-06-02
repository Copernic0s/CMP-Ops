import {
  createSyncAuditRun,
  finishSyncAuditRun,
  upsertCardInventoryRows,
  upsertCardStatusRows,
  upsertOwnerAccessRows
} from './hermesStore.js';
import { captureOwnerAccessForCompany } from './cmpOwners.js';
import { captureCardStatusForCompany } from './cmpCards.js';
import { captureCardInventory, normalizeInventoryCompanyKey } from './cmpInventory.js';

const buildCompanyKeySet = (portfolio) =>
  new Set((portfolio?.companies || []).map((company) => String(company.companyKey || '').trim()).filter(Boolean));

const summarizeMatchedInventoryRows = (rows) => {
  const companyCounts = new Map();

  for (const row of rows || []) {
    const companyName = String(row.company_name || '').trim();
    if (!companyName) continue;
    companyCounts.set(companyName, (companyCounts.get(companyName) || 0) + 1);
  }

  return [...companyCounts.entries()]
    .map(([company, cards]) => ({ company, cards }))
    .sort((left, right) => right.cards - left.cards || left.company.localeCompare(right.company))
    .slice(0, 10);
};

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

const toCardStatusRows = (company, snapshot) =>
  (snapshot.cards || []).map((card) => ({
    company_key: company.companyKey,
    company_name: company.companyName,
    account_identifier: card.accountIdentifier || company.companyName,
    current_status: String(card.currentStatus || 'unknown').trim().toLowerCase(),
    last_seen_status: String(card.lastSeenStatus || card.currentStatus || 'unknown').trim().toLowerCase(),
    status_changed_at: new Date().toISOString(),
    last_synced_at: new Date().toISOString(),
    source: 'cmp',
    source_metadata: {
      row_text: card.rowSummary || '',
      row_cells: card.rowCells || [],
      ...card.sourceMetadata
    },
    updated_at: new Date().toISOString()
  }));

export const runCardStatusSync = async ({
  supabase,
  portfolio,
  baseUrl,
  companyFilter = null
}) => {
  if (!supabase) {
    throw new Error('Supabase client is required for card status sync');
  }
  if (!portfolio?.companies?.length) {
    throw new Error('Portfolio is empty');
  }

  const filteredCompanies = companyFilter
    ? portfolio.companies.filter((company) => String(company.companyName || '').toLowerCase().includes(String(companyFilter).toLowerCase()))
    : portfolio.companies;

  const audit = await createSyncAuditRun(supabase, {
    runType: 'card_status_sync',
    metadata: {
      portfolio_sheet: portfolio.sheetName,
      company_filter: companyFilter || null
    }
  });

  const results = [];
  let updatedCount = 0;
  let foundCount = 0;

  try {
    for (const company of filteredCompanies) {
      const snapshot = await captureCardStatusForCompany(company.companyName, { baseUrl });
      const rows = toCardStatusRows(company, snapshot);
      await upsertCardStatusRows(supabase, rows);
      foundCount += rows.length;
      updatedCount += rows.length;
      results.push({ company: company.companyName, cards: rows.length, ok: true });
      console.log(`[Hermes] synced card status for ${company.companyName} (${rows.length} cards)`);
    }

    await finishSyncAuditRun(supabase, audit.id, {
      recordsFound: foundCount,
      recordsUpdated: updatedCount,
      metadata: {
        portfolio_sheet: portfolio.sheetName,
        company_filter: companyFilter || null,
        finished: true
      }
    });
  } catch (error) {
    await finishSyncAuditRun(supabase, audit.id, {
      recordsFound: foundCount,
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
    recordsFound: foundCount,
    updatedCount,
    results
  };
};

export const runCardInventorySync = async ({
  supabase,
  portfolio,
  baseUrl
}) => {
  if (!supabase) {
    throw new Error('Supabase client is required for card inventory sync');
  }
  if (!portfolio?.companies?.length) {
    throw new Error('Portfolio is empty');
  }

  const audit = await createSyncAuditRun(supabase, {
    runType: 'card_inventory_sync',
    metadata: {
      source: 'company-account-cards-list',
      portfolio_sheet: portfolio.sheetName
    }
  });

  try {
    const snapshot = await captureCardInventory({ baseUrl });
    const portfolioKeys = buildCompanyKeySet(portfolio);
    const mappedRows = (snapshot.rows || []).map((row) => ({
      card_number: String(row.cardNumber || '').trim(),
      company_name: String(row.companyName || '').trim(),
      company_key: normalizeInventoryCompanyKey(row.companyName || ''),
      organization: String(row.organization || '').trim() || null,
      efs_account: String(row.efsAccount || '').trim() || null,
      company_status: String(row.companyStatus || '').trim().toLowerCase() || 'unknown',
      card_status: String(row.cardStatus || '').trim().toLowerCase() || 'unknown',
      driver_name: String(row.driverName || '').trim() || null,
      driver_id: String(row.driverId || '').trim() || null,
      unit_number: String(row.unitNumber || '').trim() || null,
      last_used_date: String(row.lastUsedDate || '').trim() || null,
      source: 'cmp',
      source_metadata: row.source_metadata || {
        page_index: row.source_metadata?.page_index || null,
        row_cells: row.rowCells || [],
        row_summary: row.rowSummary || ''
      },
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })).filter((row) => row.card_number);

    const rows = mappedRows.filter((row) => portfolioKeys.has(String(row.company_key || '').trim()));
    const summary = summarizeMatchedInventoryRows(rows);

    await upsertCardInventoryRows(supabase, rows);

    console.log(
      `[Hermes] inventory summary: start page ${snapshot.startPage || 1}, end page ${snapshot.endPage || snapshot.startPage || 1}, ` +
      `pages processed ${snapshot.pagesProcessed || 0}, discovered ${mappedRows.length}, matched ${rows.length}`
    );
    if (summary.length > 0) {
      console.log(`[Hermes] inventory top matches: ${summary.map((item) => `${item.company} (${item.cards})`).join(' | ')}`);
    }

    await finishSyncAuditRun(supabase, audit.id, {
      recordsFound: rows.length,
      recordsUpdated: rows.length,
      metadata: {
        source: 'company-account-cards-list',
        portfolio_sheet: portfolio.sheetName,
        discovered_rows: mappedRows.length,
        matched_rows: rows.length,
        start_page: snapshot.startPage || null,
        end_page: snapshot.endPage || null,
        pages_processed: snapshot.pagesProcessed || null,
        top_matches: summary,
        finished: true
      }
    });

    return {
      auditId: audit.id,
      totalRecords: rows.length,
      discoveredRecords: mappedRows.length,
      matchedRecords: rows.length,
      results: rows.length,
      startPage: snapshot.startPage || null,
      endPage: snapshot.endPage || null,
      pagesProcessed: snapshot.pagesProcessed || null,
      topMatches: summary
    };
  } catch (error) {
    await finishSyncAuditRun(supabase, audit.id, {
      recordsFound: 0,
      recordsUpdated: 0,
      errorMessage: error.message,
      metadata: {
        source: 'company-account-cards-list',
        portfolio_sheet: portfolio.sheetName,
        finished: false
      }
    }).catch(() => {});
    throw error;
  }
};
