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

    .sidebar-brand {
      border-radius: 22px;
      padding: 18px 18px 16px;
      background:
        radial-gradient(circle at top, rgba(255, 255, 255, 0.04), transparent 55%),
        linear-gradient(180deg, rgba(22, 30, 41, 0.96), rgba(12, 18, 25, 0.96));
      border: 1px solid rgba(255, 255, 255, 0.06);
      display: grid;
      gap: 10px;
    }

    .brand-title {
      margin: 0;
      font-size: 22px;
      line-height: 1.05;
      letter-spacing: -0.05em;
    }

    .brand-subtitle {
      color: var(--muted);
      font-size: 13px;
      line-height: 1.5;
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
      grid-template-columns: minmax(0, 1fr) auto auto;
      gap: 12px;
      align-items: center;
    }

    .mode-switch {
      display: none;
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

    .detail-panel {
      display: grid;
      gap: 16px;
    }

    .detail-top {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
      gap: 14px;
      align-items: start;
    }

    .detail-note {
      border-radius: 20px;
      padding: 16px;
      background: rgba(8, 12, 17, 0.64);
      border: 1px dashed rgba(153, 171, 195, 0.2);
      color: var(--muted);
      line-height: 1.55;
      font-size: 13px;
    }

    .detail-note strong {
      color: var(--text);
    }

    .panel {
      border-radius: 22px;
      padding: 16px;
      min-width: 0;
    }

    .password-panel {
      display: grid;
      gap: 14px;
    }

    .password-placeholder {
      border-radius: 18px;
      padding: 18px;
      background: rgba(8, 12, 17, 0.68);
      border: 1px dashed rgba(153, 171, 195, 0.18);
      color: var(--muted);
      display: grid;
      gap: 8px;
      line-height: 1.5;
    }

    .password-placeholder strong {
      color: var(--text);
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

      .detail-top {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="eyebrow">Ops Console</div>
          <h1 class="brand-title">United Cabinet ALMAFUEL</h1>
        </div>

        <section class="results-panel">
          <div class="panel-head">
            <div>
              <h3 id="resultsTitle">Companies</h3>
            </div>
            <div class="hint" id="resultsCount">0 results</div>
          </div>
          <div id="resultsList" class="result-list" aria-live="polite"></div>
        </section>
      </aside>

      <main class="workspace">
        <section class="hero">
          <div class="eyebrow">United Cabinet ALMAFUEL</div>
          <h2>Company ops, cards, and passwords in one console.</h2>
          <p>
            Search a company or a 17-digit card number, then open the company detail view in the center to inspect cards, access rows, and the upcoming password section.
          </p>
        </section>

        <section class="command-bar">
          <div class="command-top">
            <div class="search-field">
              <label id="searchLabel" for="query">Global lookup</label>
              <input id="query" type="search" placeholder="Type a company name or 17-digit card number" autocomplete="off" />
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
            <div class="status-chip" id="modeChip">Unified search</div>
          </div>
        </section>

        <section class="panel detail-panel">
          <div class="detail-top">
            <div class="selected-company">
              <div class="label">Active company</div>
              <div class="company-name" id="detailCompanyName">No company loaded</div>
              <div class="company-key" id="detailCompanyKey">Search or select a company to populate this view.</div>
              <div class="owner-name" id="detailOwnerName">Owner details will appear here.</div>
            </div>
            <div class="detail-note" id="detailNote">
              <strong>Password area:</strong> this section is reserved for the future secure password view. For now it remains a placeholder so we can preserve the layout and add the logic cleanly.
            </div>
          </div>
          <div class="company-stats">
            <div class="company-stat">
              <div class="label">Owners</div>
              <div class="value" id="detailOwnersCount">0</div>
            </div>
            <div class="company-stat">
              <div class="label">Cards</div>
              <div class="value" id="detailCardsCount">0</div>
            </div>
            <div class="company-stat">
              <div class="label">Active</div>
              <div class="value" id="detailActiveCount">0</div>
            </div>
            <div class="company-stat">
              <div class="label">Inactive</div>
              <div class="value" id="detailInactiveCount">0</div>
            </div>
          </div>
          <div class="action-grid">
            <button id="copyEmail" class="secondary-button" type="button" disabled>Copy email</button>
            <button id="copyUsername" class="secondary-button" type="button" disabled>Copy username</button>
            <button id="copyPassword" class="primary-button" type="button" disabled>Copy password</button>
            <button id="refreshCompany" class="secondary-button" type="button" disabled>Refresh company</button>
          </div>
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

        <section class="panel password-panel">
          <div class="section-head">
            <h3>Password Section</h3>
            <div class="hint">Reserved for the secure password view</div>
          </div>
          <div class="password-placeholder">
            <strong>Pending implementation.</strong>
            This is where we will place the future password-specific view and controls once you confirm the exact behavior you want for masking, reveal, and copy actions.
          </div>
        </section>

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
    const resultsCount = $('resultsCount');
    const detailCompanyName = $('detailCompanyName');
    const detailCompanyKey = $('detailCompanyKey');
    const detailOwnerName = $('detailOwnerName');
    const detailNote = $('detailNote');
    const detailOwnersCount = $('detailOwnersCount');
    const detailCardsCount = $('detailCardsCount');
    const detailActiveCount = $('detailActiveCount');
    const detailInactiveCount = $('detailInactiveCount');
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

    const getSearchPlaceholder = function() {
      return 'Type a company name or 17-digit card number';
    };

    const renderEmptyResults = function(message) {
      resultsList.innerHTML = '<div class="empty">' + escapeHtml(message) + '</div>';
      resultsCount.textContent = '0 results';
    };

    const mergeSearchResults = function(companyItems, cardItems) {
      const merged = new Map();

      (companyItems || []).forEach(function(item) {
        const companyKey = String(item.companyKey || item.company_key || '').trim();
        if (!companyKey) {
          return;
        }
        merged.set(companyKey, {
          companyKey: companyKey,
          companyName: String(item.companyName || item.company_name || companyKey).trim(),
          lastSyncedAt: item.lastSyncedAt || item.last_synced_at || null,
          matchedCardNumbers: [],
          matchedStatuses: []
        });
      });

      (cardItems || []).forEach(function(item) {
        const companyKey = String(item.company_key || item.companyKey || '').trim();
        if (!companyKey) {
          return;
        }
        const current = merged.get(companyKey) || {
          companyKey: companyKey,
          companyName: String(item.company_name || item.companyName || companyKey).trim(),
          lastSyncedAt: item.last_synced_at || item.lastSyncedAt || null,
          matchedCardNumbers: [],
          matchedStatuses: []
        };
        if (!current.companyName) {
          current.companyName = String(item.company_name || item.companyName || companyKey).trim();
        }
        if (item.card_number && current.matchedCardNumbers.indexOf(item.card_number) === -1) {
          current.matchedCardNumbers.push(item.card_number);
        }
        const statusText = String(item.card_status || item.company_status || '').trim();
        if (statusText && current.matchedStatuses.indexOf(statusText) === -1) {
          current.matchedStatuses.push(statusText);
        }
        if (!current.lastSyncedAt) {
          current.lastSyncedAt = item.last_synced_at || item.lastSyncedAt || null;
        }
        merged.set(companyKey, current);
      });

      return Array.from(merged.values()).slice(0, 10);
    };

    const renderCompanyResults = function(items) {
      if (!items.length) {
        renderEmptyResults('No matches yet. Search a company name or card number.');
        return;
      }

      resultsCount.textContent = String(items.length) + ' companies';
      resultsList.innerHTML = items.map(function(item) {
        const cardLabel = item.matchedCardNumbers && item.matchedCardNumbers.length ? item.matchedCardNumbers[0] : '';
        const statusLabel = item.matchedStatuses && item.matchedStatuses.length ? item.matchedStatuses[0] : 'Open snapshot';
        return (
          '<button type="button" class="result-item" data-company-key="' + escapeHtml(item.companyKey) + '">' +
            '<div>' +
              '<strong>' + escapeHtml(item.companyName || item.companyKey) + '</strong>' +
              '<span>' + escapeHtml(item.companyKey) + (cardLabel ? ' · ' + escapeHtml(cardLabel) : '') + '</span>' +
            '</div>' +
            '<div class="pill ok">' + escapeHtml(statusLabel) + '</div>' +
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

    const renderSelectedCompany = function(payload) {
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

      detailCompanyName.textContent = hasCompany ? (payload.companyName || payload.companyKey) : 'No company loaded';
      detailCompanyKey.textContent = hasCompany ? payload.companyKey : 'Search or select a company to populate this view.';
      detailOwnerName.textContent = firstOwner
        ? ('Owner: ' + (firstOwner.owner_name || '—') + ' · ' + (firstOwner.owner_email || '—'))
        : 'Owner details will appear here.';
      detailNote.innerHTML = payload && payload.revealPassword
        ? '<strong>Password area:</strong> passwords are visible for this snapshot and the password section is ready to absorb the secure view later.'
        : '<strong>Password area:</strong> this section is reserved for the future secure password view. For now it remains a placeholder.';

      detailOwnersCount.textContent = String(summary.ownerAccessCount || 0);
      detailCardsCount.textContent = String((summary.cardStatusCount || 0) + (summary.cardInventoryCount || 0));
      detailActiveCount.textContent = String(activeCards);
      detailInactiveCount.textContent = String(inactiveCards);

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
      renderSelectedCompany(payload);
    };

    const loadSearchResults = async function(query) {
      var params = new URLSearchParams();
      var trimmed = String(query || '').trim();
      if (trimmed) {
        params.set('q', trimmed);
      }
      params.set('limit', '10');

      var payloads = await Promise.all([
        api('/companies?' + params.toString()),
        api('/cards?' + params.toString())
      ]);

      var merged = mergeSearchResults(payloads[0].results || [], payloads[1].results || []);
      state.results = merged;
      renderCompanyResults(merged);

      if (!trimmed) {
        setStatus('Ready. Search a company or card number to load the unified snapshot.');
      } else {
        setStatus('Showing matched companies for "' + trimmed + '".');
      }

      return { results: merged };
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

      if (!query) {
        await loadSearchResults('');
        return;
      }

      var payload = await loadSearchResults(query);
      if (query && payload.results && payload.results.length === 1 && payload.results[0].companyKey) {
        await loadCompany(payload.results[0].companyKey);
      }
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
        setStatus('Ready. Search a company or card number to load the unified snapshot.');
      } catch (error) {
        setStatus(error.message, true);
        renderEmptyResults('Hermes API is not responding yet.');
      }
    };

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
