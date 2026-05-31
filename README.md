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

