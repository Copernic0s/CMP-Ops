# Hermes State

## Verified Today

- The repo is checked out locally and dependencies are installed.
- `npm test` passes.
- The Zoho sheet `Client BY agent` loads correctly and returns `178` unique companies.
- Hermes API health, snapshot, company, and card search routes work against Supabase.
- The dashboard loads at `/dashboard` and presents the Hermes console layout correctly.
- Passwords remain hidden by default.
- The `Citifuel` bookmark inside Chrome profile 8 still lands directly on `/owners`.
- Hermes now uses a dedicated browser profile for scraping while reading auth tokens from the existing `Profile 8` session, so other Chrome windows stay untouched.
- A live owner seed for `NOA EXPRESS LLC` succeeded with the dedicated Hermes browser profile.

## Important Data Sources

- Portfolio source: Zoho public sheet `Client BY agent`
- Database: Supabase project `https://dwocnbucyngozblvokvf.supabase.co`
- API host: `127.0.0.1:3333`
- Chrome profile: dedicated Hermes user data directory

## Current Risks

- Inventory crawling is still the most fragile workflow.
- The `Next` button path can drift if the CMP UI changes.
- Browser attach/restart behavior is still fragile if Chrome is already holding the authenticated profile open.
- `xlsx` is pinned to a version that `npm audit` flags as high risk.

## Current Focus

- keep the dashboard readable and operator-first
- keep the inventory checkpoint workflow safe for repeated runs
- keep the docs in sync with the live state
