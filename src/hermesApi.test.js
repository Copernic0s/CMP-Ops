import test from 'node:test';
import assert from 'node:assert/strict';
import { createHermesApiServer } from './hermesApi.js';

const createMockSupabase = () => {
  const tableData = {
    cmp_owner_access: [{
      table: 'cmp_owner_access',
      id: 1,
      company_key: 'allstatecargo',
      company_name: 'ALLSTATE CARGO CO',
      password_ciphertext: 'secret'
    }],
    cmp_card_status: [{
      table: 'cmp_card_status',
      id: 2,
      company_key: 'allstatecargo',
      company_name: 'ALLSTATE CARGO CO'
    }],
    cmp_card_inventory: [{
      table: 'cmp_card_inventory',
      id: 3,
      company_key: 'allstatecargo',
      company_name: 'ALLSTATE CARGO CO'
    }],
    cmp_sync_audit: [{ table: 'cmp_sync_audit', id: 4 }]
  };

  return {
    from(table) {
      return {
        select() {
          return {
            ilike() {
              return this;
            },
            eq() {
              return this;
            },
            order() {
              return {
                limit() {
                  return Promise.resolve({ data: tableData[table] || [], error: null });
                }
              };
            }
          };
        }
      };
    }
  };
};

const listenOnRandomPort = async (server) => {
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind test server');
  }

  return `http://${address.address}:${address.port}`;
};

test('Hermes API serves health and snapshots', async () => {
  const server = createHermesApiServer({ supabase: createMockSupabase(), mode: 'test' });
  const baseUrl = await listenOnRandomPort(server);

  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    assert.equal(healthResponse.status, 200);
    const health = await healthResponse.json();
    assert.equal(health.ok, true);
    assert.equal(health.service, 'hermes');
    assert.equal(health.mode, 'test');

    const snapshotResponse = await fetch(`${baseUrl}/snapshot`);
    assert.equal(snapshotResponse.status, 200);
    const snapshot = await snapshotResponse.json();
    assert.equal(snapshot.ownerAccess[0].table, 'cmp_owner_access');
    assert.equal(snapshot.cardStatus[0].table, 'cmp_card_status');
    assert.equal(snapshot.cardInventory[0].table, 'cmp_card_inventory');
    assert.equal(snapshot.syncAudit[0].table, 'cmp_sync_audit');

    const inventoryResponse = await fetch(`${baseUrl}/snapshot/inventory?limit=1`);
    assert.equal(inventoryResponse.status, 200);
    const inventory = await inventoryResponse.json();
    assert.equal(inventory[0].table, 'cmp_card_inventory');

      const companyResponse = await fetch(`${baseUrl}/company/${encodeURIComponent('Allstate Cargo Co')}?limit=2`);
    assert.equal(companyResponse.status, 200);
    const company = await companyResponse.json();
    assert.equal(company.ok, true);
    assert.equal(company.companyKey, 'allstatecargo');
    assert.equal(company.companyName, 'ALLSTATE CARGO CO');
    assert.equal(company.ownerAccess[0].password_ciphertext, null);
    assert.equal(company.ownerAccess[0].password_hidden, true);
    assert.equal(company.summary.ownerAccessCount, 1);

    const companyListResponse = await fetch(`${baseUrl}/companies?q=Allstate&limit=5`);
    assert.equal(companyListResponse.status, 200);
    const companyList = await companyListResponse.json();
    assert.equal(companyList.ok, true);
    assert.equal(companyList.count, 1);
    assert.equal(companyList.results[0].companyKey, 'allstatecargo');

    const dashboardResponse = await fetch(`${baseUrl}/dashboard`);
    assert.equal(dashboardResponse.status, 200);
    assert.match(await dashboardResponse.text(), /Hermes Console/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
