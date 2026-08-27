---
"@adobe/aio-commerce-lib-app": minor
---

Fix uninstallation failing for apps with a `dynamicList` Business Configuration field, caused by revalidating the recorded installation snapshot against a schema that required functions a JSON-serialized snapshot can never have. Uninstallation now validates the recorded config with `validateRecordedCommerceAppConfig`, which accepts a `dynamicList` field without `options`/`default`.
