# `getConfigurationByKey()`

```ts
function getConfigurationByKey(
  configKey: string,
  selector: SelectorBy,
  options?: ConfigOptions,
): Promise<{
  config: ConfigValue | null;
  scope: {
    code: string;
    id: string;
    level: string;
  };
}>;
```

Defined in: [config-manager.ts:356](https://github.com/adobe/aio-commerce-sdk/blob/5f20787a78164e7b48d6abbf2d3b892fa2268319/packages/aio-commerce-lib-config/source/config-manager.ts#L356)

Gets a specific configuration value by key for a scope.

This function retrieves a single configuration value for a specific scope. It's useful
when you only need one configuration field rather than the entire configuration object.

## Parameters

| Parameter   | Type                                                | Description                                               |
| ----------- | --------------------------------------------------- | --------------------------------------------------------- |
| `configKey` | `string`                                            | The name of the configuration field to retrieve.          |
| `selector`  | [`SelectorBy`](../type-aliases/SelectorBy.md)       | Scope selector specifying how to identify the scope.      |
| `options?`  | [`ConfigOptions`](../type-aliases/ConfigOptions.md) | Optional library configuration options for cache timeout. |

## Returns

`Promise`\<\{
`config`: [`ConfigValue`](../type-aliases/ConfigValue.md) \| `null`;
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
