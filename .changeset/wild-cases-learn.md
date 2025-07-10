---
"@adobe/aio-commerce-lib-auth": patch
---

- Fix typo in auth param `AIO_COMMERCE_IMS_IMS_ORG_ID` now is `AIO_COMMERCE_IMS_ORG_ID`
- Refactor `ImsAuthProvider` and `IntegrationAuthProvider` to not return `Result`
- Fix `env` parameter in `ImsAuthProvider`
- Fix snake casing of auth parameters in `ImsAuthProvider`
- Bump `@adobe/aio-commerce-lib-core` minor version.
