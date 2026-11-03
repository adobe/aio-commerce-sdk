---
"@adobe/aio-commerce-lib-auth": minor
---

`resolveImsAuthParams` resolves OAuth Server-to-Server credentials from the `include-ims-credentials` action annotation. Its fallback to manually wired `AIO_COMMERCE_AUTH_IMS_*` parameters is deprecated; use the annotation for new actions. `technicalAccountId` and `technicalAccountEmail` are now optional on IMS auth params.
