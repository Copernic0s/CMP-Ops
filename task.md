# Hermes Task List

## Active

- [ ] Keep the dashboard polished as the main operator surface with Cards and Credentials tabs, a left company list, and a center detail view
- [ ] Continue wiring live portfolio data into the left rail and right detail view
- [ ] Adjust the CMP workers to the current navigation labels and routes in the live app
- [ ] Run the full owners sync so the dashboard can show more credential rows from Supabase
- [ ] Define the exact password behavior for the future secure reveal section
- [ ] Keep the CMP scraping bot as a separate pending task
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
- [x] Refactor the dashboard into a light split-pane layout inspired by the Indeed reference
- [x] Seed a working owners row into Supabase from the live CMP session

## Notes

- `AGENT.md` is the main working guide for Hermes.
- `progress.md` tracks state and known failure modes.
- `task.md` tracks the active work that should survive context resets.
