# `setGlobalLibConfigOptions()`

```ts
function setGlobalLibConfigOptions(options: LibConfigOptions): void;
```

Defined in: [packages/aio-commerce-lib-config/source/config-manager.ts:54](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-config/source/config-manager.ts#L54)

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

// All subsequent calls will use this cache timeout unless overridden
const schema = await getConfigSchema();
```
