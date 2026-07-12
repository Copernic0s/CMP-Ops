# Hermes Task List

## Active

- [ ] Keep the dashboard polished as the main operator surface with a left company list, center detail view, and reserved password section
- [ ] Confirm the final branding text for the header and any logo or badge treatment
- [ ] Define the exact password behavior for the future secure reveal section
- [ ] Keep the inventory checkpoint workflow available for future resyncs

## Done

- [x] Separate Hermes Chrome profile from normal work sessions
- [x] Create Supabase bootstrap schema
- [x] Filter inventory persistence to the current portfolio
- [x] Add audit logging for runs
- [x] Add progress and task documentation
- [x] Add local Hermes read API for health and snapshot routes
- [x] Add merged company endpoint for owner access, card status, and inventory reads
- [x] Add card search endpoint for inventory lookups
- [x] Auto-load `.env` at startup for Supabase and Hermes credentials
- [x] Add browser dashboard for company and card lookup with merged snapshot review
- [x] Verify the Hermes read API against the live Supabase project with automatic `.env` loading
- [x] Verify the merged company endpoint against the live Supabase project
- [x] Verify the card search endpoint against the live Supabase project
- [x] Verify the dashboard route against the live Supabase project and tune the sidebar/command bar layout

## Notes

- `AGENT.md` is the main working guide for Hermes.
- `progress.md` tracks state and known failure modes.
- `task.md` tracks the active work that should survive context resets.
