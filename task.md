# Hermes Task List

## Active

- [ ] Verify the Hermes read API against the live Supabase project with automatic `.env` loading
- [ ] Verify the merged company endpoint against the live Supabase project
- [ ] Verify the dashboard route against the live Supabase project and tune the tables if needed
- [ ] Keep the inventory checkpoint workflow available for future resyncs

## Done

- [x] Separate Hermes Chrome profile from normal work sessions
- [x] Create Supabase bootstrap schema
- [x] Filter inventory persistence to the current portfolio
- [x] Add audit logging for runs
- [x] Add progress and task documentation
- [x] Add local Hermes read API for health and snapshot routes
- [x] Add merged company endpoint for owner access, card status, and inventory reads
- [x] Auto-load `.env` at startup for Supabase and Hermes credentials
- [x] Add browser dashboard for company lookup and merged snapshot review

## Notes

- `AGENT.md` is the main working guide for Hermes.
- `progress.md` tracks state and known failure modes.
- `task.md` tracks the active work that should survive context resets.
