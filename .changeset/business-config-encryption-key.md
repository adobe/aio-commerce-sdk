---
"@adobe/aio-commerce-plugin-app-management": patch
---

Fix the `commerce-app-business-config` skill to pass the `encryptionKey` option when reading or writing `password` fields, and to declare the encryption key input on every action that uses it.
