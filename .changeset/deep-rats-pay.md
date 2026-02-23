---
"@aio-commerce-sdk/scripting-utils": patch
"@adobe/aio-commerce-lib-config": patch
"@adobe/aio-commerce-lib-events": patch
"@adobe/aio-commerce-lib-auth": patch
"@adobe/aio-commerce-lib-core": patch
"@aio-commerce-sdk/common-utils": patch
"@adobe/aio-commerce-lib-api": patch
"@adobe/aio-commerce-lib-app": patch
"@adobe/aio-commerce-sdk": patch
"@aio-commerce-sdk/generators": patch
"@aio-commerce-sdk/config-tsdown": patch
"@aio-commerce-sdk/scripts": patch
---

Implements a rolldown plugin to correctly externalize transitive dependencies of private packages during build, but keep the source code of those same packages bundled.
