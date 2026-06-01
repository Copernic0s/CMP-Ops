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

Environment file:

- copy [`.env.example`](C:/Users/AndresMendez/Documents/Debors-Clean/CMP-Ops/.env.example) into `.env`
- fill in Chrome, CMP, and Supabase credentials before running the owners sync
