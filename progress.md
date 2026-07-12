# Hermes Progress

## Current State

- Hermes is connected to the portfolio sheet `Client BY agent`.
- Chrome is isolated in a dedicated Hermes profile directory.
- Supabase bootstrap tables exist and inventory writes are filtered by portfolio.
- The inventory worker currently crawls the `company-account-cards` page and captures only rows that match the current portfolio.
- The inventory worker now supports a resume point and the local config starts from page 500.
- Hermes now exposes a local read API for health and snapshot routes.
- Hermes now exposes a merged company read endpoint that joins owner access, card status, and inventory data.
- Hermes now exposes a working card search endpoint for inventory lookups.
- Hermes auto-loads `.env` at startup, so Supabase credentials no longer depend on manual PowerShell export.
- Hermes now serves a local dashboard at `/dashboard` with a left-side company list, a center detail surface, and merged snapshots.
- The dashboard now uses a unified company/card search bar with up to 10 matched companies in the scrollable left rail.
- The dashboard now has `Cards` and `Credentials` tabs, with `Cards` owning the search flow and `Credentials` reserved for the email/password surface.
- The dashboard layout has been reshaped so the center panel owns the active company detail, actions, and a reserved password section.
- `AGENT.md` already exists and remains the repo-wide operating guide.
- The live dashboard has been reviewed and is readable, dark, and operator-focused.

## What Works

- portfolio loading from Zoho
- company key normalization
- owners sync flow
- card status flow
- Supabase persistence and audit trail
- inventory page-size control at the UI limit of `100 per page`
- filtering of inventory rows by portfolio before write
- local Hermes API for health and snapshot reads
- company-level Hermes endpoint with password masking by default
- card-level search endpoint for inventory lookups
- automatic `.env` loading on boot
- local dashboard for company search, card search, and merged data review
- unified dashboard search flow with a left-side company list and a center detail view
- project docs for task, progress, and agent guidance

## What Broke Recently

- pagination is still the most fragile part of the worker stack
- the worker needs a safer path for repeated runs and checkpointed inventory rescans

## Current Workaround

- keep the inventory crawl limited to `100 per page`
- use the exact `Next` button from the footer only
- keep the write side filtered to the current portfolio
- stop expanding the crawl until the pagination path is stable
- use the local Hermes API for read-only inspection of latest snapshots
- keep the dashboard as the main operator entry point

## Next Checkpoints

- keep the dashboard polished as the main operator surface with the left list + center detail flow
- keep the CMP scraping bot as a separate pending task
- decide the final password reveal behavior for the reserved password section
- keep using the inventory checkpoint workflow instead of re-running from page 1
