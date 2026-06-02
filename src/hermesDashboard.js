const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const buildHermesDashboardHtml = () => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Hermes</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

    :root {
      color-scheme: dark;
      --bg: #0c1117;
      --panel: #111827;
      --panel-2: #162233;
      --line: rgba(148, 163, 184, 0.18);
      --text: #e6edf7;
      --muted: #9fb0c5;
      --accent: #7ee0c8;
      --accent-2: #f2b36a;
      --accent-3: #9db6ff;
      --danger: #ff8f8f;
      --shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
    }

    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      margin: 0;
      background:
        radial-gradient(circle at top right, rgba(125, 220, 200, 0.08), transparent 26%),
        radial-gradient(circle at left bottom, rgba(242, 179, 106, 0.08), transparent 28%),
        linear-gradient(180deg, #0b1016 0%, #0c1117 100%);
      color: var(--text);
      font-family: 'IBM Plex Sans', system-ui, -apple-system, sans-serif;
      letter-spacing: 0;
    }

    .shell {
      max-width: 1480px;
      margin: 0 auto;
      padding: 24px;
    }

    .hero {
      display: grid;
      grid-template-columns: 1.25fr 0.75fr;
      gap: 18px;
      align-items: stretch;
      margin-bottom: 18px;
    }

    .masthead, .status-card, .panel, .section, .search-card, .results-card {
      background: rgba(17, 24, 39, 0.92);
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
      backdrop-filter: blur(18px);
    }

    .masthead {
      border-radius: 18px;
      padding: 22px 24px;
      min-height: 160px;
      position: relative;
      overflow: hidden;
    }

    .masthead::after {
      content: '';
      position: absolute;
      inset: auto -20% -40% auto;
      width: 280px;
      height: 280px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(126, 224, 200, 0.18), transparent 68%);
      pointer-events: none;
    }

    .eyebrow {
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-size: 11px;
      color: var(--accent-2);
      margin-bottom: 10px;
    }

    h1 {
      font-size: clamp(28px, 3vw, 42px);
      line-height: 1;
      margin: 0;
      letter-spacing: -0.03em;
    }

    .lead {
      margin-top: 14px;
      max-width: 68ch;
      color: var(--muted);
      line-height: 1.55;
      font-size: 14px;
    }

    .status-card {
      border-radius: 18px;
      padding: 18px;
      display: grid;
      gap: 12px;
      align-content: space-between;
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      width: fit-content;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(126, 224, 200, 0.12);
      color: var(--accent);
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
      font-size: 12px;
    }

    .status-chip::before {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 0 6px rgba(126, 224, 200, 0.08);
    }

    .status-meta {
      display: grid;
      gap: 10px;
      font-size: 13px;
      color: var(--muted);
    }

    .status-meta strong {
      color: var(--text);
      font-weight: 600;
    }

    .search-card {
      border-radius: 18px;
      padding: 18px;
      display: grid;
      gap: 14px;
      margin-bottom: 18px;
    }

    .search-row {
      display: grid;
      grid-template-columns: minmax(260px, 1.2fr) auto auto auto;
      gap: 12px;
      align-items: center;
    }

    .field {
      display: grid;
      gap: 8px;
    }

    .field label {
      font-size: 12px;
      color: var(--muted);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    input[type="search"] {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: rgba(10, 14, 20, 0.9);
      color: var(--text);
      padding: 14px 14px;
      font: inherit;
      outline: none;
    }

    input[type="search"]:focus {
      border-color: rgba(126, 224, 200, 0.45);
      box-shadow: 0 0 0 4px rgba(126, 224, 200, 0.08);
    }

    .toggle {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--muted);
      font-size: 13px;
      user-select: none;
      white-space: nowrap;
    }

    .toggle input {
      width: 18px;
      height: 18px;
      accent-color: var(--accent);
    }

    button {
      border: 0;
      border-radius: 14px;
      padding: 13px 16px;
      background: linear-gradient(180deg, rgba(126, 224, 200, 0.95), rgba(66, 190, 168, 0.95));
      color: #082019;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
      box-shadow: 0 14px 28px rgba(66, 190, 168, 0.14);
    }

    button:hover { transform: translateY(-1px); }
    button:active { transform: translateY(0); opacity: 0.96; }

    .ghost {
      background: rgba(15, 23, 42, 0.86);
      color: var(--text);
      border: 1px solid var(--line);
      box-shadow: none;
      font-weight: 600;
    }

    .results-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 18px;
    }

    .metric {
      border-radius: 18px;
      padding: 16px;
      background: rgba(17, 24, 39, 0.82);
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
      min-height: 108px;
    }

    .metric .label {
      font-size: 12px;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 10px;
    }

    .metric .value {
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
      font-size: 28px;
      line-height: 1;
      letter-spacing: -0.04em;
    }

    .metric .sub {
      margin-top: 10px;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.45;
    }

    .section {
      border-radius: 18px;
      padding: 18px;
      margin-bottom: 18px;
    }

    .section-head {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      margin-bottom: 14px;
    }

    .section-head h2 {
      margin: 0;
      font-size: 16px;
      letter-spacing: -0.02em;
    }

    .section-head .hint {
      color: var(--muted);
      font-size: 12px;
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
    }

    .grid-two {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .table-wrap {
      overflow: auto;
      border-radius: 14px;
      border: 1px solid var(--line);
      background: rgba(10, 14, 20, 0.75);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    th, td {
      text-align: left;
      padding: 12px 14px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.12);
      vertical-align: top;
    }

    th {
      position: sticky;
      top: 0;
      background: rgba(12, 17, 23, 0.98);
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.07em;
      font-size: 11px;
      z-index: 1;
    }

    tr:hover td {
      background: rgba(126, 224, 200, 0.03);
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }

    .pill.ok {
      background: rgba(126, 224, 200, 0.12);
      color: var(--accent);
    }

    .pill.warn {
      background: rgba(242, 179, 106, 0.12);
      color: var(--accent-2);
    }

    .pill.bad {
      background: rgba(255, 143, 143, 0.12);
      color: var(--danger);
    }

    .muted {
      color: var(--muted);
    }

    .company-list {
      display: grid;
      gap: 10px;
      max-height: 320px;
      overflow: auto;
    }

    .company-item {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      padding: 12px 14px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: rgba(10, 14, 20, 0.78);
      cursor: pointer;
      transition: border-color 120ms ease, transform 120ms ease, background 120ms ease;
    }

    .company-item:hover {
      border-color: rgba(126, 224, 200, 0.38);
      transform: translateY(-1px);
    }

    .company-item strong {
      display: block;
      font-size: 14px;
    }

    .company-item span {
      display: block;
      color: var(--muted);
      font-size: 12px;
      margin-top: 3px;
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
    }

    .empty {
      padding: 18px;
      border: 1px dashed rgba(148, 163, 184, 0.22);
      border-radius: 16px;
      color: var(--muted);
      text-align: center;
      background: rgba(10, 14, 20, 0.45);
    }

    .footer-note {
      padding: 16px 0 24px;
      color: var(--muted);
      font-size: 12px;
      text-align: center;
    }

    @media (max-width: 1120px) {
      .hero,
      .search-row,
      .results-grid,
      .grid-two {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <div class="hero">
      <section class="masthead">
        <div class="eyebrow">Hermes Console</div>
        <h1>Company Access + Card State</h1>
        <p class="lead">
          Search a company and read the merged Hermes snapshot in one place. Owner access stays masked by default,
          card state and inventory stay alongside it, and the whole thing is built to feel like a working ops console rather than a demo.
        </p>
      </section>
      <aside class="status-card">
        <div class="status-chip">Local API Ready</div>
        <div class="status-meta">
          <div><strong>Backend:</strong> Hermes read API</div>
          <div><strong>Routes:</strong> <code>/company/:companyKey</code>, <code>/snapshot</code>, <code>/health</code></div>
          <div><strong>Passwords:</strong> hidden unless explicitly revealed</div>
        </div>
      </aside>
    </div>

    <section class="search-card">
      <div class="search-row">
        <div class="field">
          <label for="query">Company</label>
          <input id="query" type="search" placeholder="Type a company name, e.g. Allstate Cargo" autocomplete="off" />
        </div>
        <label class="toggle" title="Show password ciphertext in the company snapshot">
          <input id="reveal" type="checkbox" />
          Reveal passwords
        </label>
        <button id="search">Search</button>
        <button id="loadSnapshot" class="ghost">Latest snapshot</button>
      </div>
      <div id="status" class="muted">Ready.</div>
      <div id="companyResults" class="company-list" aria-live="polite"></div>
    </section>

    <section class="results-grid" id="metrics">
      <div class="metric">
        <div class="label">Company</div>
        <div class="value" id="metricCompany">—</div>
        <div class="sub" id="metricCompanyKey">Search a company to load the unified view.</div>
      </div>
      <div class="metric">
        <div class="label">Owners</div>
        <div class="value" id="metricOwners">0</div>
        <div class="sub">Owner access rows returned by Hermes.</div>
      </div>
      <div class="metric">
        <div class="label">Cards</div>
        <div class="value" id="metricCards">0</div>
        <div class="sub">Card status + inventory coverage.</div>
      </div>
      <div class="metric">
        <div class="label">Password mode</div>
        <div class="value" id="metricReveal">Hidden</div>
        <div class="sub">Toggle only when you need the ciphertext.</div>
      </div>
    </section>

    <div class="grid-two">
      <section class="section">
        <div class="section-head">
          <h2>Owner Access</h2>
          <div class="hint" id="ownerHint">No company loaded</div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Owner</th>
                <th>Email</th>
                <th>Username</th>
                <th>Password</th>
              </tr>
            </thead>
            <tbody id="ownerBody">
              <tr><td colspan="4" class="empty">No company loaded yet.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="section">
        <div class="section-head">
          <h2>Snapshot Summary</h2>
          <div class="hint" id="summaryHint">Waiting for data</div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Organization</th>
                <th>EFS</th>
                <th>Card</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="cardBody">
              <tr><td colspan="5" class="empty">No snapshot loaded yet.</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <section class="section">
      <div class="section-head">
        <h2>Inventory Rows</h2>
        <div class="hint" id="inventoryHint">Inventory rows will show here when available</div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Card Number</th>
              <th>Company</th>
              <th>Company Status</th>
              <th>Card Status</th>
              <th>Last Used</th>
            </tr>
          </thead>
          <tbody id="inventoryBody">
            <tr><td colspan="5" class="empty">No inventory loaded yet.</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <div class="footer-note">
      Hermes keeps passwords hidden until you choose to reveal them.
    </div>
  </div>

  <script>
    const state = {
      lastQuery: '',
      lastCompanyKey: '',
      selectedCompany: null,
      results: []
    };

    const $ = (id) => document.getElementById(id);
    const queryInput = $('query');
    const revealInput = $('reveal');
    const searchButton = $('search');
    const snapshotButton = $('loadSnapshot');
    const companyResults = $('companyResults');
    const status = $('status');

    const setStatus = (message, error = false) => {
      status.textContent = message;
      status.style.color = error ? 'var(--danger)' : 'var(--muted)';
    };

    const escapeHtml = ${escapeHtml.toString()};

    const api = async (path) => {
      const response = await fetch(path, { headers: { accept: 'application/json' } });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Request failed');
      }
      return payload;
    };

    const buildCompanyUrl = (companyKey) => {
      const encoded = encodeURIComponent(companyKey);
      return \`/company/\${encoded}?revealPassword=\${revealInput.checked ? 'true' : 'false'}\`;
    };

    const renderSuggestions = (items) => {
      if (!items.length) {
        companyResults.innerHTML = '<div class="empty">No matches yet. Start typing a company name.</div>';
        return;
      }

      companyResults.innerHTML = items.map((item) => \`
        <button type="button" class="company-item" data-company-key="\${escapeHtml(item.companyKey)}">
          <div>
            <strong>\${escapeHtml(item.companyName || item.companyKey)}</strong>
            <span>\${escapeHtml(item.companyKey)}</span>
          </div>
          <div class="pill ok">\${item.ownerCount || 0} owners · \${item.cardCount || 0} cards</div>
        </button>
      \`).join('');

      companyResults.querySelectorAll('[data-company-key]').forEach((button) => {
        button.addEventListener('click', () => {
          loadCompany(button.getAttribute('data-company-key'));
        });
      });
    };

    const renderMetric = (id, value) => {
      $(id).textContent = value;
    };

    const renderOwnerRows = (rows, revealPassword) => {
      if (!rows.length) {
        $('ownerBody').innerHTML = '<tr><td colspan="4" class="empty">No owner access found for this company.</td></tr>';
        return;
      }

      $('ownerBody').innerHTML = rows.map((row) => \`
        <tr>
          <td>\${escapeHtml(row.owner_name || '—')}</td>
          <td>\${escapeHtml(row.owner_email || '—')}</td>
          <td>\${escapeHtml(row.username || '—')}</td>
          <td>\${revealPassword ? escapeHtml(row.password_ciphertext || '—') : '<span class="pill warn">Hidden</span>'}</td>
        </tr>
      \`).join('');
    };

    const renderCardRows = (rows) => {
      if (!rows.length) {
        $('cardBody').innerHTML = '<tr><td colspan="5" class="empty">No card status found for this company.</td></tr>';
        return;
      }

      $('cardBody').innerHTML = rows.map((row) => \`
        <tr>
          <td>\${escapeHtml(row.company_name || '—')}</td>
          <td>\${escapeHtml(row.organization || '—')}</td>
          <td>\${escapeHtml(row.efs_account || '—')}</td>
          <td>\${escapeHtml(row.account_identifier || '—')}</td>
          <td><span class="pill \${String(row.current_status || '').includes('active') ? 'ok' : 'warn'}">\${escapeHtml(row.current_status || 'unknown')}</span></td>
        </tr>
      \`).join('');
    };

    const renderInventoryRows = (rows) => {
      if (!rows.length) {
        $('inventoryBody').innerHTML = '<tr><td colspan="5" class="empty">No inventory rows found for this company.</td></tr>';
        return;
      }

      $('inventoryBody').innerHTML = rows.map((row) => \`
        <tr>
          <td><span style="font-family: IBM Plex Mono, monospace">\${escapeHtml(row.card_number || '—')}</span></td>
          <td>\${escapeHtml(row.company_name || '—')}</td>
          <td><span class="pill \${String(row.company_status || '').includes('active') ? 'ok' : 'warn'}">\${escapeHtml(row.company_status || 'unknown')}</span></td>
          <td><span class="pill \${String(row.card_status || '').includes('active') ? 'ok' : 'warn'}">\${escapeHtml(row.card_status || 'unknown')}</span></td>
          <td>\${escapeHtml(row.last_used_date || '—')}</td>
        </tr>
      \`).join('');
    };

    const renderCompany = (payload) => {
      state.selectedCompany = payload;

      renderMetric('metricCompany', payload.companyName || 'Unknown');
      renderMetric('metricCompanyKey', payload.companyKey || '—');
      renderMetric('metricOwners', String(payload.summary?.ownerAccessCount || 0));
      renderMetric('metricCards', String((payload.summary?.cardStatusCount || 0) + (payload.summary?.cardInventoryCount || 0)));
      renderMetric('metricReveal', payload.revealPassword ? 'Visible' : 'Hidden');

      $('ownerHint').textContent = payload.revealPassword ? 'Passwords visible on request' : 'Passwords masked by default';
      $('summaryHint').textContent = \`\${payload.summary?.cardStatusCount || 0} status rows and \${payload.summary?.cardInventoryCount || 0} inventory rows\`;
      $('inventoryHint').textContent = payload.companyKey ? \`Inventory linked to \${payload.companyKey}\` : 'Inventory will appear here';

      renderOwnerRows(payload.ownerAccess || [], payload.revealPassword);
      renderCardRows(payload.cardStatus || []);
      renderInventoryRows(payload.cardInventory || []);
    };

    const loadSuggestions = async (query = '') => {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      params.set('limit', '8');
      const payload = await api(\`/companies?\${params.toString()}\`);
      state.results = payload.results || [];
      renderSuggestions(state.results);
    };

    const loadCompany = async (companyKey = '') => {
      const key = String(companyKey || queryInput.value || '').trim();
      if (!key) {
        setStatus('Type a company name first.', true);
        return;
      }

      setStatus(\`Loading \${key}...\`);
      const url = buildCompanyUrl(key);
      const payload = await api(url);
      state.lastCompanyKey = payload.companyKey;
      renderCompany(payload);
      setStatus(\`Loaded \${payload.companyName || payload.companyKey}\`);
    };

    const boot = async () => {
      try {
        await loadSuggestions('');
        setStatus('Ready. Search a company or click a suggestion.');
      } catch (error) {
        setStatus(error.message, true);
        companyResults.innerHTML = '<div class="empty">Hermes API is not responding yet.</div>';
      }
    };

    searchButton.addEventListener('click', () => {
      loadCompany().catch((error) => setStatus(error.message, true));
    });

    snapshotButton.addEventListener('click', () => {
      loadSuggestions(queryInput.value.trim()).catch((error) => setStatus(error.message, true));
    });

    queryInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        loadCompany().catch((error) => setStatus(error.message, true));
      }
    });

    queryInput.addEventListener('input', () => {
      const value = queryInput.value.trim();
      clearTimeout(window.__hermesSearchTimer);
      window.__hermesSearchTimer = setTimeout(() => {
        loadSuggestions(value).catch((error) => setStatus(error.message, true));
      }, 220);
    });

    revealInput.addEventListener('change', () => {
      if (state.lastCompanyKey) {
        loadCompany(state.lastCompanyKey).catch((error) => setStatus(error.message, true));
      }
    });

    boot();
  </script>
</body>
</html>`;
