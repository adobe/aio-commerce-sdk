---
"@adobe/aio-commerce-lib-config": patch
---

Make clearing a config entry (including `setSystemConfigByKey(key, null)`) succeed when `aio-lib-files` throws `ERROR_FILE_NOT_EXISTS`, which fixes `DELETE` on the association action returning a 500 when the stored file is already gone.
