# `resolveCommerceAppConfig()`

```ts
function resolveCommerceAppConfig(cwd?: string): Promise<string | null>;
```

Defined in: [aio-commerce-lib-app/source/config/lib/parser.ts:67](https://github.com/adobe/aio-commerce-sdk/blob/71bf66656ef1fc6dd272a0821e8b00aab5dc197e/packages/aio-commerce-lib-app/source/config/lib/parser.ts#L67)

Try to find (up to the nearest package.json file) the app config file.

Searches for config files in the following order of priority:

1. `app.commerce.config.js` - JavaScript (CommonJS or ESM)
2. `app.commerce.config.cjs` - CommonJS
3. `app.commerce.config.mjs` - ES Module
4. `app.commerce.config.ts` - TypeScript
5. `app.commerce.config.mts` - ES Module TypeScript
6. `app.commerce.config.cts` - CommonJS TypeScript

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd`     | `string` | The current working directory |

## Returns

`Promise`\<`string` \| `null`\>

The path to the config file, or null if not found
