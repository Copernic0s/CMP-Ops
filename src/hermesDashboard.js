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
      color-scheme: light;
      --bg: #f4f6fb;
      --panel: rgba(255, 255, 255, 0.72);
      --panel-2: rgba(255, 255, 255, 0.82);
      --panel-3: rgba(248, 249, 252, 0.88);
      --line: rgba(82, 92, 120, 0.12);
      --line-strong: rgba(82, 92, 120, 0.18);
      --text: #151726;
      --muted: #657085;
      --accent: #6d28d9;
      --accent-2: #7c3aed;
      --danger: #c2410c;
      --success: #2563eb;
      --warning: #a16207;
      --shadow: 0 20px 44px rgba(31, 41, 55, 0.08);
      --radius: 22px;
    }

    * { box-sizing: border-box; }
    html, body { min-height: 100%; }
    body {
      margin: 0;
      background:
        radial-gradient(circle at top right, rgba(124, 58, 237, 0.12), transparent 24%),
        radial-gradient(circle at bottom left, rgba(109, 40, 217, 0.08), transparent 26%),
        linear-gradient(180deg, #f8f9fd 0%, #eff2f8 100%);
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
        linear-gradient(rgba(21, 23, 38, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(21, 23, 38, 0.025) 1px, transparent 1px);
      background-size: 42px 42px;
      opacity: 0.4;
      mask-image: linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.05));
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
      background: rgba(255, 255, 255, 0.84);
      border: 1px solid rgba(82, 92, 120, 0.12);
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
      color: var(--text);
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
      background: rgba(255, 255, 255, 0.84);
      color: var(--text);
      border: 1px solid rgba(109, 40, 217, 0.18);
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
      padding: 18px 22px;
      min-height: auto;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
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
      margin-bottom: 8px;
    }

    .hero h2 {
      margin: 0;
      font-size: clamp(24px, 2.2vw, 32px);
      line-height: 1;
      letter-spacing: -0.05em;
      max-width: 14ch;
    }

    .hero p {
      margin: 8px 0 0;
      max-width: 68ch;
      color: var(--muted);
      font-size: 14px;
      line-height: 1.6;
    }

    .hero-copy {
      position: relative;
      z-index: 1;
    }

    .hero-actions {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .tab-strip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px;
      border-radius: 999px;
      background: rgba(10, 15, 21, 0.72);
      border: 1px solid rgba(153, 171, 195, 0.16);
    }

    .tab-button {
      appearance: none;
      border: 0;
      border-radius: 999px;
      padding: 10px 14px;
      background: transparent;
      color: var(--muted);
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      transition: background 120ms ease, color 120ms ease, transform 120ms ease;
    }

    .tab-button:hover {
      transform: translateY(-1px);
    }

    .tab-button.is-active {
      background: rgba(127, 224, 199, 0.14);
      color: var(--accent);
    }

    .command-bar {
      border-radius: 24px;
      padding: 16px;
      display: grid;
      gap: 14px;
    }

    .app-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 14px 18px;
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.72);
      border: 1px solid rgba(82, 92, 120, 0.12);
      margin-bottom: 8px;
      position: sticky;
      top: 18px;
      z-index: 5;
      backdrop-filter: blur(18px);
    }

    .app-nav .brand-mini {
      display: grid;
      gap: 2px;
    }

    .app-nav .brand-mini strong {
      font-size: 24px;
      line-height: 1;
      letter-spacing: -0.04em;
    }

    .app-nav .brand-mini span {
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
      font-size: 10px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--accent-2);
    }

    .nav-links {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .nav-link {
      appearance: none;
      border: 0;
      background: transparent;
      color: var(--muted);
      padding: 10px 12px;
      border-radius: 999px;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      transition: background 120ms ease, color 120ms ease;
    }

    .nav-link.is-active {
      color: var(--accent);
      background: rgba(109, 40, 217, 0.1);
    }

    .nav-link:hover {
      color: var(--text);
    }

    .command-top {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
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
      background: rgba(255, 255, 255, 0.86);
      color: var(--text);
      padding: 14px 15px;
      font: inherit;
      outline: none;
    }

    .search-field input[type="search"]:focus {
      border-color: rgba(124, 58, 237, 0.5);
      box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.08);
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
      display: none;
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
      background: rgba(109, 40, 217, 0.1);
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

    .view-panel {
      display: grid;
      gap: 18px;
    }

    .view-panel.is-hidden {
      display: none;
    }

    #cardsView .metrics-grid,
    #cardsView .content-grid,
    #cardsView .password-panel,
    #cardsView > .footnote {
      display: none;
    }

    .cards-layout {
      display: grid;
      grid-template-columns: minmax(360px, 40%) minmax(0, 1fr);
      gap: 18px;
      align-items: start;
    }

    .cards-pane,
    .detail-pane {
      border-radius: 24px;
      background: var(--panel);
      border: 1px solid var(--line);
      box-shadow: var(--shadow);
      backdrop-filter: blur(18px);
      overflow: hidden;
    }

    .cards-pane {
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
      min-height: calc(100vh - 152px);
    }

    .cards-pane-head,
    .detail-pane-head {
      padding: 16px 18px 12px;
      border-bottom: 1px solid rgba(82, 92, 120, 0.09);
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
    }

    .cards-pane-head h3,
    .detail-pane-head h3 {
      margin: 0;
      font-size: 15px;
    }

    .cards-pane-body {
      padding: 12px 12px 14px;
      overflow: auto;
      min-height: 0;
    }

    .cards-pane .result-list {
      max-height: none;
      overflow: visible;
      padding-right: 0;
    }

    .detail-pane {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      min-height: calc(100vh - 152px);
    }

    .detail-pane-body {
      padding: 18px;
      display: grid;
      gap: 14px;
      min-height: 0;
      overflow: auto;
    }

    .hero-mini {
      display: grid;
      gap: 6px;
    }

    .hero-mini h2 {
      margin: 0;
      font-size: 24px;
      line-height: 1.05;
      letter-spacing: -0.04em;
    }

    .hero-mini p {
      margin: 0;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.55;
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
      background: rgba(255, 255, 255, 0.84);
      border: 1px solid rgba(82, 92, 120, 0.12);
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      text-align: left;
      width: 100%;
      cursor: pointer;
    }

    .result-item:hover {
      border-color: rgba(124, 58, 237, 0.28);
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
      background: rgba(37, 99, 235, 0.1);
      color: #1d4ed8;
    }

    .pill.warn {
      background: rgba(124, 58, 237, 0.1);
      color: var(--accent-2);
    }

    .pill.bad {
      background: rgba(194, 65, 12, 0.1);
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
      background: rgba(255, 255, 255, 0.7);
      border: 1px dashed rgba(82, 92, 120, 0.2);
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
      background: rgba(255, 255, 255, 0.68);
      border: 1px dashed rgba(82, 92, 120, 0.18);
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
      border: 1px solid rgba(82, 92, 120, 0.12);
      background: rgba(255, 255, 255, 0.74);
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
      background: rgba(246, 248, 252, 0.98);
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      font-size: 11px;
    }

    tr:hover td {
      background: rgba(109, 40, 217, 0.03);
    }

    .empty {
      padding: 18px;
      text-align: center;
      color: var(--muted);
      background: rgba(255, 255, 255, 0.55);
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

    .cards-pane .command-bar,
    .detail-pane .command-bar {
      border-radius: 0;
      border: 0;
      box-shadow: none;
      background: transparent;
      backdrop-filter: none;
      padding: 16px 18px 0;
      margin: 0;
    }

    .cards-pane .status-line,
    .detail-pane .status-line {
      padding-top: 0;
    }

    .cards-pane .search-field input[type="search"],
    .detail-pane .search-field input[type="search"] {
      min-height: 46px;
    }

    .cards-pane-head .secondary-button {
      padding: 10px 12px;
      border-radius: 999px;
      font-size: 12px;
      color: var(--accent);
      background: rgba(109, 40, 217, 0.08);
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

      .hero {
        flex-direction: column;
        align-items: flex-start;
      }

      .cards-layout {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="shell">
    <header class="app-nav">
      <div class="brand-mini">
        <strong>Almafuel Cards</strong>
      </div>
      <div class="nav-links" role="tablist" aria-label="Dashboard views">
        <button id="tabCards" class="nav-link is-active" type="button" data-view="cards">Cards</button>
        <button id="tabCredentials" class="nav-link" type="button" data-view="credentials">Credentials</button>
      </div>
    </header>

    <main class="workspace">
      <section id="cardsView" class="view-panel">
        <section class="cards-layout">
          <aside class="cards-pane">
            <section class="command-bar">
              <div class="command-top">
                <div class="search-field">
                  <label id="searchLabel" for="query">Search companies or cards</label>
                  <input id="query" type="search" placeholder="Type a company name or 17-digit card number" autocomplete="off" />
                </div>
              </div>
              <div class="status-line">
                <div id="status">Results update as you type.</div>
                <div class="status-chip" id="modeChip">Cards view</div>
              </div>
            </section>

            <div class="cards-pane-head">
              <div>
                <h3>Companies</h3>
                <div class="hint" id="resultsCount"></div>
              </div>
              <button id="syncDashboard" class="secondary-button" type="button">Sync now</button>
            </div>
            <div class="cards-pane-body">
              <div id="resultsList" class="result-list" aria-live="polite"></div>
            </div>
          </aside>

          <section class="detail-pane">
            <div class="detail-pane-body">
              <div class="hero-mini">
                <div class="eyebrow">Active company</div>
                <h2 id="detailCompanyName">No company loaded</h2>
                <p id="detailCompanyKey">Search or select a company from the left rail.</p>
              </div>

              <div class="company-stats">
                <div class="company-stat">
                  <div class="label">Card count</div>
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
                <div class="company-stat">
                  <div class="label">Last sync</div>
                  <div class="value" id="detailLastSync">—</div>
                </div>
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
                    <tr><td colspan="5" class="empty">Select a company to load its cards.</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </section>

        <div hidden aria-hidden="true">
          <div id="metricCompany"></div>
          <div id="metricCompanyKey"></div>
          <div id="metricOwners"></div>
          <div id="metricCards"></div>
          <div id="metricReveal"></div>
          <div id="ownerHint"></div>
          <div id="summaryHint"></div>
          <div id="inventoryHint"></div>
          <div id="detailOwnerName"></div>
          <div id="detailNote"></div>
          <table><tbody id="ownerBody"></tbody></table>
          <table><tbody id="cardBody"></tbody></table>
          <button id="copyEmail"></button>
          <button id="copyUsername"></button>
          <button id="copyPassword"></button>
          <button id="refreshCompany"></button>
        </div>
      </section>

      <section id="credentialsView" class="view-panel is-hidden">
        <section class="cards-layout">
          <aside class="cards-pane">
            <section class="command-bar">
              <div class="command-top">
                <div class="search-field">
                  <label for="credentialsQuery">Credentials lookup</label>
                  <input id="credentialsQuery" type="search" placeholder="Search a company to inspect credentials" autocomplete="off" />
                </div>
              </div>
              <div class="status-line">
                <div id="credentialsStatus">Credentials view ready.</div>
                <div class="status-chip">Credentials view</div>
              </div>
            </section>

            <div class="cards-pane-head">
              <div>
                <h3>Credential companies</h3>
                <div class="hint" id="credentialCount"></div>
              </div>
            </div>
            <div class="cards-pane-body">
              <div id="credentialList" class="result-list" aria-live="polite"></div>
            </div>
          </aside>

          <section class="detail-pane">
            <div class="detail-pane-body">
              <div class="hero-mini">
                <div class="eyebrow">Credentials</div>
                <h2 id="credentialCompanyName">No company selected</h2>
                <p id="credentialCompanyKey">Email and password details will appear here.</p>
                <div class="hero-actions">
                  <button id="credentialReveal" class="secondary-button" type="button">Reveal passwords</button>
                </div>
              </div>

              <div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Email</th>
                      <th>Username</th>
                      <th>Password</th>
                    </tr>
                  </thead>
                  <tbody id="credentialBody">
                    <tr><td colspan="4" class="empty">Select a company to load credentials.</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </section>
      </section>
    </main>
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
    const resultsList = $('resultsList');
    const credentialList = $('credentialList');
    const status = $('status');
    const credentialsStatus = $('credentialsStatus');
    const modeChip = $('modeChip');
    const tabCardsButton = $('tabCards');
    const tabCredentialsButton = $('tabCredentials');
    const resultsCount = $('resultsCount');
    const cardsView = $('cardsView');
    const credentialsView = $('credentialsView');
    const detailCompanyName = $('detailCompanyName');
    const detailCompanyKey = $('detailCompanyKey');
    const detailOwnerName = $('detailOwnerName');
    const detailNote = $('detailNote');
    const detailCardsCount = $('detailCardsCount');
    const detailActiveCount = $('detailActiveCount');
    const detailInactiveCount = $('detailInactiveCount');
    const detailLastSync = $('detailLastSync');
    const copyEmailButton = $('copyEmail');
    const copyUsernameButton = $('copyUsername');
    const copyPasswordButton = $('copyPassword');
    const refreshCompanyButton = $('refreshCompany');
    const syncDashboardButton = $('syncDashboard');
    const credentialHint = $('credentialHint');
    const credentialBody = $('credentialBody');
    const credentialCount = $('credentialCount');
    const credentialCompanyName = $('credentialCompanyName');
    const credentialCompanyKey = $('credentialCompanyKey');
    const credentialRevealButton = $('credentialReveal');
    const credentialsQuery = $('credentialsQuery');

    const escapeHtml = ${escapeHtml.toString()};
    let searchTimer = null;
    let credentialsSearchTimer = null;
    state.credentialsRevealPasswords = false;

    const setNodeText = function(node, value) {
      if (node) {
        node.textContent = value;
      }
    };

    const setStatus = function(message, error) {
      setNodeText(status, message);
      if (status) {
        status.style.color = error ? 'var(--danger)' : 'var(--muted)';
      }
    };

    const setView = function(view) {
      var activeView = view === 'credentials' ? 'credentials' : 'cards';
      cardsView.classList.toggle('is-hidden', activeView !== 'cards');
      credentialsView.classList.toggle('is-hidden', activeView !== 'credentials');
      tabCardsButton.classList.toggle('is-active', activeView === 'cards');
      tabCredentialsButton.classList.toggle('is-active', activeView === 'credentials');
      setNodeText(modeChip, activeView === 'cards' ? 'Cards view' : 'Credentials view');
      if (credentialsStatus) {
        setNodeText(credentialsStatus, activeView === 'cards'
          ? 'Cards view ready.'
          : 'Credentials view ready.');
      }
    };

    const syncSearchFields = function(value) {
      var nextValue = String(value || '');
      if (queryInput.value !== nextValue) {
        queryInput.value = nextValue;
      }
      if (credentialsQuery && credentialsQuery.value !== nextValue) {
        credentialsQuery.value = nextValue;
      }
    };

    const api = async function(path) {
      const response = await fetch(path, { headers: { accept: 'application/json' } });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Request failed');
      }
      return payload;
    };

    const buildCompanyUrl = function(companyKey, options = {}) {
      const encoded = encodeURIComponent(companyKey);
      const revealPassword = Boolean(options.revealPassword);
      return '/company/' + encoded + '?revealPassword=' + (revealPassword ? 'true' : 'false');
    };

    const getSearchPlaceholder = function() {
      return 'Type a company name or 17-digit card number';
    };

    const renderEmptyResults = function(message) {
      resultsList.innerHTML = '<div class="empty">' + escapeHtml(message) + '</div>';
      if (resultsCount) {
        resultsCount.textContent = '';
      }
    };

    const renderEmptyCredentialResults = function(message) {
      if (credentialList) {
        credentialList.innerHTML = '<div class="empty">' + escapeHtml(message) + '</div>';
      }
      if (credentialCount) {
        credentialCount.textContent = '';
      }
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

    const mergeCredentialCompanies = function(ownerRows, limit = 20) {
      const merged = new Map();

      (ownerRows || []).forEach(function(row) {
        const companyKey = String(row.company_key || row.companyKey || row.company_name || '').trim();
        if (!companyKey) {
          return;
        }

        const normalizedKey = companyKey.toLowerCase();
        const current = merged.get(normalizedKey) || {
          companyKey: companyKey,
          companyName: String(row.company_name || row.companyName || companyKey).trim(),
          lastSyncedAt: row.last_synced_at || row.lastSyncedAt || null,
          ownerAccessCount: 0
        };

        current.ownerAccessCount += 1;
        if (!current.companyName) {
          current.companyName = String(row.company_name || row.companyName || companyKey).trim();
        }
        if (!current.lastSyncedAt) {
          current.lastSyncedAt = row.last_synced_at || row.lastSyncedAt || null;
        }

        merged.set(normalizedKey, current);
      });

      return Array.from(merged.values())
        .sort(function(left, right) {
          return String(right.lastSyncedAt || '').localeCompare(String(left.lastSyncedAt || ''))
            || String(left.companyName || left.companyKey).localeCompare(String(right.companyName || right.companyKey));
        })
        .slice(0, limit);
    };

    const renderCompanyResults = function(items) {
      if (!items.length) {
        renderEmptyResults('No matches yet. Search a company name or card number.');
        return;
      }

      if (resultsCount) {
        resultsCount.textContent = '';
      }

      var renderedList = items.map(function(item) {
        const statusLabel = item.matchedStatuses && item.matchedStatuses.length ? item.matchedStatuses[0] : 'Open snapshot';
        return (
          '<button type="button" class="result-item" data-company-key="' + escapeHtml(item.companyKey) + '">' +
            '<div>' +
              '<strong>' + escapeHtml(item.companyName || item.companyKey) + '</strong>' +
              '<span>' + escapeHtml(item.companyKey) + '</span>' +
            '</div>' +
            '<div class="pill ok">' + escapeHtml(statusLabel) + '</div>' +
          '</button>'
        );
      }).join('');

      resultsList.innerHTML = renderedList;

      resultsList.querySelectorAll('[data-company-key]').forEach(function(button) {
        button.addEventListener('click', function() {
          loadCompany(button.getAttribute('data-company-key')).catch(function(error) {
            setStatus(error.message, true);
          });
        });
      });
    };

    const renderCredentialCompanies = function(items) {
      if (!items.length) {
        renderEmptyCredentialResults('No companies with credentials yet.');
        return;
      }

      if (credentialCount) {
        credentialCount.textContent = String(items.length) + ' companies';
      }

      var renderedList = items.map(function(item) {
        return (
          '<button type="button" class="result-item" data-company-key="' + escapeHtml(item.companyKey) + '">' +
            '<div>' +
              '<strong>' + escapeHtml(item.companyName || item.companyKey) + '</strong>' +
            '</div>' +
            '<div class="pill warn">' + escapeHtml(String(item.ownerAccessCount || 0)) + ' creds</div>' +
          '</button>'
        );
      }).join('');

      credentialList.innerHTML = renderedList;
      credentialList.querySelectorAll('[data-company-key]').forEach(function(button) {
        button.addEventListener('click', function() {
          loadCompany(button.getAttribute('data-company-key'), {
            revealPassword: state.credentialsRevealPasswords
          }).catch(function(error) {
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

    const renderCredentialRows = function(rows, revealPassword) {
      if (!rows.length) {
        setNodeText(credentialHint, 'No company loaded');
        credentialBody.innerHTML = '<tr><td colspan="4" class="empty">Load a company from Cards first.</td></tr>';
        return;
      }

      setNodeText(credentialHint, revealPassword ? 'Passwords visible' : 'Passwords masked');
      credentialBody.innerHTML = rows.map(function(row) {
        return (
          '<tr>' +
            '<td>' + escapeHtml(row.company_name || '—') + '</td>' +
            '<td>' + escapeHtml(row.owner_email || '—') + '</td>' +
            '<td>' + escapeHtml(row.username || '—') + '</td>' +
            '<td>' + (revealPassword ? escapeHtml(row.password_ciphertext || '—') : '<span class="pill warn">Hidden</span>') + '</td>' +
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

    const renderSelectedCompany = function(payload) {
      var hasCompany = Boolean(payload && payload.companyKey);
      var summary = payload && payload.summary ? payload.summary : {};
      var activeCards = 0;
      var inactiveCards = 0;
      var latestSyncedAt = '';
      var latestSyncedTime = 0;

      var updateLatestSync = function(row) {
        var value = String(row && row.last_synced_at ? row.last_synced_at : '').trim();
        if (!value) return;
        var parsed = Date.parse(value);
        if (!Number.isFinite(parsed) || parsed < latestSyncedTime) return;
        latestSyncedTime = parsed;
        latestSyncedAt = value;
      };

      (payload && payload.ownerAccess ? payload.ownerAccess : []).forEach(updateLatestSync);
      (payload && payload.cardStatus ? payload.cardStatus : []).forEach(updateLatestSync);

      (payload && payload.cardInventory ? payload.cardInventory : []).forEach(function(row) {
        updateLatestSync(row);
        var companyStatus = String(row.company_status || '').toLowerCase();
        var cardStatus = String(row.card_status || '').toLowerCase();
        if (companyStatus.includes('active') || cardStatus.includes('active')) {
          activeCards += 1;
        } else {
          inactiveCards += 1;
        }
      });

      setNodeText(detailCompanyName, hasCompany ? (payload.companyName || payload.companyKey) : 'No company loaded');
      setNodeText(detailCompanyKey, hasCompany
        ? (payload.companyKey + ' · ' + String(summary.cardInventoryCount || 0) + ' cards')
        : 'Search or select a company from the left rail.');

      setNodeText(detailCardsCount, String((summary.cardStatusCount || 0) + (summary.cardInventoryCount || 0)));
      setNodeText(detailActiveCount, String(activeCards));
      setNodeText(detailInactiveCount, String(inactiveCards));
      setNodeText(detailLastSync, latestSyncedAt ? new Date(latestSyncedAt).toLocaleString() : '—');

    };

    const renderCompany = function(payload) {
      state.selectedCompany = payload;
      state.lastCompanyKey = payload.companyKey || '';

      setNodeText($('metricCompany'), payload.companyName || 'Unknown');
      setNodeText($('metricCompanyKey'), payload.companyKey || '—');
      setNodeText($('metricOwners'), String(payload.summary && payload.summary.ownerAccessCount ? payload.summary.ownerAccessCount : 0));
      setNodeText($('metricCards'), String((payload.summary && payload.summary.cardStatusCount ? payload.summary.cardStatusCount : 0) + (payload.summary && payload.summary.cardInventoryCount ? payload.summary.cardInventoryCount : 0)));
      setNodeText($('metricReveal'), payload.revealPassword ? 'Visible' : 'Hidden');

      setNodeText($('ownerHint'), payload.revealPassword ? 'Passwords visible on request' : 'Passwords masked by default');
      setNodeText($('summaryHint'), String(payload.summary && payload.summary.cardStatusCount ? payload.summary.cardStatusCount : 0) + ' status rows and ' + String(payload.summary && payload.summary.cardInventoryCount ? payload.summary.cardInventoryCount : 0) + ' inventory rows');
      setNodeText($('inventoryHint'), payload.companyKey ? 'Inventory linked to ' + payload.companyKey : 'Inventory will appear here');

      renderOwnerRows(payload.ownerAccess || [], payload.revealPassword);
      renderCardRows(payload.cardStatus || []);
      renderInventoryRows(payload.cardInventory || []);
      renderCredentialRows(payload.ownerAccess || [], payload.revealPassword);
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
        setStatus('Results update as you type.');
      } else {
        setStatus('Showing matched companies for "' + trimmed + '".');
      }

      return { results: merged };
    };

    const loadCredentialCompanies = async function(query) {
      var trimmed = String(query || '').trim();
      var payload = await api('/snapshot/owner-access?limit=200');
      var merged = mergeCredentialCompanies(payload || [], 20);

      if (trimmed) {
        var normalizedQuery = trimmed.toLowerCase();
        merged = merged.filter(function(item) {
          var companyName = String(item.companyName || '').toLowerCase();
          var companyKey = String(item.companyKey || '').toLowerCase();
          return companyName.includes(normalizedQuery) || companyKey.includes(normalizedQuery);
        });
      }

      renderCredentialCompanies(merged);

      if (!trimmed) {
        setStatus('Credentials companies loaded.');
      } else {
        setStatus('Showing credential companies for "' + trimmed + '".');
      }

      return { results: merged };
    };

    const loadCompany = async function(companyKey, options = {}) {
      var key = String(companyKey || queryInput.value || '').trim();
      if (!key) {
        setStatus('Type a company or card number first.', true);
        return;
      }

      setStatus('Loading ' + key + '...');
      var payload = await api(buildCompanyUrl(key, options));
      renderCompany(payload);
      setStatus('Loaded ' + (payload.companyName || payload.companyKey));
    };

    const submitSearch = async function() {
      var query = queryInput.value.trim();

      if (!query) {
        await loadSearchResults('');
        return;
      }

      var payload = await loadSearchResults(query);
      if (query && payload.results && payload.results.length === 1 && payload.results[0].companyKey) {
        await loadCompany(payload.results[0].companyKey, {
          revealPassword: state.credentialsRevealPasswords
        });
      }
    };

    const refreshVisibleView = async function() {
      var query = queryInput.value.trim();
      if (state.lastCompanyKey) {
        await Promise.all([
          loadSearchResults(query),
          loadCredentialCompanies(credentialsQuery ? credentialsQuery.value.trim() : query),
          loadCompany(state.lastCompanyKey, {
            revealPassword: state.credentialsRevealPasswords
          })
        ]);
        return;
      }

      await Promise.all([
        loadSearchResults(query),
        loadCredentialCompanies(credentialsQuery ? credentialsQuery.value.trim() : query)
      ]);
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
        setView('cards');
        await Promise.all([
          loadSearchResults(''),
          loadCredentialCompanies('')
        ]);
        setStatus('Results update as you type.');
      } catch (error) {
        setStatus(error.message, true);
        renderEmptyResults('Hermes API is not responding yet.');
      }
    };

    const scheduleCardsSearch = function(value) {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function() {
        loadSearchResults(String(value || '').trim()).catch(function(error) {
          setStatus(error.message, true);
        });
      }, 220);
    };

    const scheduleCredentialsSearch = function(value) {
      clearTimeout(credentialsSearchTimer);
      credentialsSearchTimer = setTimeout(function() {
        loadCredentialCompanies(String(value || '').trim()).catch(function(error) {
          setStatus(error.message, true);
        });
      }, 220);
    };

    tabCardsButton.addEventListener('click', function() {
      setView('cards');
    });

    tabCredentialsButton.addEventListener('click', function() {
      setView('credentials');
    });

    if (syncDashboardButton) {
      syncDashboardButton.addEventListener('click', function() {
        refreshVisibleView().catch(function(error) {
          setStatus(error.message, true);
        });
      });
    }

    refreshCompanyButton.addEventListener('click', function() {
      if (!state.lastCompanyKey) {
        return;
      }
      loadCompany(state.lastCompanyKey, {
        revealPassword: state.credentialsRevealPasswords
      }).catch(function(error) {
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
      syncSearchFields(value);
      scheduleCardsSearch(value);
    });

    if (credentialsQuery) {
      credentialsQuery.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
          syncSearchFields(credentialsQuery.value.trim());
          loadCredentialCompanies(credentialsQuery.value.trim()).catch(function(error) {
            setStatus(error.message, true);
          });
        }
      });

      credentialsQuery.addEventListener('input', function() {
        var value = credentialsQuery.value.trim();
        syncSearchFields(value);
        scheduleCredentialsSearch(value);
      });
    }

    if (credentialRevealButton) {
      credentialRevealButton.addEventListener('click', function() {
        state.credentialsRevealPasswords = !state.credentialsRevealPasswords;
        setNodeText(credentialRevealButton, state.credentialsRevealPasswords ? 'Hide passwords' : 'Reveal passwords');
        if (state.lastCompanyKey) {
          loadCompany(state.lastCompanyKey, {
            revealPassword: state.credentialsRevealPasswords
          }).catch(function(error) {
            setStatus(error.message, true);
          });
        }
      });
    }

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
      if (!state.credentialsRevealPasswords) {
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
