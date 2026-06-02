# Hermes Session Notes - 2026-06-02

## Context

Today we moved Hermes from a working backend/read harness into a more complete operational console.

The focus was not only data retrieval, but also the product shape:

- clarify the information architecture
- create a stronger operator UI
- add global lookup by company and by card number
- keep password handling server-side and masked by default
- keep the project separate from Debtors

## What Was Confirmed Before This Session

By the end of the previous work, these pieces were already working:

- portfolio ingestion from Zoho sheet `Client BY agent`
- portfolio normalization and filtering
- Supabase bootstrap schema
- CMP owner access sync
- CMP card status sync
- CMP inventory crawl with checkpoint support
- merged company read endpoint
- local Hermes read API
- local dashboard route
- automatic `.env` loading

The inventory crawl had already been validated repeatedly against CMP and was returning stable results from around page 500 onward.

## Main Work Completed Today

### 1. Redesigned the Hermes dashboard shell

We replaced the earlier lightweight dashboard with a more product-like operational shell inspired by the Cabinet-style layout you shared.

The new UI now includes:

- a fixed left sidebar
- selected company summary
- owner information summary
- quick actions for copying:
  - email
  - username
  - password
- a stronger top command bar
- mode switching between:
  - company search
  - card-number search
- search results panel
- metrics cards
- owner access table
- card status table
- inventory rows table

The intent was to make Hermes feel like a real internal ops console, not a demo panel.

### 2. Added a global card search endpoint

The API now exposes a new card lookup route:

- `GET /cards?q=...`

This is separate from:

- `GET /companies?q=...`
- `GET /company/:companyKey`
- `GET /snapshot`
- `GET /snapshot/:table`

The card endpoint reads from `cmp_card_inventory`, which lets the dashboard search by:

- card number
- company name
- company key
- organization
- EFS account

That gives us a real global lookup path for the dashboard command bar.

### 3. Reworked company and card suggestion lookup

The read layer in `src/hermesRead.js` was extended to support:

- merged company suggestions from:
  - `cmp_owner_access`
  - `cmp_card_status`
  - `cmp_card_inventory`
- direct company snapshot reads
- card inventory lookup reads

The merged company snapshot still returns:

- `companyKey`
- `companyName`
- `revealPassword`
- `ownerAccess`
- `cardStatus`
- `cardInventory`
- `summary`

Passwords remain masked unless `revealPassword=true`.

### 4. Expanded the dashboard routes

`src/hermesApi.js` now serves:

- `/dashboard`
- `/ui`
- `/companies`
- `/cards`
- `/snapshot`
- `/snapshot/:table`
- `/company/:companyKey`
- `/health`

The root route also advertises the dashboard and cards endpoints.

### 5. Hardened `.env` loading

Hermes now auto-loads the local `.env` file at startup through `src/env.js`.

That means:

- API startup no longer depends on manual PowerShell environment exports
- Supabase credentials are loaded automatically if present in `.env`
- local development is much smoother

### 6. Updated docs and task tracking

We kept the operational docs current:

- `README.md`
- `progress.md`
- `task.md`

These now reflect:

- the dashboard shell
- the company and card search flow
- the local Hermes API
- the auto-loaded `.env`
- the merged snapshot model

## Technical Details By File

### `src/hermesDashboard.js`

This file now generates the browser-facing Hermes console HTML.

Important UI structure:

- sidebar with selected company summary
- command bar with mode switch
- result list that changes by mode
- metrics row
- owner access table
- card status table
- inventory table

Notable UX behavior:

- company search mode loads `/companies?q=...`
- card search mode loads `/cards?q=...`
- selecting a result loads `/company/:companyKey`
- reveal toggle refreshes the company snapshot with password visibility enabled
- sidebar copy actions target the currently selected company snapshot

### `src/hermesApi.js`

This file is the HTTP server for Hermes.

New behavior:

- serves the dashboard HTML at `/dashboard`
- serves a secondary alias at `/ui`
- serves card search results at `/cards`
- continues to serve merged company snapshots
- continues to serve general snapshot routes

### `src/hermesRead.js`

This file now handles the read-side data merging and search logic.

Key functions:

- `loadHermesSnapshot`
- `loadHermesTableSnapshot`
- `loadHermesCompanySnapshot`
- `searchHermesCompanies`
- `searchHermesCards`

The card search flow now queries `cmp_card_inventory` directly.

### `src/index.js`

The boot sequence still supports:

- `owners`
- `cards`
- `snapshot`
- `inventory`
- `api`

The `api` command starts Hermes API in read mode.

### `src/env.js`

Local `.env` parsing is now part of startup.

Behavior:

- reads `.env`
- ignores blank lines and comments
- does not override already-set environment values
- supports quoted values

## Validation Performed Today

### Automated tests

The test suite passed after the new dashboard and card search work.

Highlights:

- Hermes API health and snapshot routes passed
- merged company snapshot tests passed
- dashboard route returns the Hermes console HTML
- company search tests passed
- card search route was added and verified in API tests
- env loader tests passed

### Browser verification

We also verified the dashboard through the browser and confirmed that:

- the API responds on `127.0.0.1:3333`
- `/dashboard` serves the new HTML shell
- the route returns the Hermes console markup

## Git State

The dashboard and card-search cut was committed and pushed.

Latest commit:

- `933b091` - `build Hermes dashboard shell and card search`

## What This Session Changed At The Product Level

Before today, Hermes was mostly a data collection and read harness.

After today, Hermes is starting to look like a real operational panel with:

- a clear left-nav identity
- a global lookup flow
- company and card lookup separation
- merged data visibility
- password masking discipline
- a cleaner path to future filters and detail views

## Next Steps

The next logical iteration is:

1. polish the sidebar so it feels more like the target Cabinet-style reference
2. make card search even more direct for number-first workflows
3. add sharper status indicators for inactive cards
4. decide whether card search results should open the company snapshot directly or show a card-level detail drawer first
5. keep the inventory checkpoint workflow available for future re-syncs

## Operational Notes

- Hermes remains separate from Debtors.
- `Client BY agent` remains the portfolio source of truth.
- Password material stays server-side and masked by default.
- The UI should keep evolving as a console, not as a marketing page.
