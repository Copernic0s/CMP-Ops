# Hermes Agent Guide

This repository is a separate harness for CMP operations.

## Mission

Hermes coordinates CMP access and card-state workflows for only the companies that belong to our current portfolio.

## Non-Negotiables

- Keep Hermes separate from Debtors.
- Treat `Client BY agent` as the portfolio source of truth.
- Do not mix invoice sync logic into this repo.
- Keep password material server-side only.
- Prefer a worker/bot for CMP scraping, not ad hoc UI logic.
- Record sync runs in an audit trail.

## Harness Shape

Hermes should be built as a thin orchestration layer around specialized workers:

1. Portfolio loader
2. CMP access worker
3. CMP card-status worker
4. Audit writer
5. UI/API reader

The harness coordinates. The workers do the scraping.

## Working Rules

- Start by checking the current repo state before editing.
- Keep changes small and verifiable.
- Prefer explicit selectors, explicit retries, and explicit logging.
- Do not hide failures behind broad catch blocks.
- Keep browser sessions isolated from unrelated automation.
- Use the smallest surface that can answer the question.

## Data Rules

- Normalize company names before joining any CMP result to the portfolio.
- Only query or store data for companies present in `Client BY agent`.
- Store the sync time, source, and run metadata with every snapshot.
- Mask sensitive values by default.

## Security Rules

- Never display passwords by default.
- Reveal passwords only after explicit user action and permission checks.
- Keep secrets and service-role keys out of the browser.
- Avoid logging sensitive payloads.

## Implementation Preferences

- Use a browser-attached worker for CMP when the site requires an authenticated profile.
- Keep orchestration thin.
- Keep UI dumb.
- Prefer durable storage and snapshots over live scraping in the UI.
- Build a clear audit trail before adding fancy screens.

## Validation

- Verify the worker on a small portfolio slice before full runs.
- Confirm the portfolio filter before trusting any scraped row.
- Add tests for normalization, masking, and status mapping.
- Check the browser state after each meaningful workflow change.

## First Decision To Make

Decide whether Hermes will use:

- Playwright-based browser automation
- Selenium-based browser automation
- a hybrid worker model

The default should be the simplest worker that can reliably read the authenticated CMP pages.

