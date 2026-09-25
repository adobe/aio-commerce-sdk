---
"@adobe/aio-commerce-lib-app": minor
---

Run a first-time installation through the same lifecycle plan/apply flow as an upgrade, so `POST /installation` returns a plan for both operations and `GET /installation` reports the latest attempt.

**Migration:** read the plan from the `202` body instead of the legacy installation state, and poll `GET /installation` for progress.

Before:

```json
{
  "message": "Installation started",
  "operation": "install",
  "activationId": "...",
  "id": "...",
  "status": "in-progress",
  "startedAt": "...",
  "step": {},
  "data": null
}
```

After:

```json
{
  "message": "Installation started",
  "operation": "install",
  "plan": {}
}
```

`GET /installation` is unchanged for an app that has not run a lifecycle attempt yet, such as one installed on the previous engine and not upgraded since.

`POST /installation/validation` now answers `400` when `commerceBaseUrl` is missing, instead of running validation without a Commerce instance to reach. The field was already documented as required.
