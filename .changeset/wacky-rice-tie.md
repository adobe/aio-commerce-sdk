---
"@adobe/aio-commerce-lib-auth": patch
"@aio-commerce-sdk/scripting-utils": patch
---

Fix `syncImsCredentials` crashing when `.env` file does not exist; warns with an actionable message when credentials cannot be synced
