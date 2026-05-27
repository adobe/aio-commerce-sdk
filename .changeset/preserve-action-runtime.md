---
"@adobe/aio-commerce-lib-app": minor
---

Preserve a manually-set `runtime` on generated actions. Codegen no longer overwrites the `runtime` field in `ext.config.yaml`, so you can pin a different Node runtime (e.g. `nodejs:24`, whose image supports `require()` of ES modules) and it survives regeneration.
