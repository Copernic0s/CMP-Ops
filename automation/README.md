# Automation Notes

Hermes automation should live here.

Current assumptions:

- source portfolio comes from Zoho `Client BY agent`
- CMP access is gathered by a bot/worker attached to Chrome
- invoice logic stays out of this repo

Planned runtime pieces:

- portfolio loader
- CMP access worker
- CMP card status worker
- Hermes coordinator

Runtime outputs should be treated as ephemeral:

- logs
- downloads
- browser profiles
- cached snapshots

