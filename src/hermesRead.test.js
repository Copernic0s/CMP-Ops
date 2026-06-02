import test from 'node:test';
import assert from 'node:assert/strict';
import { loadHermesCompanySnapshot, loadHermesSnapshot } from './hermesRead.js';

test('loadHermesSnapshot reads the four CMP tables', async () => {
  const tables = [];
  const supabase = {
    from(table) {
      tables.push(table);
      return {
        select() {
          return {
            eq() {
              return this;
            },
            order() {
              return {
                limit() {
                  return Promise.resolve({ data: [{ table }], error: null });
                }
              };
            }
          };
        }
      };
    }
  };

  const snapshot = await loadHermesSnapshot(supabase);
  assert.deepEqual(tables, ['cmp_owner_access', 'cmp_card_status', 'cmp_card_inventory', 'cmp_sync_audit']);
  assert.equal(snapshot.ownerAccess[0].table, 'cmp_owner_access');
  assert.equal(snapshot.cardStatus[0].table, 'cmp_card_status');
  assert.equal(snapshot.cardInventory[0].table, 'cmp_card_inventory');
  assert.equal(snapshot.syncAudit[0].table, 'cmp_sync_audit');
});

test('loadHermesCompanySnapshot merges company-specific rows and hides passwords by default', async () => {
  const calls = [];
  const supabase = {
    from(table) {
      const state = { table, filters: [] };
      calls.push(state);
      return {
        select() {
          return this;
        },
        eq(column, value) {
          state.filters.push([column, value]);
          return this;
        },
        order() {
          return this;
        },
        limit() {
          const payloads = {
            cmp_owner_access: [{
              table,
              company_key: 'allstatecargo',
              company_name: 'ALLSTATE CARGO CO',
              password_ciphertext: 'secret'
            }],
            cmp_card_status: [{
              table,
              company_key: 'allstatecargo',
              company_name: 'ALLSTATE CARGO CO'
            }],
            cmp_card_inventory: [{
              table,
              company_key: 'allstatecargo',
              company_name: 'ALLSTATE CARGO CO'
            }]
          };

          return Promise.resolve({ data: payloads[table] || [], error: null });
        }
      };
    }
  };

  const snapshot = await loadHermesCompanySnapshot(supabase, 'Allstate Cargo Co', { limit: 5 });
  assert.equal(snapshot.companyKey, 'allstatecargo');
  assert.equal(snapshot.companyName, 'ALLSTATE CARGO CO');
  assert.equal(snapshot.revealPassword, false);
  assert.equal(snapshot.ownerAccess[0].password_ciphertext, null);
  assert.equal(snapshot.ownerAccess[0].password_hidden, true);
  assert.equal(snapshot.summary.ownerAccessCount, 1);
  assert.equal(snapshot.summary.cardStatusCount, 1);
  assert.equal(snapshot.summary.cardInventoryCount, 1);
  assert.deepEqual(calls[0].filters, [['company_key', 'allstatecargo']]);
});
