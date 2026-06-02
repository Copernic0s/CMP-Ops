# Hermes Progress

## Current State

- Hermes is connected to the portfolio sheet `Client BY agent`.
- Chrome is isolated in a dedicated Hermes profile directory.
- Supabase bootstrap tables exist and inventory writes are filtered by portfolio.
- The inventory worker currently crawls the `company-account-cards` page and captures only rows that match the current portfolio.
- The inventory worker now supports a resume point and the local config starts from page 500.
- Hermes now exposes a local read API for health and snapshot routes.
- Hermes now exposes a merged company read endpoint that joins owner access, card status, and inventory data.
- Hermes auto-loads `.env` at startup, so Supabase credentials no longer depend on manual PowerShell export.
- `AGENT.md` already exists and remains the repo-wide operating guide.

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
- automatic `.env` loading on boot

## What Broke Recently

- pagination became fragile when the worker tried to be too clever about the `Next` button
- the worker sometimes stops after page 1 if the selector misses the real footer button
- the crawl is still too broad operationally and needs a safer path for repeated runs

## Current Workaround

- keep the inventory crawl limited to `100 per page`
- use the exact `Next` button from the footer only
- keep the write side filtered to the current portfolio
- stop expanding the crawl until the pagination path is stable
- use the local Hermes API for read-only inspection of latest snapshots

## Next Checkpoints

- verify the API health and snapshot routes against Supabase data
- verify the company endpoint against real Supabase data and password reveal rules
- decide the next read surface: CLI summary or small UI
- keep using the inventory checkpoint workflow instead of re-running from page 1
