# Hermes Plan

## Goal

Build Hermes as a dedicated CMP operations orchestrator.

Hermes should handle:

- owner access details
- company-linked email / username / password lookup
- card status per account
- change tracking and refreshable snapshots
- permission-aware display
- sync coordination and audit logging

This project is intentionally separate from Debtors.

## Why It Is Separate

- Debtors is centered on invoices, collections, and debt tracking.
- CMP access data and card state are sensitive and volatile.
- The sync cadence is different from invoice sync.
- Separate repos reduce regression risk and make security clearer.

## Source Of Truth

Hermes should only care about companies in the current portfolio.

Portfolio source:

- Zoho workbook
- sheet name: `Client BY agent`

The worker should read that sheet, normalize the company names, and only query CMP for matching companies.

## Suggested Architecture

### Data Layers

1. `cmp_owner_access`
   - company key
   - company name
   - owner name
   - owner email
   - username
   - password reference or encrypted payload
   - last synced at
   - source metadata

2. `cmp_card_status`
   - company key
   - company name
   - account or card identifier
   - current status
   - last seen status
   - status change timestamp
   - last synced at
   - source metadata

3. `cmp_sync_audit`
   - sync run id
   - source
   - run type
   - started at
   - ended at
   - records found
   - records updated
   - error

## Worker Model

Use a bot/worker rather than mixing this into the UI.

Recommended shape:

- one worker for portfolio loading from Zoho
- one worker for CMP owner/access data
- one worker for CMP card status
- one coordinator named `Hermes`

Hermes should coordinate, not scrape.

## Browser Strategy

Use a browser-attached worker.

Recommended default:

- attach to Chrome profile used for CMP
- keep the session isolated from Debtors
- prefer a stable worker flow first
- only move to Playwright if we decide to rebuild the scraper from scratch

For now, the safer route is a bot/worker with explicit selectors and retries.

## Security Rules

- never display passwords by default
- reveal passwords only after explicit user action and permission check
- keep password material out of browser state whenever possible
- keep service-role writes server-side only
- log access events if auditability is required

## Implementation Phases

### Phase 1

- confirm the CMP pages and selectors
- confirm the data model
- confirm how passwords will be stored
- build the portfolio loader from Zoho `Client BY agent`

### Phase 2

- create Supabase tables and policies
- create indexes for portfolio lookup and latest sync queries
- persist owners sync runs and audit history

### Phase 3

- build the worker skeleton
- add audit logging
- add retry and timeout handling
- attach the owners worker to a logged-in Chrome profile and capture password popups
- upsert owner access snapshots into Supabase after each company
- add the card status worker and persist card snapshots

### Phase 4

- build a small API for snapshot reads
- add UI surfaces only after the data flow is stable
- expose latest snapshot reads from Hermes CLI
- build the card inventory worker for company account cards list

### Phase 5

- add tests
- verify permission checks
- verify refresh behavior and stale-state handling

## Open Questions

- Should passwords be encrypted, tokenized, or stored as references only?
- Should card status refresh be timer-based or on-demand?
- Should Hermes stay headless by default or use a visible Chrome session?
- Which exact CMP screens expose owner/access data and card state?

## Success Criteria

- users can find current portfolio companies without manual CMP searching
- only the companies in `Client BY agent` are processed
- access data and card state stay separate from invoices
- sync runs are auditable and recover from browser instability
