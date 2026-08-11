---
"@adobe/aio-commerce-lib-app": minor
---

Add app-upgrade support for eventing, built on a shared, domain-agnostic foundation: a generic config diff engine (`diffConfig` and its classification helpers) fed by per-domain collectors, and a `runUpgrade` / `previewUpgrade` orchestrator that converges deployed state to a new configuration. Eventing reconciles its Adobe I/O Events and Commerce resources (add / remove, plus in-place registration updates); the other domains (webhooks, admin UI, custom-installation, business configuration) are registered as placeholders pending their own implementation. Removes the unused per-step `plan`/`apply` (`ResourceCapability`) surface in favor of this approach.
