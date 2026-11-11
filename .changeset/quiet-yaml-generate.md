---
"@adobe/aio-commerce-lib-app": minor
---

`generate actions` now also adds the required extension entries to `app.config.yaml` and `install.yaml`, like `init` does. `generate all`, the `postinstall` hook and the `pre-app-build` hook include this step. When `pre-app-build` adds entries, it warns once to run the build again.
