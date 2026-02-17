# `setGlobalLibConfigOptions()`

```ts
function setGlobalLibConfigOptions(options: LibConfigOptions): void;
```

Defined in: [aio-commerce-lib-config/source/config-manager.ts:62](https://github.com/adobe/aio-commerce-sdk/blob/bee3eb8c11aa154d3874c063d578f589fe268ddf/packages/aio-commerce-lib-config/source/config-manager.ts#L62)

Sets global library configuration options that will be used as defaults for all operations of the library.

## Parameters

| Parameter | Type                                                      | Description                                        |
| --------- | --------------------------------------------------------- | -------------------------------------------------- |
| `options` | [`LibConfigOptions`](../type-aliases/LibConfigOptions.md) | The library configuration options to set globally. |

## Returns

`void`

## Example

```typescript
import { setGlobalLibConfigOptions } from "@adobe/aio-commerce-lib-config";

// Set a global cache timeout of 5 minutes (300000ms)
setGlobalLibConfigOptions({ cacheTimeout: 300000 });

// Set encryption key programmatically instead of using environment variable
setGlobalLibConfigOptions({
  encryptionKey:
    "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
});

// All subsequent calls will use this cache timeout unless overridden
const schema = await getConfigSchema();
```
