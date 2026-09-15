---
"@adobe/aio-commerce-plugin-app-management": patch
---

Document that `npx @adobe/aio-commerce-lib-app init` must be re-run after adding the first install-requiring domain (`webhooks`, `eventing.commerce`/`eventing.external`, or `installation.customInstallationSteps`) to `app.commerce.config.ts`. Without it, `ext.config.yaml` never gets the `installation` action, so `aio app build`/`aio app deploy` succeed but Commerce has no endpoint to call and the webhook/event/install step never actually installs. Fixed in `commerce-app-webhooks`, `commerce-app-eventing`, and `commerce-app-storage`.
