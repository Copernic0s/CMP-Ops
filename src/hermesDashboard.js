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
  <title>Hermes Console</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

    :root {
      color-scheme: dark;
      --bg: #090d12;
      --panel: rgba(14, 20, 28, 0.94);
      --panel-2: rgba(18, 26, 36, 0.96);
      --panel-3: rgba(11, 16, 22, 0.88);
      --line: rgba(153, 171, 195, 0.18);
      --line-strong: rgba(153, 171, 195, 0.28);
      --text: #eef3f9;
      --muted: #93a6bb;
      --accent: #7fe0c7;
      --accent-2: #ffbf69;
      --danger: #ff8d8d;
      --success: #7fe0c7;
      --warning: #ffbf69;
      --shadow: 0 24px 60px rgba(0, 0, 0, 0.32);
      --radius: 22px;
    }

    * { box-sizing: border-box; }
    html, body { min-height: 100%; }
    body {
      margin: 0;
      background:
        radial-gradient(circle at top right, rgba(127, 224, 199, 0.09), transparent 24%),
        radial-gradient(circle at bottom left, rgba(255, 191, 105, 0.08), transparent 26%),
        linear-gradient(180deg, #070b10 0%, #0b1118 100%);
      color: var(--text);
      font-family: 'IBM Plex Sans', system-ui, sans-serif;
      letter-spacing: 0;
    }

    body::before {
      content: '';
      position: fixed;
      inset: 0;
      pointer-events: none;
      background-image:
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 42px 42px;
      opacity: 0.12;
      mask-image: linear-gradient(180deg, rgba(0,0,0,0.7), rgba(0,0,0,0.1));
    }

    .shell {
      position: relative;
      z-index: 1;
      max-width: 1600px;
      margin: 0 auto;
      padding: 18px;
    }

    .app-shell {
      display: grid;
      grid-template-columns: 300px minmax(0, 1fr);
      gap: 18px;
      align-items: start;
    }

    .sidebar,
    .hero,
    .command-bar,
    .panel,
    .metric,
    .result-item,
    .status-card {
      background: var(--panel);
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
      backdrop-filter: blur(18px);
    }

    .sidebar {
      position: sticky;
      top: 18px;
      border-radius: 28px;
      overflow: hidden;
      padding: 18px;
      display: grid;
      gap: 16px;
    }

    .brand-lockup {
      border-radius: 22px;
      padding: 22px 18px 18px;
      background:
        radial-gradient(circle at top, rgba(255, 255, 255, 0.04), transparent 55%),
        linear-gradient(180deg, rgba(22, 30, 41, 0.96), rgba(12, 18, 25, 0.96));
      border: 1px solid rgba(255, 255, 255, 0.06);
      display: grid;
      gap: 16px;
    }

    .brand-badge {
      width: 118px;
      height: 118px;
      margin: 0 auto;
      border-radius: 24px;
      background:
        radial-gradient(circle at 50% 10%, rgba(255,255,255,0.15), transparent 32%),
        linear-gradient(180deg, rgba(249, 251, 255, 0.14), rgba(248, 250, 252, 0.04)),
        linear-gradient(145deg, rgba(34, 41, 55, 1), rgba(13, 17, 23, 1));
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 18px 38px rgba(0, 0, 0, 0.35);
      display: grid;
      place-items: center;
      text-align: center;
      padding: 12px;
    }

    .brand-badge span {
      display: block;
      line-height: 1;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
    }

    .brand-badge .mark {
      font-size: 11px;
      color: var(--accent-2);
      margin-bottom: 10px;
    }

    .brand-badge .name {
      font-size: 22px;
      font-weight: 700;
      color: var(--text);
    }

    .brand-copy {
      display: grid;
      gap: 10px;
      text-align: left;
    }

    .eyebrow {
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--accent-2);
    }

    .brand-copy h1 {
      margin: 0;
      font-size: 22px;
      line-height: 1.05;
      letter-spacing: -0.04em;
    }

    .brand-copy p {
      margin: 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.55;
    }

    .sidebar-card {
      border-radius: 22px;
      padding: 16px;
      background: var(--panel-2);
      border: 1px solid var(--line);
      display: grid;
      gap: 14px;
    }

    .selected-company {
      display: grid;
      gap: 12px;
    }

    .selected-company .label {
      color: var(--muted);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
    }

    .selected-company .company-name {
      font-size: 20px;
      line-height: 1.05;
      font-weight: 700;
      letter-spacing: -0.03em;
    }

    .selected-company .company-key,
    .selected-company .owner-name,
    .selected-company .company-note {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.45;
    }

    .company-stats {
      display: grid;
      gap: 10px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .company-stat {
      border-radius: 18px;
      padding: 12px;
      background: rgba(8, 12, 17, 0.72);
      border: 1px solid rgba(153, 171, 195, 0.14);
    }

    .company-stat .label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--muted);
      margin-bottom: 8px;
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
    }

    .company-stat .value {
      font-size: 18px;
      line-height: 1.1;
      font-weight: 700;
      letter-spacing: -0.03em;
    }

    .quick-actions {
      display: grid;
      gap: 10px;
    }

    .quick-actions button,
    .command-actions button,
    .mode-button {
      appearance: none;
      border: 0;
      border-radius: 16px;
      padding: 12px 14px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      transition: transform 120ms ease, opacity 120ms ease, border-color 120ms ease, background 120ms ease;
    }

    .quick-actions button:hover,
    .command-actions button:hover,
    .mode-button:hover {
      transform: translateY(-1px);
    }

    .primary-button {
      background: linear-gradient(180deg, rgba(127, 224, 199, 0.96), rgba(61, 189, 167, 0.96));
      color: #082019;
      box-shadow: 0 14px 28px rgba(61, 189, 167, 0.14);
    }

    .secondary-button {
      background: rgba(10, 15, 21, 0.9);
      color: var(--text);
      border: 1px solid var(--line);
    }

    .secondary-button:disabled,
    .primary-button:disabled,
    .mode-button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .action-grid {
      display: grid;
      gap: 10px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .action-grid button {
      width: 100%;
    }

    .sidebar-foot {
      color: var(--muted);
      font-size: 12px;
      line-height: 1.5;
      padding-top: 4px;
      border-top: 1px solid rgba(153, 171, 195, 0.12);
    }

    .workspace {
      display: grid;
      gap: 18px;
      min-width: 0;
    }

    .hero {
      border-radius: 28px;
      padding: 26px 28px;
      min-height: 182px;
      position: relative;
      overflow: hidden;
    }

    .hero::after {
      content: '';
      position: absolute;
      inset: auto -8% -42% auto;
      width: 360px;
      height: 360px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(127, 224, 199, 0.16), transparent 64%);
      pointer-events: none;
    }

    .hero .eyebrow {
      margin-bottom: 12px;
    }

    .hero h2 {
      margin: 0;
      font-size: clamp(28px, 3vw, 46px);
      line-height: 0.98;
      letter-spacing: -0.05em;
      max-width: 12ch;
    }

    .hero p {
      margin: 14px 0 0;
      max-width: 78ch;
      color: var(--muted);
      font-size: 14px;
      line-height: 1.6;
    }

    .command-bar {
      border-radius: 24px;
      padding: 16px;
      display: grid;
      gap: 14px;
    }

    .command-top {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto auto;
      gap: 12px;
      align-items: center;
    }

    .mode-switch {
      display: inline-flex;
      padding: 4px;
      gap: 6px;
      border-radius: 16px;
      background: rgba(7, 11, 16, 0.9);
      border: 1px solid var(--line);
    }

    .mode-button {
      min-width: 104px;
      background: transparent;
      color: var(--muted);
      border: 1px solid transparent;
    }

    .mode-button.is-active {
      background: rgba(127, 224, 199, 0.12);
      color: var(--accent);
      border-color: rgba(127, 224, 199, 0.2);
    }

    .search-field {
      display: grid;
      gap: 8px;
    }

    .search-field label,
    .compact-label {
      font-size: 11px;
      color: var(--muted);
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
    }

    .search-field input[type="search"] {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 16px;
      background: rgba(7, 11, 16, 0.95);
      color: var(--text);
      padding: 14px 15px;
      font: inherit;
      outline: none;
    }

    .search-field input[type="search"]:focus {
      border-color: rgba(127, 224, 199, 0.48);
      box-shadow: 0 0 0 4px rgba(127, 224, 199, 0.08);
    }

    .toggle {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--muted);
      font-size: 13px;
      user-select: none;
      white-space: nowrap;
      padding: 0 4px;
    }

    .toggle input {
      width: 18px;
      height: 18px;
      accent-color: var(--accent);
    }

    .command-actions {
      display: inline-flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }

    .command-actions button {
      background: rgba(10, 15, 21, 0.9);
      color: var(--text);
      border: 1px solid var(--line);
    }

    .status-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.4;
      flex-wrap: wrap;
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(127, 224, 199, 0.12);
      color: var(--accent);
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
      font-size: 12px;
      white-space: nowrap;
    }

    .status-chip::before {
      content: '';
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 0 6px rgba(127, 224, 199, 0.08);
    }

    .results-panel {
      border-radius: 24px;
      padding: 16px;
      background: var(--panel-2);
      border: 1px solid var(--line);
      display: grid;
      gap: 12px;
    }

    .panel-head {
      display: flex;
      justify-content: space-between;
      gap: 14px;
      align-items: center;
      flex-wrap: wrap;
    }

    .panel-head h3 {
      margin: 0;
      font-size: 15px;
      letter-spacing: -0.02em;
    }

    .panel-head .hint {
      color: var(--muted);
      font-size: 12px;
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
    }

    .result-list {
      display: grid;
      gap: 10px;
      max-height: 308px;
      overflow: auto;
      padding-right: 4px;
    }

    .result-item {
      border-radius: 18px;
      padding: 14px 15px;
      background: rgba(8, 12, 17, 0.76);
      border: 1px solid rgba(153, 171, 195, 0.14);
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      text-align: left;
      width: 100%;
      cursor: pointer;
    }

    .result-item:hover {
      border-color: rgba(127, 224, 199, 0.34);
      transform: translateY(-1px);
    }

    .result-item strong {
      display: block;
      font-size: 14px;
      line-height: 1.2;
    }

    .result-item span {
      display: block;
      margin-top: 4px;
      color: var(--muted);
      font-size: 12px;
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }

    .pill.ok {
      background: rgba(127, 224, 199, 0.12);
      color: var(--accent);
    }

    .pill.warn {
      background: rgba(255, 191, 105, 0.12);
      color: var(--accent-2);
    }

    .pill.bad {
      background: rgba(255, 141, 141, 0.12);
      color: var(--danger);
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
    }

    .metric {
      border-radius: 22px;
      padding: 16px;
      min-height: 114px;
      display: grid;
      gap: 10px;
    }

    .metric .label {
      color: var(--muted);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
    }

    .metric .value {
      font-size: 28px;
      line-height: 1;
      font-weight: 700;
      letter-spacing: -0.04em;
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
    }

    .metric .sub {
      color: var(--muted);
      font-size: 12px;
      line-height: 1.45;
    }

    .content-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.02fr) minmax(0, 0.98fr);
      gap: 14px;
    }

    .panel {
      border-radius: 22px;
      padding: 16px;
      min-width: 0;
    }

    .section-head {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: center;
      margin-bottom: 14px;
      flex-wrap: wrap;
    }

    .section-head h3 {
      margin: 0;
      font-size: 15px;
      letter-spacing: -0.02em;
    }

    .section-head .hint {
      color: var(--muted);
      font-size: 12px;
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
    }

    .table-wrap {
      overflow: auto;
      border-radius: 16px;
      border: 1px solid rgba(153, 171, 195, 0.14);
      background: rgba(8, 12, 17, 0.68);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    th, td {
      text-align: left;
      padding: 12px 14px;
      border-bottom: 1px solid rgba(153, 171, 195, 0.1);
      vertical-align: top;
    }

    th {
      position: sticky;
      top: 0;
      z-index: 1;
      background: rgba(10, 15, 21, 0.98);
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.07em;
      font-size: 11px;
    }

    tr:hover td {
      background: rgba(127, 224, 199, 0.03);
    }

    .empty {
      padding: 18px;
      text-align: center;
      color: var(--muted);
      background: rgba(8, 12, 17, 0.45);
    }

    .mono {
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
    }

    .footnote {
      color: var(--muted);
      font-size: 12px;
      line-height: 1.45;
      text-align: center;
      padding: 2px 0 10px;
    }

    @media (max-width: 1240px) {
      .app-shell,
      .content-grid,
      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: relative;
        top: 0;
      }

      .command-top {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand-lockup">
          <div class="brand-badge" aria-hidden="true">
            <span class="mark">UNITED</span>
            <span class="name">HERMES</span>
          </div>
          <div class="brand-copy">
            <div class="eyebrow">Hermes Console</div>
            <h1>Company Access + Card State</h1>
            <p>
              Ops-focused workspace for company lookups, owner access, card state, and inventory snapshots.
            </p>
          </div>
        </div>

        <div class="sidebar-card selected-company">
          <div>
            <div class="label">Selected company</div>
            <div class="company-name" id="sidebarCompanyName">No company loaded</div>
            <div class="company-key" id="sidebarCompanyKey">Search a company or card to populate the panel.</div>
          </div>
          <div class="owner-name" id="sidebarOwnerName">Owner details will appear here.</div>
          <div class="company-note" id="sidebarNote">Passwords stay hidden until you choose to reveal them.</div>
          <div class="company-stats">
            <div class="company-stat">
              <div class="label">Owners</div>
              <div class="value" id="sidebarOwnersCount">0</div>
            </div>
            <div class="company-stat">
              <div class="label">Cards</div>
              <div class="value" id="sidebarCardsCount">0</div>
            </div>
            <div class="company-stat">
              <div class="label">Active</div>
              <div class="value" id="sidebarActiveCount">0</div>
            </div>
            <div class="company-stat">
              <div class="label">Inactive</div>
              <div class="value" id="sidebarInactiveCount">0</div>
            </div>
          </div>
          <div class="action-grid">
            <button id="copyEmail" class="secondary-button" type="button" disabled>Copy email</button>
            <button id="copyUsername" class="secondary-button" type="button" disabled>Copy username</button>
            <button id="copyPassword" class="primary-button" type="button" disabled>Copy password</button>
            <button id="refreshCompany" class="secondary-button" type="button" disabled>Refresh company</button>
          </div>
        </div>

        <div class="sidebar-card">
          <div class="compact-label">System status</div>
          <div class="status-chip">Local API Ready</div>
          <div class="sidebar-foot">
            <strong>Backend:</strong> Hermes read API<br />
            <strong>Routes:</strong> <code>/dashboard</code>, <code>/companies</code>, <code>/cards</code>, <code>/company/:companyKey</code><br />
            <strong>Passwords:</strong> hidden by default
          </div>
        </div>
      </aside>

      <main class="workspace">
        <section class="hero">
          <div class="eyebrow">United / Hermes</div>
          <h2>Company ops, cards, and passwords in one console.</h2>
          <p>
            Search a company or a card number, inspect the merged snapshot, and keep the sensitive material masked until you explicitly reveal it.
          </p>
        </section>

        <section class="command-bar">
          <div class="command-top">
            <div class="mode-switch" role="tablist" aria-label="Search mode">
              <button id="modeCompany" class="mode-button is-active" type="button" data-mode="company">Company</button>
              <button id="modeCard" class="mode-button" type="button" data-mode="card">Card number</button>
            </div>
            <div class="search-field">
              <label id="searchLabel" for="query">Global lookup</label>
              <input id="query" type="search" placeholder="Type a company name, e.g. Allstate Cargo" autocomplete="off" />
            </div>
            <label class="toggle" title="Show password ciphertext in the company snapshot">
              <input id="reveal" type="checkbox" />
              Reveal passwords
            </label>
            <div class="command-actions">
              <button id="search" class="primary-button" type="button">Search</button>
              <button id="refresh" class="secondary-button" type="button">Latest snapshot</button>
            </div>
          </div>
          <div class="status-line">
            <div id="status">Ready. Search a company or a card number to load the unified snapshot.</div>
            <div class="status-chip" id="modeChip">Company mode</div>
          </div>
        </section>

        <section class="results-panel">
          <div class="panel-head">
            <div>
              <h3 id="resultsTitle">Search results</h3>
              <div class="hint" id="resultsHint">Suggestions appear as you type.</div>
            </div>
            <div class="hint" id="resultsCount">0 results</div>
          </div>
          <div id="resultsList" class="result-list" aria-live="polite"></div>
        </section>

        <section class="metrics-grid" id="metrics">
          <div class="metric">
            <div class="label">Company</div>
            <div class="value" id="metricCompany">—</div>
            <div class="sub" id="metricCompanyKey">Search a company or card to load the unified view.</div>
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
            <div class="sub">Reveal only when you need the ciphertext.</div>
          </div>
        </section>

        <div class="content-grid">
          <section class="panel">
            <div class="section-head">
              <h3>Owner Access</h3>
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

          <section class="panel">
            <div class="section-head">
              <h3>Card State</h3>
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

        <section class="panel">
          <div class="section-head">
            <h3>Inventory Rows</h3>
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

        <div class="footnote">
          Hermes keeps passwords hidden until you explicitly reveal them.
        </div>
      </main>
    </div>
  </div>

  <script>
    const state = {
      searchMode: 'company',
      lastQuery: '',
      lastCompanyKey: '',
      selectedCompany: null,
      results: [],
      loading: false
    };

    const $ = function(id) {
      return document.getElementById(id);
    };

    const queryInput = $('query');
    const revealInput = $('reveal');
    const searchButton = $('search');
    const refreshButton = $('refresh');
    const resultsList = $('resultsList');
    const status = $('status');
    const modeChip = $('modeChip');
    const resultsTitle = $('resultsTitle');
    const resultsHint = $('resultsHint');
    const resultsCount = $('resultsCount');
    const sidebarCompanyName = $('sidebarCompanyName');
    const sidebarCompanyKey = $('sidebarCompanyKey');
    const sidebarOwnerName = $('sidebarOwnerName');
    const sidebarNote = $('sidebarNote');
    const sidebarOwnersCount = $('sidebarOwnersCount');
    const sidebarCardsCount = $('sidebarCardsCount');
    const sidebarActiveCount = $('sidebarActiveCount');
    const sidebarInactiveCount = $('sidebarInactiveCount');
    const copyEmailButton = $('copyEmail');
    const copyUsernameButton = $('copyUsername');
    const copyPasswordButton = $('copyPassword');
    const refreshCompanyButton = $('refreshCompany');

    const escapeHtml = ${escapeHtml.toString()};

    const setStatus = function(message, error) {
      status.textContent = message;
      status.style.color = error ? 'var(--danger)' : 'var(--muted)';
    };

    const api = async function(path) {
      const response = await fetch(path, { headers: { accept: 'application/json' } });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Request failed');
      }
      return payload;
    };

    const buildCompanyUrl = function(companyKey) {
      const encoded = encodeURIComponent(companyKey);
      return '/company/' + encoded + '?revealPassword=' + (revealInput.checked ? 'true' : 'false');
    };

    const buildSearchUrl = function() {
      const params = new URLSearchParams();
      const query = queryInput.value.trim();
      if (query) {
        params.set('q', query);
      }
      params.set('limit', '8');
      return state.searchMode === 'card' ? '/cards?' + params.toString() : '/companies?' + params.toString();
    };

    const getSearchPlaceholder = function() {
      return state.searchMode === 'card'
        ? 'Type a card number or company name, e.g. 708305...'
        : 'Type a company name, e.g. Allstate Cargo';
    };

    const setMode = function(mode) {
      state.searchMode = mode === 'card' ? 'card' : 'company';
      $('modeCompany').classList.toggle('is-active', state.searchMode === 'company');
      $('modeCard').classList.toggle('is-active', state.searchMode === 'card');
      queryInput.placeholder = getSearchPlaceholder();
      modeChip.textContent = state.searchMode === 'card' ? 'Card mode' : 'Company mode';
      resultsTitle.textContent = state.searchMode === 'card' ? 'Card hits' : 'Company suggestions';
      resultsHint.textContent = state.searchMode === 'card'
        ? 'Search by card number or company and click a result to jump to the company snapshot.'
        : 'Start typing a company name and choose a row.';
      if (queryInput.value.trim()) {
        loadSearchResults(queryInput.value.trim()).catch(function(error) {
          setStatus(error.message, true);
        });
      } else {
        loadSearchResults('').catch(function(error) {
          setStatus(error.message, true);
        });
      }
    };

    const renderEmptyResults = function(message) {
      resultsList.innerHTML = '<div class="empty">' + escapeHtml(message) + '</div>';
      resultsCount.textContent = '0 results';
    };

    const renderCompanyResults = function(items) {
      if (!items.length) {
        renderEmptyResults('No matches yet. Start typing a company name.');
        return;
      }

      resultsCount.textContent = String(items.length) + ' results';
      resultsList.innerHTML = items.map(function(item) {
        return (
          '<button type="button" class="result-item" data-company-key="' + escapeHtml(item.companyKey) + '">' +
            '<div>' +
              '<strong>' + escapeHtml(item.companyName || item.companyKey) + '</strong>' +
              '<span>' + escapeHtml(item.companyKey) + '</span>' +
            '</div>' +
            '<div class="pill ok">Open snapshot</div>' +
          '</button>'
        );
      }).join('');

      resultsList.querySelectorAll('[data-company-key]').forEach(function(button) {
        button.addEventListener('click', function() {
          loadCompany(button.getAttribute('data-company-key')).catch(function(error) {
            setStatus(error.message, true);
          });
        });
      });
    };

    const renderCardResults = function(items) {
      if (!items.length) {
        renderEmptyResults('No card matches found for this query.');
        return;
      }

      resultsCount.textContent = String(items.length) + ' results';
      resultsList.innerHTML = items.map(function(item) {
        var statusClass = String(item.card_status || item.company_status || '').toLowerCase().includes('active') ? 'ok' : 'warn';
        return (
          '<button type="button" class="result-item" data-company-key="' + escapeHtml(item.company_key || '') + '">' +
            '<div>' +
              '<strong class="mono">' + escapeHtml(item.card_number || '—') + '</strong>' +
              '<span>' + escapeHtml(item.company_name || item.company_key || 'Unknown company') + '</span>' +
            '</div>' +
            '<div style="display:grid; gap:8px; justify-items:end;">' +
              '<div class="pill ' + statusClass + '">' + escapeHtml(item.card_status || item.company_status || 'unknown') + '</div>' +
              '<div class="pill">' + escapeHtml(item.last_used_date || 'No date') + '</div>' +
            '</div>' +
          '</button>'
        );
      }).join('');

      resultsList.querySelectorAll('[data-company-key]').forEach(function(button) {
        button.addEventListener('click', function() {
          var companyKey = button.getAttribute('data-company-key');
          if (!companyKey) {
            return;
          }
          loadCompany(companyKey).catch(function(error) {
            setStatus(error.message, true);
          });
        });
      });
    };

    const renderOwnerRows = function(rows, revealPassword) {
      if (!rows.length) {
        $('ownerBody').innerHTML = '<tr><td colspan="4" class="empty">No owner access found for this company.</td></tr>';
        return;
      }

      $('ownerBody').innerHTML = rows.map(function(row) {
        return (
          '<tr>' +
            '<td>' + escapeHtml(row.owner_name || '—') + '</td>' +
            '<td>' + escapeHtml(row.owner_email || '—') + '</td>' +
            '<td>' + escapeHtml(row.username || '—') + '</td>' +
            '<td>' + (revealPassword ? escapeHtml(row.password_ciphertext || '—') : '<span class="pill warn">Hidden</span>') + '</td>' +
          '</tr>'
        );
      }).join('');
    };

    const renderCardRows = function(rows) {
      if (!rows.length) {
        $('cardBody').innerHTML = '<tr><td colspan="5" class="empty">No card status found for this company.</td></tr>';
        return;
      }

      $('cardBody').innerHTML = rows.map(function(row) {
        var currentStatus = String(row.current_status || 'unknown');
        var statusClass = currentStatus.toLowerCase().includes('active') ? 'ok' : 'warn';
        return (
          '<tr>' +
            '<td>' + escapeHtml(row.company_name || '—') + '</td>' +
            '<td>' + escapeHtml(row.organization || '—') + '</td>' +
            '<td>' + escapeHtml(row.efs_account || '—') + '</td>' +
            '<td>' + escapeHtml(row.account_identifier || '—') + '</td>' +
            '<td><span class="pill ' + statusClass + '">' + escapeHtml(currentStatus) + '</span></td>' +
          '</tr>'
        );
      }).join('');
    };

    const renderInventoryRows = function(rows) {
      if (!rows.length) {
        $('inventoryBody').innerHTML = '<tr><td colspan="5" class="empty">No inventory rows found for this company.</td></tr>';
        return;
      }

      $('inventoryBody').innerHTML = rows.map(function(row) {
        var companyStatus = String(row.company_status || 'unknown');
        var cardStatus = String(row.card_status || 'unknown');
        var companyClass = companyStatus.toLowerCase().includes('active') ? 'ok' : 'warn';
        var cardClass = cardStatus.toLowerCase().includes('active') ? 'ok' : 'warn';
        return (
          '<tr>' +
            '<td class="mono">' + escapeHtml(row.card_number || '—') + '</td>' +
            '<td>' + escapeHtml(row.company_name || '—') + '</td>' +
            '<td><span class="pill ' + companyClass + '">' + escapeHtml(companyStatus) + '</span></td>' +
            '<td><span class="pill ' + cardClass + '">' + escapeHtml(cardStatus) + '</span></td>' +
            '<td>' + escapeHtml(row.last_used_date || '—') + '</td>' +
          '</tr>'
        );
      }).join('');
    };

    const updateSidebarActions = function(payload) {
      var hasCompany = Boolean(payload && payload.companyKey);
      var firstOwner = hasCompany && payload.ownerAccess && payload.ownerAccess[0] ? payload.ownerAccess[0] : null;
      var revealPassword = Boolean(payload && payload.revealPassword);

      copyEmailButton.disabled = !firstOwner || !firstOwner.owner_email;
      copyUsernameButton.disabled = !firstOwner || !firstOwner.username;
      copyPasswordButton.disabled = !firstOwner || !firstOwner.password_ciphertext || !revealPassword;
      refreshCompanyButton.disabled = !hasCompany;
    };

    const renderSidebar = function(payload) {
      var hasCompany = Boolean(payload && payload.companyKey);
      var summary = payload && payload.summary ? payload.summary : {};
      var firstOwner = hasCompany && payload.ownerAccess && payload.ownerAccess[0] ? payload.ownerAccess[0] : null;
      var activeCards = 0;
      var inactiveCards = 0;

      (payload && payload.cardInventory ? payload.cardInventory : []).forEach(function(row) {
        var companyStatus = String(row.company_status || '').toLowerCase();
        var cardStatus = String(row.card_status || '').toLowerCase();
        if (companyStatus.includes('active') || cardStatus.includes('active')) {
          activeCards += 1;
        } else {
          inactiveCards += 1;
        }
      });

      sidebarCompanyName.textContent = hasCompany ? (payload.companyName || payload.companyKey) : 'No company loaded';
      sidebarCompanyKey.textContent = hasCompany ? payload.companyKey : 'Search a company or card to populate the panel.';
      sidebarOwnerName.textContent = firstOwner
        ? ('Owner: ' + (firstOwner.owner_name || '—') + ' · ' + (firstOwner.owner_email || '—'))
        : 'Owner details will appear here.';
      sidebarNote.textContent = payload && payload.revealPassword
        ? 'Passwords are visible for this snapshot.'
        : 'Passwords stay hidden until you choose to reveal them.';

      sidebarOwnersCount.textContent = String(summary.ownerAccessCount || 0);
      sidebarCardsCount.textContent = String((summary.cardStatusCount || 0) + (summary.cardInventoryCount || 0));
      sidebarActiveCount.textContent = String(activeCards);
      sidebarInactiveCount.textContent = String(inactiveCards);

      updateSidebarActions(payload);
    };

    const renderCompany = function(payload) {
      state.selectedCompany = payload;
      state.lastCompanyKey = payload.companyKey || '';

      $('metricCompany').textContent = payload.companyName || 'Unknown';
      $('metricCompanyKey').textContent = payload.companyKey || '—';
      $('metricOwners').textContent = String(payload.summary && payload.summary.ownerAccessCount ? payload.summary.ownerAccessCount : 0);
      $('metricCards').textContent = String((payload.summary && payload.summary.cardStatusCount ? payload.summary.cardStatusCount : 0) + (payload.summary && payload.summary.cardInventoryCount ? payload.summary.cardInventoryCount : 0));
      $('metricReveal').textContent = payload.revealPassword ? 'Visible' : 'Hidden';

      $('ownerHint').textContent = payload.revealPassword ? 'Passwords visible on request' : 'Passwords masked by default';
      $('summaryHint').textContent = String(payload.summary && payload.summary.cardStatusCount ? payload.summary.cardStatusCount : 0) + ' status rows and ' + String(payload.summary && payload.summary.cardInventoryCount ? payload.summary.cardInventoryCount : 0) + ' inventory rows';
      $('inventoryHint').textContent = payload.companyKey ? 'Inventory linked to ' + payload.companyKey : 'Inventory will appear here';

      renderOwnerRows(payload.ownerAccess || [], payload.revealPassword);
      renderCardRows(payload.cardStatus || []);
      renderInventoryRows(payload.cardInventory || []);
      renderSidebar(payload);
    };

    const renderSearchResults = function(payload) {
      state.results = payload.results || [];
      if (state.searchMode === 'card') {
        renderCardResults(state.results);
        return;
      }

      renderCompanyResults(state.results);
    };

    const loadSearchResults = async function(query) {
      var endpoint = buildSearchUrl();
      var payload = await api(endpoint);
      renderSearchResults(payload);
      if (!queryInput.value.trim()) {
        setStatus(state.searchMode === 'card' ? 'Showing recent card hits.' : 'Ready. Search a company or click a suggestion.');
      }
      return payload;
    };

    const loadCompany = async function(companyKey) {
      var key = String(companyKey || queryInput.value || '').trim();
      if (!key) {
        setStatus('Type a company or card number first.', true);
        return;
      }

      setStatus('Loading ' + key + '...');
      var payload = await api(buildCompanyUrl(key));
      renderCompany(payload);
      setStatus('Loaded ' + (payload.companyName || payload.companyKey));
    };

    const loadCurrentView = function() {
      if (state.lastCompanyKey) {
        return loadCompany(state.lastCompanyKey);
      }
      return loadSearchResults(queryInput.value.trim());
    };

    const submitSearch = async function() {
      var query = queryInput.value.trim();

      if (state.searchMode === 'card') {
        var payload = await loadSearchResults(query);
        if (query && payload.results && payload.results.length === 1 && payload.results[0].company_key) {
          await loadCompany(payload.results[0].company_key);
        }
        return;
      }

      if (!query) {
        await loadSearchResults('');
        return;
      }

      await loadCompany(query);
    };

    const copyText = async function(value, label) {
      if (!value) {
        setStatus('Nothing to copy for ' + label.toLowerCase(), true);
        return;
      }

      await navigator.clipboard.writeText(value);
      setStatus(label + ' copied to clipboard');
    };

    const boot = async function() {
      try {
        await loadSearchResults('');
        setStatus('Ready. Search a company or a card number to load the unified snapshot.');
      } catch (error) {
        setStatus(error.message, true);
        renderEmptyResults('Hermes API is not responding yet.');
      }
    };

    $('modeCompany').addEventListener('click', function() {
      if (state.searchMode !== 'company') {
        setMode('company');
      }
    });

    $('modeCard').addEventListener('click', function() {
      if (state.searchMode !== 'card') {
        setMode('card');
      }
    });

    searchButton.addEventListener('click', function() {
      submitSearch().catch(function(error) {
        setStatus(error.message, true);
      });
    });

    refreshButton.addEventListener('click', function() {
      loadCurrentView().catch(function(error) {
        setStatus(error.message, true);
      });
    });

    refreshCompanyButton.addEventListener('click', function() {
      if (!state.lastCompanyKey) {
        return;
      }
      loadCompany(state.lastCompanyKey).catch(function(error) {
        setStatus(error.message, true);
      });
    });

    queryInput.addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
        submitSearch().catch(function(error) {
          setStatus(error.message, true);
        });
      }
    });

    queryInput.addEventListener('input', function() {
      var value = queryInput.value.trim();
      clearTimeout(window.__hermesSearchTimer);
      window.__hermesSearchTimer = setTimeout(function() {
        loadSearchResults(value).catch(function(error) {
          setStatus(error.message, true);
        });
      }, 220);
    });

    revealInput.addEventListener('change', function() {
      if (state.lastCompanyKey) {
        loadCompany(state.lastCompanyKey).catch(function(error) {
          setStatus(error.message, true);
        });
      }
    });

    copyEmailButton.addEventListener('click', function() {
      var owner = state.selectedCompany && state.selectedCompany.ownerAccess && state.selectedCompany.ownerAccess[0];
      copyText(owner && owner.owner_email, 'Email').catch(function(error) {
        setStatus(error.message, true);
      });
    });

    copyUsernameButton.addEventListener('click', function() {
      var owner = state.selectedCompany && state.selectedCompany.ownerAccess && state.selectedCompany.ownerAccess[0];
      copyText(owner && owner.username, 'Username').catch(function(error) {
        setStatus(error.message, true);
      });
    });

    copyPasswordButton.addEventListener('click', function() {
      var owner = state.selectedCompany && state.selectedCompany.ownerAccess && state.selectedCompany.ownerAccess[0];
      if (!revealInput.checked) {
        setStatus('Reveal passwords first if you need to copy them.', true);
        return;
      }
      copyText(owner && owner.password_ciphertext, 'Password').catch(function(error) {
        setStatus(error.message, true);
      });
    });

    boot();
  </script>
</body>
</html>`;
