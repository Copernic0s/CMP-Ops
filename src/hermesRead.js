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

export const loadHermesSnapshot = async (supabase) => {
  if (!supabase) {
    throw new Error('Supabase client is required to read Hermes snapshots');
  }

  const [ownerAccess, cardStatus, syncAudit] = await Promise.all([
    readTable(supabase, 'cmp_owner_access', { limit: 20, orderBy: 'last_synced_at', ascending: false }),
    readTable(supabase, 'cmp_card_status', { limit: 20, orderBy: 'last_synced_at', ascending: false }),
    readTable(supabase, 'cmp_sync_audit', { limit: 20, orderBy: 'started_at', ascending: false })
  ]);

  return {
    ownerAccess,
    cardStatus,
    syncAudit
  };
};
