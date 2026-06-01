# Hermes Progress

## Current State

- Hermes is connected to the portfolio sheet `Client BY agent`.
- Chrome is isolated in a dedicated Hermes profile directory.
- Supabase bootstrap tables exist and inventory writes are filtered by portfolio.
- The inventory worker currently crawls the `company-account-cards` page and captures only rows that match the current portfolio.
- `AGENT.md` already exists and remains the repo-wide operating guide.

## What Works

- portfolio loading from Zoho
- company key normalization
- owners sync flow
- card status flow
- Supabase persistence and audit trail
- inventory page-size control at the UI limit of `100 per page`
- filtering of inventory rows by portfolio before write

## What Broke Recently

- pagination became fragile when the worker tried to be too clever about the `Next` button
- the worker sometimes stops after page 1 if the selector misses the real footer button
- the crawl is still too broad operationally and needs a safer path for repeated runs

## Current Workaround

- keep the inventory crawl limited to `100 per page`
- use the exact `Next` button from the footer only
- keep the write side filtered to the current portfolio
- stop expanding the crawl until the pagination path is stable

## Next Checkpoints

- verify `Next` advances from page 1 to page 2 consistently
- confirm `matchedRecords` stays non-zero for known companies
- decide whether to keep the inventory worker or pivot to a lighter targeted sync path
