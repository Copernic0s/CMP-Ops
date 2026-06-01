# Hermes Task List

## Active

- [ ] Stabilize inventory pagination so the worker reliably reaches page 2 and beyond
- [ ] Confirm the exact `Next` footer button in CMP across a few pages
- [ ] Validate whether `100 per page` is the best stable setting for repeated syncs
- [ ] Check why some runs return `matchedRecords: 0` even when the portfolio should match
- [ ] Decide whether to keep the full crawl or move to a lighter targeted path

## Done

- [x] Separate Hermes Chrome profile from normal work sessions
- [x] Create Supabase bootstrap schema
- [x] Filter inventory persistence to the current portfolio
- [x] Add audit logging for runs
- [x] Add progress and task documentation

## Notes

- `AGENT.md` is the main working guide for Hermes.
- `progress.md` tracks state and known failure modes.
- `task.md` tracks the active work that should survive context resets.
