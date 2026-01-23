# `byScopeId()`

```ts
function byScopeId(scopeId: string): SelectorByScopeId;
```

Defined in: [packages/aio-commerce-lib-config/source/config-utils.ts:558](https://github.com/adobe/aio-commerce-sdk/blob/81080e04f8384168b56346d297e863e6ad7389cd/packages/aio-commerce-lib-config/source/config-utils.ts#L558)

Creates a scope selector that identifies a scope by its unique ID.

This is the most direct way to identify a scope when you already know its ID.
Scope IDs are unique identifiers assigned to each scope in the scope tree.

## Parameters

| Parameter | Type     | Description                         |
| --------- | -------- | ----------------------------------- |
| `scopeId` | `string` | The unique identifier of the scope. |

## Returns

[`SelectorByScopeId`](../type-aliases/SelectorByScopeId.md)

A selector object that identifies the scope by ID.

## Example

```typescript
import { getConfiguration, byScopeId } from "@adobe/aio-commerce-lib-config";

// Get configuration for a scope by its ID
const config = await getConfiguration(byScopeId("scope-123"));
```
