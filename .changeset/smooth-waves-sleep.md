---
"@adobe/aio-commerce-lib-auth": patch
---

The ESM build of @adobe/aio-commerce-lib-auth fails when imported into ESM projects due to incompatible import statements for the CommonJS dependency @adobe/aio-lib-ims.

```bash
file:///path/to/node_modules/@adobe/aio-commerce-lib-auth/dist/es/index.js:15
import { context, getToken } from "@adobe/aio-lib-ims";
                  ^^^^^^^^
SyntaxError: Named export 'getToken' not found. The requested module '@adobe/aio-lib-ims' is a CommonJS module, which may not support all module.exports as named exports.
```

**Affected Versions**

@adobe/aio-commerce-lib-auth: All versions with ESM distribution
Occurs when using Node.js native ESM (projects with "type": "module" in package.json)

**Root Cause**

The library's ESM distribution (/dist/es/index.js) attempts to use named imports from @adobe/aio-lib-ims, which is a CommonJS module. Node.js ESM cannot directly import named exports from CommonJS modules, requiring the use of default imports instead.
