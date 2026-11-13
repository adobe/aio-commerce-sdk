---
"@adobe/aio-commerce-lib-app": minor
---

`generate actions` now also adds the required extension entries to `app.config.yaml` and `install.yaml`, like `init` does, and cleans up what it generated for a removed domain (generated files, an unmodified `ext.config.yaml`, empty folders and the entries). `generate all`, the `postinstall` hook and the `pre-app-build` hook of the extensibility extension do the same. When `pre-app-build` adds entries, it warns once to run the build again. It warns about removed-domain files it had to keep, and says nothing about what it deleted.
