---
title: "resolveCommerceAppConfig()"
editUrl: false
prev: false
next: false
---

```ts
function resolveCommerceAppConfig(cwd?: string): Promise<string | null>;
```

Defined in: [aio-commerce-lib-app/source/config/lib/parser.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-app/source/config/lib/parser.ts#L52)

Try to find (up to the nearest package.json file) the app config file.

Searches for config files in the following order of priority:

1. `app.commerce.config.js` - JavaScript (CommonJS or ESM)
2. `app.commerce.config.ts` - TypeScript
3. `app.commerce.config.cjs` - CommonJS
4. `app.commerce.config.mjs` - ES Module
5. `app.commerce.config.mts` - ES Module TypeScript
6. `app.commerce.config.cts` - CommonJS TypeScript

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd`     | `string` | The current working directory |

## Returns

`Promise`\<`string` \| `null`\>

The path to the config file, or null if not found
