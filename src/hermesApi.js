import http from 'node:http';
import { buildHermesDashboardHtml } from './hermesDashboard.js';
import {
  loadHermesCompanySnapshot,
  loadHermesSnapshot,
  loadHermesTableSnapshot,
  searchHermesCards,
  searchHermesCompanies
} from './hermesRead.js';

const DEFAULT_API_PORT = 3333;
const DEFAULT_API_HOST = '127.0.0.1';

const writeJson = (res, statusCode, payload) => {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(body);
};

const parseLimit = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 20;
  return Math.min(Math.floor(parsed), 100);
};

const writeHtml = (res, statusCode, body) => {
  res.writeHead(statusCode, {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'no-store'
  });
  res.end(body);
};

const getRouteSnapshot = async (supabase, route, limit) => {
  if (route === 'owner-access' || route === 'owners') {
    return loadHermesTableSnapshot(supabase, 'ownerAccess', { limit });
  }

  if (route === 'card-status' || route === 'cards') {
    return loadHermesTableSnapshot(supabase, 'cardStatus', { limit });
  }

  if (route === 'card-inventory' || route === 'inventory') {
    return loadHermesTableSnapshot(supabase, 'cardInventory', { limit });
  }

  if (route === 'audit' || route === 'sync-audit') {
    return loadHermesTableSnapshot(supabase, 'syncAudit', { limit });
  }

  return loadHermesSnapshot(supabase, { limit });
};

const getCompanyRouteSnapshot = async (supabase, requestUrl) => {
  const companyKey = String(
    requestUrl.searchParams.get('companyKey') ||
    requestUrl.searchParams.get('company') ||
    requestUrl.searchParams.get('q') ||
    ''
  ).trim();

  const revealPassword = String(requestUrl.searchParams.get('revealPassword') || '').toLowerCase() === 'true';
  const limit = parseLimit(requestUrl.searchParams.get('limit'));

  if (!companyKey) {
    throw new Error('companyKey is required');
  }

  return loadHermesCompanySnapshot(supabase, companyKey, { limit, revealPassword });
};

const safeDecodePathSegment = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const createHermesApiServer = ({ supabase, mode = process.env.HERMES_MODE || 'dev' } = {}) => {
  if (!supabase) {
    throw new Error('Supabase client is required to start the Hermes API');
  }

  return http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url || '/', `http://${req.headers.host || DEFAULT_API_HOST}`);
      const route = requestUrl.pathname.replace(/^\/+|\/+$/g, '');
      const limit = parseLimit(requestUrl.searchParams.get('limit'));

      if (req.method !== 'GET') {
        writeJson(res, 405, { ok: false, error: 'Method not allowed' });
        return;
      }

      if (!route || route === '') {
        writeJson(res, 200, {
          ok: true,
          service: 'hermes',
          mode,
          routes: ['/health', '/dashboard', '/companies', '/cards', '/snapshot', '/snapshot/:table', '/company/:companyKey']
        });
        return;
      }

      if (route === 'health') {
        writeJson(res, 200, {
          ok: true,
          service: 'hermes',
          mode,
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (route === 'dashboard' || route === 'ui') {
        writeHtml(res, 200, buildHermesDashboardHtml());
        return;
      }

      if (route === 'companies') {
        const query = String(requestUrl.searchParams.get('q') || requestUrl.searchParams.get('query') || '').trim();
        const companies = await searchHermesCompanies(supabase, query, { limit });
        writeJson(res, 200, {
          ok: true,
          query,
          count: companies.length,
          results: companies
        });
        return;
      }

      if (route === 'cards') {
        const query = String(requestUrl.searchParams.get('q') || requestUrl.searchParams.get('query') || '').trim();
        const cards = await searchHermesCards(supabase, query, { limit });
        writeJson(res, 200, {
          ok: true,
          query,
          count: cards.length,
          results: cards
        });
        return;
      }

      if (route === 'snapshot') {
        const table = String(requestUrl.searchParams.get('table') || '').trim().toLowerCase();
        const snapshot = await getRouteSnapshot(supabase, table, limit);
        writeJson(res, 200, snapshot);
        return;
      }

      if (route.startsWith('snapshot/')) {
        const table = route.slice('snapshot/'.length).trim().toLowerCase();
        const snapshot = await getRouteSnapshot(supabase, table, limit);
        writeJson(res, 200, snapshot);
        return;
      }

      if (route === 'company') {
        const snapshot = await getCompanyRouteSnapshot(supabase, requestUrl);
        writeJson(res, 200, {
          ok: true,
          ...snapshot
        });
        return;
      }

      if (route.startsWith('company/')) {
        const companyKey = safeDecodePathSegment(route.slice('company/'.length).trim());
        const snapshot = await loadHermesCompanySnapshot(supabase, companyKey, {
          limit,
          revealPassword: String(requestUrl.searchParams.get('revealPassword') || '').toLowerCase() === 'true'
        });
        writeJson(res, 200, {
          ok: true,
          ...snapshot
        });
        return;
      }

      writeJson(res, 404, { ok: false, error: 'Not found' });
    } catch (error) {
      writeJson(res, 500, {
        ok: false,
        error: error.message
      });
    }
  });
};

export const startHermesApi = async ({
  supabase,
  port = Number(process.env.HERMES_API_PORT || DEFAULT_API_PORT),
  host = process.env.HERMES_API_HOST || DEFAULT_API_HOST,
  mode = process.env.HERMES_MODE || 'dev'
} = {}) => {
  const server = createHermesApiServer({ supabase, mode });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });

  const address = server.address();
  const listeningHost = typeof address === 'object' && address ? address.address : host;
  const listeningPort = typeof address === 'object' && address ? address.port : port;
  console.log(`[Hermes] api listening on http://${listeningHost}:${listeningPort}`);
  return server;
};
