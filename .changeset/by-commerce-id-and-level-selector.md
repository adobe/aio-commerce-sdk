---
"@adobe/aio-commerce-lib-config": minor
---

Add `byWebsiteId(id)`, `byStoreId(id)`, and `byStoreViewId(id)` selectors for `getConfiguration`, `getConfigurationByKey`, and `setConfiguration`. Each helper looks up a system scope by the numeric ID returned by the Commerce REST API (`/V1/store/websites`, `/V1/store/storeGroups`, `/V1/store/storeViews`) and hard-codes its level, so the same numeric ID can address a website, store, or store view unambiguously.
