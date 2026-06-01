import test from 'node:test';
import assert from 'node:assert/strict';
import { loadHermesSnapshot } from './hermesRead.js';

test('loadHermesSnapshot reads the three CMP tables', async () => {
  const tables = [];
  const supabase = {
    from(table) {
      tables.push(table);
      return {
        select() {
          return {
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
  assert.deepEqual(tables, ['cmp_owner_access', 'cmp_card_status', 'cmp_sync_audit']);
  assert.equal(snapshot.ownerAccess[0].table, 'cmp_owner_access');
  assert.equal(snapshot.cardStatus[0].table, 'cmp_card_status');
  assert.equal(snapshot.syncAudit[0].table, 'cmp_sync_audit');
});
