# Hermes Workflow

## Default Loop

1. Inspect the current repo state.
2. Read `task.md`, `progress.md`, and `.agents/state.md`.
3. Make a small change.
4. Run tests or a focused verification command.
5. Update docs when the state changes.
6. Commit and push the change set.

## Verification Ladder

- `npm test`
- API health check
- snapshot check
- company lookup check
- dashboard visual check

## Editing Rules

- Keep changes small and reversible.
- Prefer explicit selectors and explicit logging.
- Do not hide failures behind broad catch blocks.
- Avoid duplicating the same status in multiple places without a reason.

## Release Habit

- Every meaningful code or docs change should be pushed after it is verified.
- Docs changes should travel with the code they describe.
- If the dashboard changes, capture a screenshot before closing the task.
