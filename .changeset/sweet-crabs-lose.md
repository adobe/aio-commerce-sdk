---
"@adobe/aio-commerce-lib-api": minor
---

[BREAKING]: Unify all `utils` into a single entrypoint. If you were previously using `import ... from "@adobe/aio-commerce-lib-config/utils/<something>"` now you need to import just from `utils`, effectively removing the `<something>` subpath.
