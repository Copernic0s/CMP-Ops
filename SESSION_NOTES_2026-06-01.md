# CMP Ops Session Notes - 2026-06-01

## What We Built Today

- Separated Hermes from Debtors into its own repo: `CMP-Ops`.
- Bootstrapped Hermes as a worker-based CMP orchestrator.
- Wired the portfolio source to Zoho sheet `Client BY agent`.
- Added normalized company key handling so portfolio names can be matched safely.
- Built Chrome profile attachment so Hermes can use a logged-in CMP session.
- Added the owners worker flow for CMP access data.
- Added persistence helpers for Supabase.
- Added the card status worker scaffold.
- Added the card inventory worker for `Company account cards list`.
- Added Supabase schema bootstrap files.
- Added snapshot reading for owners, card status, inventory, and audit rows.
- Added docs for the repo workflow and operating rules.

## Files Added Or Updated

- `AGENT.md`
- `plan.md`
- `README.md`
- `.env`
- `.env.example`
- `src/companyKey.js`
- `src/chrome.js`
- `src/portfolio.js`
- `src/cmpOwners.js`
- `src/cmpCards.js`
- `src/cmpInventory.js`
- `src/hermesStore.js`
- `src/hermesSync.js`
- `src/hermesRead.js`
- `src/index.js`
- `supabase/bootstrap.sql`
- `supabase/card_inventory.sql`
- `progress.md`
- `task.md`

## Current Architecture

Hermes is organized as:

1. Portfolio loader from Zoho.
2. CMP workers for access, card status, and inventory.
3. Supabase writer for audit and snapshots.
4. Snapshot reader for the latest persisted rows.
5. Chrome-attached browser session for CMP.

## Current Working Assumptions

- `Client BY agent` is the source of truth for the active portfolio.
- Only companies in that sheet should be persisted.
- Secrets stay in `.env` only.
- Hermes uses a dedicated Chrome data dir so normal browser sessions are not disturbed.
- CMP inventory page size is limited by the UI to `10, 20, 50, 100`.

## Current Issue

The main issue right now is the inventory crawl.

What is happening:

- Hermes opens `https://cmp-front.production.united-fuel.com/company-account-cards`.
- It switches the page size to `100 per page`.
- It reads page 1 correctly.
- It still only validates the first page in practice.
- The latest run now finds the search box and the table shell correctly, so the remaining blocker is the page-advance path.

What we already observed:

- Earlier versions were clicking the wrong `Next` target and sometimes jumping to a company detail page like `/company/35773`.
- The current version is more careful, but it still needs a stable pagination path.
- The current run still finishes after page 1 with `pagination ended`, even though the table clearly has more pages.

So the issue is not the portfolio filter. The issue is the pagination and page-advance detection on the CMP inventory table.

## What We Learned

- The inventory page does have a real paginated table.
- The footer shows:
  - `10 per page`
  - `20 per page`
  - `50 per page`
  - `100 per page`
  - `Previous`
  - page numbers
  - `Next`
  - `1-10 of ... items`
- `100 per page` is the highest real option in CMP.
- The worker can read the table header and rows on the first page.
- The worker still needs a more reliable way to advance and confirm the next page without drifting into a company route or stopping early.

## Current State Of Data Flow

- Inventory rows are filtered before write by the current portfolio.
- Only matching companies should be inserted into Supabase.
- The write path is clean enough.
- The read/pagination path is what still needs stabilization.

## Commands We Have Been Using

Inventory worker:

```powershell
cd C:\Users\AndresMendez\Documents\Debors-Clean\CMP-Ops
Remove-Item Env:HTTP_PROXY,Env:HTTPS_PROXY,Env:ALL_PROXY -ErrorAction SilentlyContinue
Get-Content .env | ForEach-Object {
  $trim = $_.Trim()
  if (-not $trim -or $trim.StartsWith('#')) { return }
  $idx = $trim.IndexOf('=')
  if ($idx -lt 0) { return }
  $name = $trim.Substring(0, $idx).Trim()
  $value = $trim.Substring($idx + 1)
  [System.Environment]::SetEnvironmentVariable($name, $value, 'Process')
}
node src/index.js inventory
```

Owners worker:

```powershell
node src/index.js owners
```

## Notes On GitHub

- Some commits were pushed successfully during the session.
- One or more later commits were left local when Git push hit proxy or credential issues.
- The safest way to verify the latest state in GitHub Desktop is to check whether `main` is ahead of `origin/main`.
- If GitHub Desktop shows pending local commits, push them from the UI once credentials are healthy.

## Next Step

The next step is not to expand the crawl anymore. The next step is to make pagination deterministic:

- confirm the exact `Next` button that advances the table
- confirm the page change with a reliable footer/range check
- stop the crawl only when the table really reaches the end

After that, we can decide whether inventory should stay as a crawl or move to a lighter targeted sync path.
