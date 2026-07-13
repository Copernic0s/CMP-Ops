# Hermes Task List

## Active

- [ ] Finish the full `owners` sync against the live CMP app using only the `Client BY agent` sheet
- [ ] Keep the dashboard polished as the main operator surface with `Cards` and `Credentials` tabs, a left company list, and a center detail view
- [ ] Continue wiring live portfolio data into the left rail and right detail view
- [ ] Define the final password reveal behavior for the credentials section
- [ ] Keep the CMP scraping bot as a separate pending task
- [ ] Keep the inventory checkpoint workflow available for future resyncs

## UI Backlog

- [ ] Make the cards search input accept spaces normally
- [ ] Allow sales-agent searches by the last 7 digits of the card number
- [ ] Refresh the palette to a white-forward layout with violet / purple accents
- [ ] Tune the status colors so `hold` is orange, `inactive` is red, `active` is green, and `fraud` is yellow
- [ ] Make the glassmorphism treatment more visible across cards and panels

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
- [x] Separate the Credentials tab into a company list plus detail/password flow
- [x] Guard the dashboard against missing DOM nodes so clicks do not throw null textContent errors
- [x] Add a living task file to keep the project backlog organized

## Notes

- `AGENT.md` is the main working guide for Hermes.
- `progress.md` tracks state and known failure modes.
- `task.md` tracks the active work that should survive context resets.
- The live CMP owners path in the current profile is `Customers Services` -> `Users Management` -> `Owners`.
- The owners sync is being driven from the `Client BY agent` sheet so dashboard data stays aligned with the current portfolio.
