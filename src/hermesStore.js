import { createClient } from '@supabase/supabase-js';

export const resolveSupabaseSettings = (env = process.env) => {
  const url = String(env.HERMES_SUPABASE_URL || env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').trim();
  const serviceKey = String(
    env.HERMES_SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY || ''
  ).trim();

  return {
    url,
    serviceKey
  };
};

export const createHermesSupabaseClient = (env = process.env) => {
  const settings = resolveSupabaseSettings(env);
  if (!settings.url || !settings.serviceKey) {
    throw new Error('Supabase service credentials are required for Hermes persistence');
  }

  return createClient(settings.url, settings.serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
};

export const createSyncAuditRun = async (supabase, { runType, source = 'cmp', metadata = {} }) => {
  const payload = {
    run_type: runType,
    source,
    started_at: new Date().toISOString(),
    records_found: 0,
    records_updated: 0,
    metadata
  };

  const { data, error } = await supabase
    .from('cmp_sync_audit')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create audit run: ${error.message}`);
  }

  return data;
};

export const finishSyncAuditRun = async (
  supabase,
  auditRunId,
  { recordsFound = 0, recordsUpdated = 0, errorMessage = null, metadata = {} } = {}
) => {
  const payload = {
    ended_at: new Date().toISOString(),
    records_found: recordsFound,
    records_updated: recordsUpdated,
    error: errorMessage,
    metadata
  };

  const { data, error } = await supabase
    .from('cmp_sync_audit')
    .update(payload)
    .eq('id', auditRunId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to finish audit run: ${error.message}`);
  }

  return data;
};

export const upsertOwnerAccessRows = async (supabase, rows) => {
  if (!rows || rows.length === 0) return { count: 0 };

  const { error } = await supabase
    .from('cmp_owner_access')
    .upsert(rows, { onConflict: 'company_key' });

  if (error) {
    throw new Error(`Failed to upsert owner access rows: ${error.message}`);
  }

  return { count: rows.length };
};

export const upsertCardStatusRows = async (supabase, rows) => {
  if (!rows || rows.length === 0) return { count: 0 };

  const { error } = await supabase
    .from('cmp_card_status')
    .upsert(rows, { onConflict: 'company_key,account_identifier' });

  if (error) {
    throw new Error(`Failed to upsert card status rows: ${error.message}`);
  }

  return { count: rows.length };
};

export const upsertCardInventoryRows = async (supabase, rows) => {
  if (!rows || rows.length === 0) return { count: 0 };

  const { error } = await supabase
    .from('cmp_card_inventory')
    .upsert(rows, { onConflict: 'card_number' });

  if (error) {
    throw new Error(`Failed to upsert card inventory rows: ${error.message}`);
  }

  return { count: rows.length };
};
