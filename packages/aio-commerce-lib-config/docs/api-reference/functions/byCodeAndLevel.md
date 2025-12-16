# `byCodeAndLevel()`

```ts
function byCodeAndLevel(code: string, level: string): SelectorByCodeAndLevel;
```

Defined in: [packages/aio-commerce-lib-config/source/config-utils.ts:583](https://github.com/adobe/aio-commerce-sdk/blob/945f2e502f3b6166917844a3744609d215a8f7e2/packages/aio-commerce-lib-config/source/config-utils.ts#L583)

Creates a scope selector that identifies a scope by its code and level.

This selector is useful when you know both the scope code and its level in
the hierarchy (e.g., "website" level "website", "store" level "store").

## Parameters

| Parameter | Type     | Description                                                                       |
| --------- | -------- | --------------------------------------------------------------------------------- |
| `code`    | `string` | The code identifier of the scope (e.g., "us-east", "main_store").                 |
| `level`   | `string` | The level of the scope in the hierarchy (e.g., "website", "store", "store_view"). |

## Returns

[`SelectorByCodeAndLevel`](../type-aliases/SelectorByCodeAndLevel.md)

A selector object that identifies the scope by code and level.

## Example

```typescript
import {
  getConfiguration,
  byCodeAndLevel,
} from "@adobe/aio-commerce-lib-config";

// Get configuration for a website scope
const config = await getConfiguration(byCodeAndLevel("us-east", "website"));

// Get configuration for a store scope
const storeConfig = await getConfiguration(
  byCodeAndLevel("main_store", "store"),
);
```
