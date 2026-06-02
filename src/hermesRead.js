import { normalizeCompanyKey } from './companyKey.js';

const readTable = async (
  supabase,
  table,
  { limit = 20, orderBy = 'last_synced_at', ascending = false, eqFilters = [] } = {}
) => {
  let query = supabase.from(table).select('*');

  for (const filter of eqFilters) {
    if (!filter || !filter.column) continue;
    query = query.eq(filter.column, filter.value);
  }

  if (orderBy) {
    query = query.order(orderBy, { ascending });
  }

  if (Number.isFinite(limit) && limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to read ${table}: ${error.message}`);
  }

  return data || [];
};

const TABLE_MAP = {
  ownerAccess: {
    table: 'cmp_owner_access',
    orderBy: 'last_synced_at'
  },
  cardStatus: {
    table: 'cmp_card_status',
    orderBy: 'last_synced_at'
  },
  cardInventory: {
    table: 'cmp_card_inventory',
    orderBy: 'last_synced_at'
  },
  syncAudit: {
    table: 'cmp_sync_audit',
    orderBy: 'started_at'
  }
};

export const loadHermesTableSnapshot = async (supabase, tableKey, { limit = 20 } = {}) => {
  if (!supabase) {
    throw new Error('Supabase client is required to read Hermes snapshots');
  }

  const config = TABLE_MAP[tableKey];
  if (!config) {
    throw new Error(`Unknown Hermes snapshot table: ${tableKey}`);
  }

  return readTable(supabase, config.table, { limit, orderBy: config.orderBy, ascending: false });
};

export const loadHermesSnapshot = async (supabase, { limit = 20 } = {}) => {
  if (!supabase) {
    throw new Error('Supabase client is required to read Hermes snapshots');
  }

  const [ownerAccess, cardStatus, cardInventory, syncAudit] = await Promise.all([
    loadHermesTableSnapshot(supabase, 'ownerAccess', { limit }),
    loadHermesTableSnapshot(supabase, 'cardStatus', { limit }),
    loadHermesTableSnapshot(supabase, 'cardInventory', { limit }),
    loadHermesTableSnapshot(supabase, 'syncAudit', { limit })
  ]);

  return {
    ownerAccess,
    cardStatus,
    cardInventory,
    syncAudit
  };
};

const getCompanyNameFromRows = (rows = [], fallback = '') => {
  for (const row of rows) {
    const companyName = String(row?.company_name || '').trim();
    if (companyName) return companyName;
  }
  return String(fallback || '').trim();
};

const maskOwnerPassword = (row, revealPassword) => ({
  ...row,
  password_ciphertext: revealPassword ? row.password_ciphertext || null : null,
  password_hidden: !revealPassword
});

const readCompanyCandidates = async (supabase, table, { query = '', limit = 10 } = {}) => {
  let builder = supabase
    .from(table)
    .select('company_key,company_name,last_synced_at');

  builder = builder.order('last_synced_at', { ascending: false }).limit(limit);

  const { data, error } = await builder;
  if (error) {
    throw new Error(`Failed to search ${table}: ${error.message}`);
  }

  return data || [];
};

const mergeCompanyCandidates = (lists = [], limit = 10) => {
  const seen = new Set();
  const merged = [];

  for (const list of lists) {
    for (const row of list || []) {
      const companyKey = normalizeCompanyKey(row?.company_key || row?.company_name || '');
      if (!companyKey || seen.has(companyKey)) continue;
      seen.add(companyKey);
      merged.push({
        companyKey,
        companyName: String(row?.company_name || row?.company_key || '').trim(),
        lastSyncedAt: row?.last_synced_at || null
      });

      if (merged.length >= limit) {
        return merged;
      }
    }
  }

  return merged;
};

const escapeSupabaseLike = (value) =>
  String(value || '')
    .trim()
    .replace(/[%_]/g, (character) => `\\${character}`)
    .replace(/\s+/g, ' ');

export const searchHermesCards = async (supabase, query = '', { limit = 12 } = {}) => {
  if (!supabase) {
    throw new Error('Supabase client is required to search Hermes cards');
  }

  const normalizedQuery = String(query || '').trim();
  const searchPattern = `%${escapeSupabaseLike(normalizedQuery)}%`;

  let builder = supabase
    .from('cmp_card_inventory')
    .select('company_key,company_name,organization,efs_account,account_identifier,card_number,company_status,card_status,last_used_date,last_synced_at');

  if (normalizedQuery) {
    builder = builder.or([
      `card_number.ilike.${searchPattern}`,
      `company_name.ilike.${searchPattern}`,
      `company_key.ilike.${searchPattern}`,
      `organization.ilike.${searchPattern}`,
      `efs_account.ilike.${searchPattern}`
    ].join(','));
  }

  builder = builder.order('last_synced_at', { ascending: false }).limit(limit);

  const { data, error } = await builder;
  if (error) {
    throw new Error(`Failed to search cmp_card_inventory: ${error.message}`);
  }

  return data || [];
};

export const loadHermesCompanySnapshot = async (
  supabase,
  companyKey,
  { limit = 20, revealPassword = false } = {}
) => {
  if (!supabase) {
    throw new Error('Supabase client is required to read Hermes snapshots');
  }

  const normalizedCompanyKey = normalizeCompanyKey(companyKey);
  if (!normalizedCompanyKey) {
    throw new Error('companyKey is required to read a Hermes company snapshot');
  }

  const [ownerAccess, cardStatus, cardInventory] = await Promise.all([
    readTable(supabase, 'cmp_owner_access', {
      limit,
      orderBy: 'last_synced_at',
      ascending: false,
      eqFilters: [{ column: 'company_key', value: normalizedCompanyKey }]
    }),
    readTable(supabase, 'cmp_card_status', {
      limit,
      orderBy: 'last_synced_at',
      ascending: false,
      eqFilters: [{ column: 'company_key', value: normalizedCompanyKey }]
    }),
    readTable(supabase, 'cmp_card_inventory', {
      limit,
      orderBy: 'last_synced_at',
      ascending: false,
      eqFilters: [{ column: 'company_key', value: normalizedCompanyKey }]
    })
  ]);

  const maskedOwnerAccess = ownerAccess.map((row) => maskOwnerPassword(row, revealPassword));
  const companyName = getCompanyNameFromRows(
    [ownerAccess[0], cardStatus[0], cardInventory[0]].filter(Boolean),
    normalizedCompanyKey
  );

  return {
    companyKey: normalizedCompanyKey,
    companyName,
    revealPassword: Boolean(revealPassword),
    ownerAccess: maskedOwnerAccess,
    cardStatus,
    cardInventory,
    summary: {
      ownerAccessCount: maskedOwnerAccess.length,
      cardStatusCount: cardStatus.length,
      cardInventoryCount: cardInventory.length
    }
  };
};

export const searchHermesCompanies = async (supabase, query = '', { limit = 10 } = {}) => {
  if (!supabase) {
    throw new Error('Supabase client is required to search Hermes companies');
  }

  const normalizedQuery = String(query || '').trim();
  const normalizedQueryKey = normalizeCompanyKey(normalizedQuery);

  const [ownerAccess, cardStatus, cardInventory] = await Promise.all([
    readCompanyCandidates(supabase, 'cmp_owner_access', { limit: Math.max(limit * 4, 20) }),
    readCompanyCandidates(supabase, 'cmp_card_status', { limit: Math.max(limit * 4, 20) }),
    readCompanyCandidates(supabase, 'cmp_card_inventory', { limit: Math.max(limit * 4, 20) })
  ]);

  const merged = mergeCompanyCandidates([ownerAccess, cardStatus, cardInventory], Math.max(limit * 4, 20));
  if (!normalizedQuery) {
    return merged.slice(0, limit);
  }

  const searchText = normalizedQuery.toLowerCase();
  const searchKey = normalizedQueryKey.toLowerCase();
  return merged
    .filter((item) => {
      const companyName = String(item.companyName || '').toLowerCase();
      const companyKey = String(item.companyKey || '').toLowerCase();
      return companyName.includes(searchText) || companyKey.includes(searchText) || companyKey.includes(searchKey);
    })
    .slice(0, limit);
};
