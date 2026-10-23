---
"@adobe/aio-commerce-lib-app": patch
---

Keep the `install.yaml` extension points in a fixed order (backend UI, configuration, then extensibility) so extensibility is applied last on upgrade. The `postinstall` hook reorders existing files. If `install.yaml` is still out of order, the `pre-app-build` hook reorders it and fails once, asking you to run the build again.
