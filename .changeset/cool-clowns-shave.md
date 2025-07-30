---
"@adobe/aio-commerce-lib-auth": minor
---

`ImsAuthConfig.context` could be received as `undefined` by the `context.set` method, after an `assertImsAuthParams` due to us discarding the Valibot output (which was setting a default). Now, the value is manually defaulted if not set.
