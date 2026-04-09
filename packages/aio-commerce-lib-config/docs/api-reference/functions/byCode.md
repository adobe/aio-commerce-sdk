# `byCode()`

```ts
function byCode(code: string): SelectorByCode;
```

Defined in: [config-utils.ts:610](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-config/source/config-utils.ts#L610)

Creates a scope selector that identifies a scope by its code only.

This selector uses the scope code and will resolve to the default level for that code.
Use this when you want to let the system determine the appropriate level based on
the code alone.

## Parameters

| Parameter | Type     | Description                       |
| --------- | -------- | --------------------------------- |
| `code`    | `string` | The code identifier of the scope. |

## Returns

[`SelectorByCode`](../type-aliases/SelectorByCode.md)

A selector object that identifies the scope by code.

## Example

```typescript
import { getConfiguration, byCode } from "@adobe/aio-commerce-lib-config";

// Get configuration by code (uses default level)
const config = await getConfiguration(byCode("us-east"));
```
