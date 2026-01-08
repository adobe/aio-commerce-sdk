# `resolveExtensibilityConfig()`

```ts
function resolveExtensibilityConfig(cwd: string): Promise<null | string>;
```

Defined in: [packages/aio-commerce-lib-extensibility/source/config/lib/parser.ts:57](https://github.com/adobe/aio-commerce-sdk/blob/945f2e502f3b6166917844a3744609d215a8f7e2/packages/aio-commerce-lib-extensibility/source/config/lib/parser.ts#L57)

Try to find (up to the nearest package.json file) the extensibility config file.

Searches for config files in the following order of priority:

1. `extensibility.config.js` - JavaScript (CommonJS or ESM)
2. `extensibility.config.ts` - TypeScript
3. `extensibility.config.cjs` - CommonJS
4. `extensibility.config.mjs` - ES Module
5. `extensibility.config.mts` - ES Module TypeScript
6. `extensibility.config.cts` - CommonJS TypeScript

## Parameters

| Parameter | Type     | Description                   |
| --------- | -------- | ----------------------------- |
| `cwd`     | `string` | The current working directory |

## Returns

`Promise`\<`null` \| `string`\>

The path to the config file, or null if not found
