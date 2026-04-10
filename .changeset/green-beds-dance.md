---
"@adobe/aio-commerce-lib-app": minor
---

Add uninstallation flow on app unassociation.

- New `POST /installation/uninstallation` endpoint starts an async uninstallation workflow and returns 202 Accepted with the initial state.
- New `GET /installation/uninstallation` endpoint returns the current uninstallation status (200 with state or 204 if not started).
- New `POST /installation/uninstallation/execution` internal endpoint executes the uninstallation workflow steps asynchronously.
- New `DELETE /installation/uninstallation` endpoint clears the uninstallation state only, without triggering any offboarding.
- Removed `DELETE /installation` endpoint. Uninstallation is now handled exclusively through the `/installation/uninstallation` sub-path.
- Added uninstall method to each step that requires uninstallation logic, including the Admin UI SDK, eventing, webhooks, and custom installation steps.
- `defineCustomInstallationStep` now accepts an object with `install` and optional `uninstall` handlers in addition to a plain function, enabling per-step cleanup logic.
