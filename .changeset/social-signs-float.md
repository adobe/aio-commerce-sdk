---
"@adobe/aio-commerce-lib-config": patch
---

Fix a bug where `getConfigurationByKey` always required an `encryptionKey` even when querying fields that are not of type `password`.
