---
"@adobe/aio-commerce-lib-app": minor
---

Use the app's declared version (`metadata.version`) as the update signal, instead of the deployed action's runtime version. The app-config `GET /` response no longer includes a `deploymentVersion` field, and update-status reports sent to the Extension Manager no longer include one either.
