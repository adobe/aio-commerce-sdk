---
"@adobe/aio-commerce-lib-config": patch
---

Fixes usages of the library binaries by using the package name only instead of the fully qualified org + package name. The latter was causing the binary to always be fetched from NPM, instead of using the locally installed one.
