---
"@adobe/aio-commerce-lib-app": patch
---

Keep the extension points in `app.config.yaml` in a fixed order (backend UI, configuration, then extensibility) so an upgrade works reliably. `init` and the `postinstall` hook write and reorder the file. If it is still out of order, the `pre-app-build` hook reorders it and fails once, asking you to run the build again. Also stop `init` from adding a blank line before the `extensions` key in `install.yaml`.
