# `setCustomScopeTree()`

```ts
function setCustomScopeTree(
  request: SetCustomScopeTreeRequest,
  options?: LibConfigOptions,
): Promise<SetCustomScopeTreeResponse>;
```

Defined in: [aio-commerce-lib-config/source/config-manager.ts:511](https://github.com/adobe/aio-commerce-sdk/blob/748a0bd24e94d53382b57771372a239079940b3a/packages/aio-commerce-lib-config/source/config-manager.ts#L511)

Sets the custom scope tree, replacing all existing custom scopes with the provided ones.

Custom scopes allow you to define additional configuration scopes beyond the standard
Commerce scopes (global, website, store, store_view). This function replaces all
custom scopes, preserving system scopes (global and commerce).

## Parameters

| Parameter  | Type                                                                        | Description                                               |
| ---------- | --------------------------------------------------------------------------- | --------------------------------------------------------- |
| `request`  | [`SetCustomScopeTreeRequest`](../type-aliases/SetCustomScopeTreeRequest.md) | Custom scope tree request containing the scopes to set.   |
| `options?` | [`LibConfigOptions`](../type-aliases/LibConfigOptions.md)                   | Optional library configuration options for cache timeout. |

## Returns

`Promise`\<[`SetCustomScopeTreeResponse`](../type-aliases/SetCustomScopeTreeResponse.md)\>

Promise resolving to response with updated custom scopes.

## Examples

```typescript
import { setCustomScopeTree } from "@adobe/aio-commerce-lib-config";

// Set custom scopes
const result = await setCustomScopeTree({
  scopes: [
    {
      code: "region_us",
      label: "US Region",
      level: "custom",
      is_editable: true,
      is_final: false,
      children: [
        {
          code: "region_us_west",
          label: "US West",
          level: "custom",
          is_editable: true,
          is_final: true,
        },
      ],
    },
  ],
});

console.log(result.message); // "Custom scope tree updated successfully"
console.log(result.scopes); // Array of created/updated custom scopes
```

```typescript
import { setCustomScopeTree } from "@adobe/aio-commerce-lib-config";

// Update existing custom scope (preserves ID if code and level match)
const result = await setCustomScopeTree({
  scopes: [
    {
      id: "existing-scope-id", // Preserve existing ID
      code: "region_eu",
      label: "European Region",
      level: "custom",
      is_editable: true,
      is_final: false,
    },
  ],
});
```
