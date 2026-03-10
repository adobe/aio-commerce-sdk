# `setConfiguration()`

```ts
function setConfiguration(
  request: SetConfigurationRequest,
  selector: SelectorBy,
  options?: ConfigOptions,
): Promise<SetConfigurationResponse>;
```

Defined in: [config-manager.ts:424](https://github.com/adobe/aio-commerce-sdk/blob/82d6951bafaec21f350f6bee78a78511d9934072/packages/aio-commerce-lib-config/source/config-manager.ts#L424)

Sets configuration values for a scope.

This function updates configuration values for a specific scope. The provided values
are merged with existing configuration, and the origin is set to the current scope.
Configuration values are inherited from parent scopes unless explicitly overridden.

## Parameters

| Parameter  | Type                                                                    | Description                                                    |
| ---------- | ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| `request`  | [`SetConfigurationRequest`](../type-aliases/SetConfigurationRequest.md) | Configuration set request containing the config values to set. |
| `selector` | [`SelectorBy`](../type-aliases/SelectorBy.md)                           | Scope selector specifying how to identify the scope.           |
| `options?` | [`ConfigOptions`](../type-aliases/ConfigOptions.md)                     | Optional library configuration options for cache timeout.      |

## Returns

`Promise`\<[`SetConfigurationResponse`](../type-aliases/SetConfigurationResponse.md)\>

Promise resolving to configuration response with updated scope and config values.

## Example

```typescript
import {
  setConfiguration,
  byScopeId,
  byCodeAndLevel,
} from "@adobe/aio-commerce-lib-config";

// Set configuration by scope ID
const result1 = await setConfiguration(
  {
    config: [
      { name: "api_key", value: "your-api-key-here" },
      { name: "enable_feature", value: true },
    ],
  },
  byScopeId("scope-123"),
);

// Set configuration by code and level
const result2 = await setConfiguration(
  {
    config: [
      { name: "timeout", value: 5000 },
      { name: "retry_count", value: 3 },
    ],
  },
  byCodeAndLevel("website", "website"),
);

console.log(result2.message); // "Configuration values updated successfully"
console.log(result2.scope); // Updated scope information
console.log(result2.config); // Array of updated config values
```
