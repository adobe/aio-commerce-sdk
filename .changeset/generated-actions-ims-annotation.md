---
"@adobe/aio-commerce-lib-app": minor
---

Generated `association` and `installation` actions now receive OAuth Server-to-Server credentials through the `include-ims-credentials` annotation instead of `AIO_COMMERCE_AUTH_IMS_*` inputs. Re-run `generate actions` to add the annotation and drop the legacy inputs from existing projects. The `AIO_COMMERCE_AUTH_IMS_*` fields of `LifecycleContext["params"]` are deprecated; custom installation scripts should use `resolveImsAuthParams(context.params)` from `@adobe/aio-commerce-lib-auth` instead.
