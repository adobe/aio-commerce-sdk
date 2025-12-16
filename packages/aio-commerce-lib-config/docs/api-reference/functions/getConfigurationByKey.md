# `getConfigurationByKey()`

```ts
function getConfigurationByKey(
  configKey: string,
  selector: SelectorBy,
  options?: LibConfigOptions,
): Promise<{
  config: null | ConfigValue;
  scope: {
    code: string;
    id: string;
    level: string;
  };
}>;
```

Defined in: [packages/aio-commerce-lib-config/source/config-manager.ts:352](https://github.com/adobe/aio-commerce-sdk/blob/945f2e502f3b6166917844a3744609d215a8f7e2/packages/aio-commerce-lib-config/source/config-manager.ts#L352)

Gets a specific configuration value by key for a scope.

This function retrieves a single configuration value for a specific scope. It's useful
when you only need one configuration field rather than the entire configuration object.

## Parameters

| Parameter   | Type                                                      | Description                                               |
| ----------- | --------------------------------------------------------- | --------------------------------------------------------- |
| `configKey` | `string`                                                  | The name of the configuration field to retrieve.          |
| `selector`  | [`SelectorBy`](../type-aliases/SelectorBy.md)             | Scope selector specifying how to identify the scope.      |
| `options?`  | [`LibConfigOptions`](../type-aliases/LibConfigOptions.md) | Optional library configuration options for cache timeout. |

## Returns

`Promise`\<\{
`config`: `null` \| [`ConfigValue`](../type-aliases/ConfigValue.md);
`scope`: \{
`code`: `string`;
`id`: `string`;
`level`: `string`;
\};
\}\>

Promise resolving to configuration response with scope information and single config value (or null if not found).

## Example

```typescript
import {
  getConfigurationByKey,
  byScopeId,
  byCodeAndLevel,
  byCode,
} from "@adobe/aio-commerce-lib-config";

// Get a specific config value by scope ID
const result1 = await getConfigurationByKey("api_key", byScopeId("scope-123"));

if (result1.config) {
  console.log(`API Key: ${result1.config.value}`);
  console.log(`Origin: ${result1.config.origin.code}`);
}

// Get a specific config value by code and level
const result2 = await getConfigurationByKey(
  "enable_feature",
  byCodeAndLevel("website", "website"),
);

// Get a specific config value by code
const result3 = await getConfigurationByKey("api_key", byCode("website"));
```
