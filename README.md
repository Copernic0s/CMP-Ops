# CMP Ops / Hermes

Hermes is the separate orchestrator for CMP operational data.

Scope:

- company access data
- card status data
- sync audit trail
- permission-aware display and worker coordination

Source of truth for the portfolio:

- Zoho sheet: `Client BY agent`
- only the companies currently assigned to our portfolio

Design notes:

- keep this repo separate from Debtors
- use a worker/bot for CMP scraping and sync
- keep invoices and ops flows isolated
- store secrets and password material server-side only

First milestone:

- wire a bot that reads the current portfolio from `Client BY agent`
- scrape only matching companies from CMP
- write access and card status snapshots into a dedicated model
- expose the data through a small Hermes API

Current implementation:

- portfolio loader module with workbook parsing
- normalized company-key extraction
- first boot path that loads the Zoho sheet and prints the company count
- first owners-worker path that can attach to a Chrome profile with session already open
- owners sync path that persists into Supabase and records an audit trail
- first card-status worker scaffold with Supabase persistence
- snapshot reader command for latest owners/cards/audit rows
- company account cards inventory worker scaffold
- small Hermes read API with health and snapshot routes
- unified company endpoint that joins owner access, card status, and inventory reads

Environment file:

- copy [`.env.example`](./.env.example) into `.env`
- fill in Chrome, CMP, and Supabase credentials before running the workers
- Hermes uses a dedicated Chrome data dir so it does not disturb your normal sessions
- Hermes auto-loads a local `.env` file on startup, so you do not need to export variables manually in PowerShell
- the default local setup points Chrome at `User Data Hermes` with `Default` profile
- on first run, that dedicated profile is clean; sign into CMP once there and Hermes can reuse it afterward
- CMP only exposes 10, 20, 50, and 100 rows per page; Hermes uses 100 to reduce the crawl count as much as the UI allows
- if you want Hermes to reuse another profile, set `HERMES_CHROME_FORCE_RESTART=true` only when you are okay with that profile being restarted with the debugger port
- Hermes exposes a local read API on `127.0.0.1:3333` by default; run `npm run api` after filling the Supabase env vars to serve health and snapshot endpoints
- the API also exposes `GET /company/:companyKey` or `GET /company?companyKey=...` for a merged company view, with passwords hidden unless `revealPassword=true`
- the API also exposes `GET /cards?q=...` for global card-number or company lookup
- the API serves a browser dashboard at `GET /dashboard` for company search, card search, and merged snapshot review

Database bootstrap:

- run [supabase/bootstrap.sql](./supabase/bootstrap.sql) once in the Supabase SQL editor
- that creates the owners, card status, inventory, and audit tables together
