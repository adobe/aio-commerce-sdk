---
"@adobe/aio-commerce-lib-events": patch
---

Module resolution should work for cjs and es for aio-commerce-lib-events.

On publish the exports field in package.json should be:

```json
  "exports": {
    "./commerce": {
      "import": {
        "types": "./dist/es/commerce/index.d.ts",
        "default": "./dist/es/commerce/index.js"
      },
      "require": {
        "types": "./dist/cjs/commerce/index.d.cts",
        "default": "./dist/cjs/commerce/index.cjs"
      }
    },
    "./io-events": {
      "import": {
        "types": "./dist/es/io-events/index.d.ts",
        "default": "./dist/es/io-events/index.js"
      },
      "require": {
        "types": "./dist/cjs/io-events/index.d.cts",
        "default": "./dist/cjs/io-events/index.cjs"
      }
    },
    "./package.json": "./package.json"
  },
```

As there is no index file at the root of the dist folder, we need to specify the paths for both cjs and es modules, then by package module e.g commerce, io-events.
