---
"@adobe/aio-commerce-lib-app": patch
---

Generate `install.yaml` extension points in a fixed order (backend UI, configuration, then extensibility), so extensibility is always applied last on upgrade.
