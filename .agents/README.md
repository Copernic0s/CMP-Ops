# Hermes Agent Hub

This folder is the quick navigation layer for Hermes work.

## What Lives Here

- [`state.md`](./state.md) for the latest verified runtime state
- [`workflow.md`](./workflow.md) for the edit, test, and verify loop
- [`skills.md`](./skills.md) for the skill map and when to use each skill

## How To Use It

1. Read [`state.md`](./state.md) before making changes.
2. Update [`workflow.md`](./workflow.md) when the process changes.
3. Keep [`skills.md`](./skills.md) aligned with the skills that matter most to Hermes.
4. Mirror any meaningful status changes back into [`progress.md`](../progress.md) and [`task.md`](../task.md).

## Project Shape

- `src/` holds the Hermes workers, API, and dashboard
- `supabase/` holds the bootstrap schema and database helpers
- `automation/` holds operational automation helpers
- `task.md` tracks active work
- `progress.md` tracks the live state and known gaps
