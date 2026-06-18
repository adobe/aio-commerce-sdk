---
"@adobe/aio-commerce-lib-core": minor
---

Export the `CommerceSdkErrorBaseOptions` and `CommerceSdkErrorOptions` types from the `./error` entrypoint so error subclasses in other packages can build their own options types from them instead of re-deriving the base shape.
