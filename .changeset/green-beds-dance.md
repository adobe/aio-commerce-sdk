---
"@adobe/aio-commerce-lib-app": minor
---

Add uninstallation flow on app unassociation.

- New `DELETE /installation` endpoint starts an async uninstallation workflow and returns 202 Accepted with the initial state.
- New `GET /installation/uninstall` endpoint returns the current uninstallation status (200 with state or 204 if not started).
- New `DELETE /installation/execution` internal endpoint executes the uninstallation workflow steps asynchronously.
- Added uninstall method to the each step that requires uninstallation logic, including the Admin UI SDK, eventing, webhooks, and custom installation steps.
- `defineCustomInstallationStep` now accepts an object with `install` and optional `uninstall` handlers in addition to a plain function, enabling per-step cleanup logic.
