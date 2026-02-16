# `getConfiguration()`

```ts
function getConfiguration(
  selector: SelectorBy,
  options?: LibConfigOptions,
): Promise<GetConfigurationResponse>;
```

Defined in: [aio-commerce-lib-config/source/config-manager.ts:363](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-config/source/config-manager.ts#L363)

Gets configuration for a scope.

This function retrieves all configuration values for a specific scope, including
inherited values from parent scopes and schema defaults. The configuration is
merged according to the scope hierarchy.

## Parameters

| Parameter  | Type                                                      | Description                                               |
| ---------- | --------------------------------------------------------- | --------------------------------------------------------- |
| `selector` | [`SelectorBy`](../type-aliases/SelectorBy.md)             | Scope selector specifying how to identify the scope.      |
| `options?` | [`LibConfigOptions`](../type-aliases/LibConfigOptions.md) | Optional library configuration options for cache timeout. |

## Returns

`Promise`\<[`GetConfigurationResponse`](../type-aliases/GetConfigurationResponse.md)\>

Promise resolving to configuration response with scope information and config values.

## Example

```typescript
import {
  getConfiguration,
  byScopeId,
  byCodeAndLevel,
  byCode,
} from "@adobe/aio-commerce-lib-config";

// Get configuration by scope ID
const config1 = await getConfiguration(byScopeId("scope-123"));
console.log(config1.scope); // { id, code, level }
console.log(config1.config); // Array of config values with origins

// Get configuration by code and level
const config2 = await getConfiguration(byCodeAndLevel("website", "website"));
config2.config.forEach((item) => {
  console.log(`${item.name}: ${item.value} (from ${item.origin.code})`);
});

// Get configuration by code (uses default level)
const config3 = await getConfiguration(byCode("website"));
```
