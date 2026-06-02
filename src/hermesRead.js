const readTable = async (supabase, table, { limit = 20, orderBy = 'last_synced_at', ascending = false } = {}) => {
  let query = supabase.from(table).select('*');

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
