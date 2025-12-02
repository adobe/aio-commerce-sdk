# `@adobe/aio-commerce-lib-config`: `v0.8.1`

This module exports configuration management utilities for the AIO Commerce SDK.

## Type Aliases

| Type Alias                                                                     | Description                                                                                                                                      |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [AcceptableConfigValue](type-aliases/AcceptableConfigValue.md)                 | Represents an acceptable configuration value type (string, number, boolean, or undefined).                                                       |
| [CommerceScopeData](type-aliases/CommerceScopeData.md)                         | Commerce API response data containing websites, store groups, and store views.                                                                   |
| [ConfigOrigin](type-aliases/ConfigOrigin.md)                                   | Represents the origin of a configuration value, indicating which scope it came from.                                                             |
| [ConfigSchemaField](type-aliases/ConfigSchemaField.md)                         | The schema type for a configuration field.                                                                                                       |
| [ConfigSchemaOption](type-aliases/ConfigSchemaOption.md)                       | The schema type for an option in a list configuration field. Represents a single option that can be selected in a list-type configuration field. |
| [ConfigValue](type-aliases/ConfigValue.md)                                     | Represents a configuration value with its origin information.                                                                                    |
| [CustomScopeInput](type-aliases/CustomScopeInput.md)                           | Input type for a custom scope definition.                                                                                                        |
| [CustomScopeOutput](type-aliases/CustomScopeOutput.md)                         | Output type for a custom scope definition (includes assigned ID).                                                                                |
| [GetCachedScopeTreeParams](type-aliases/GetCachedScopeTreeParams.md)           | Parameters for getting the scope tree from cache.                                                                                                |
| [GetConfigSchemaResponse](type-aliases/GetConfigSchemaResponse.md)             | Response type for getting the configuration schema.                                                                                              |
| [GetConfigurationByKeyResponse](type-aliases/GetConfigurationByKeyResponse.md) | Response type for getting a single configuration value by key.                                                                                   |
| [GetConfigurationResponse](type-aliases/GetConfigurationResponse.md)           | Response type for getting configuration for a scope.                                                                                             |
| [GetFreshScopeTreeParams](type-aliases/GetFreshScopeTreeParams.md)             | Parameters for getting the scope tree from Commerce API.                                                                                         |
| [GetScopeTreeResult](type-aliases/GetScopeTreeResult.md)                       | Result from getting the scope tree.                                                                                                              |
| [GlobalLibConfigOptions](type-aliases/GlobalLibConfigOptions.md)               | Global fetch options with all properties required.                                                                                               |
| [LibConfigOptions](type-aliases/LibConfigOptions.md)                           | Options for controlling fetch behavior, particularly cache timeout.                                                                              |
| [ScopeNode](type-aliases/ScopeNode.md)                                         | Represents a single node in the scope tree hierarchy.                                                                                            |
| [ScopeTree](type-aliases/ScopeTree.md)                                         | Represents the complete scope tree as an array of root scope nodes.                                                                              |
| [SelectorBy](type-aliases/SelectorBy.md)                                       | Discriminated union type for selecting a scope by different methods.                                                                             |
| [SelectorByCode](type-aliases/SelectorByCode.md)                               | Selector type for identifying a scope by its code only.                                                                                          |
| [SelectorByCodeAndLevel](type-aliases/SelectorByCodeAndLevel.md)               | Selector type for identifying a scope by its code and level.                                                                                     |
| [SelectorByScopeId](type-aliases/SelectorByScopeId.md)                         | Selector type for identifying a scope by its unique ID.                                                                                          |
| [SetConfigurationRequest](type-aliases/SetConfigurationRequest.md)             | Request type for setting configuration values.                                                                                                   |
| [SetConfigurationResponse](type-aliases/SetConfigurationResponse.md)           | Response type for setting configuration values.                                                                                                  |
| [SetCustomScopeTreeRequest](type-aliases/SetCustomScopeTreeRequest.md)         | Request type for setting custom scope tree.                                                                                                      |
| [SetCustomScopeTreeResponse](type-aliases/SetCustomScopeTreeResponse.md)       | Response type for setting custom scope tree.                                                                                                     |
| [StoreGroup](type-aliases/StoreGroup.md)                                       | Represents a store group in Adobe Commerce.                                                                                                      |
| [StoreView](type-aliases/StoreView.md)                                         | Represents a store view in Adobe Commerce.                                                                                                       |
| [Website](type-aliases/Website.md)                                             | Represents a website in Adobe Commerce.                                                                                                          |

## Functions

| Function                                                            | Description                                                                                                |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [byCode](functions/byCode.md)                                       | Creates a scope selector that identifies a scope by its code only.                                         |
| [byCodeAndLevel](functions/byCodeAndLevel.md)                       | Creates a scope selector that identifies a scope by its code and level.                                    |
| [byScopeId](functions/byScopeId.md)                                 | Creates a scope selector that identifies a scope by its unique ID.                                         |
| [getConfigSchema](functions/getConfigSchema.md)                     | Gets the configuration schema with lazy initialization and version checking.                               |
| [getConfiguration](functions/getConfiguration.md)                   | Gets configuration for a scope.                                                                            |
| [getConfigurationByKey](functions/getConfigurationByKey.md)         | Gets a specific configuration value by key for a scope.                                                    |
| [getScopeTree](functions/getScopeTree.md)                           | Gets the scope tree from cache or Commerce API.                                                            |
| [setConfiguration](functions/setConfiguration.md)                   | Sets configuration values for a scope.                                                                     |
| [setCustomScopeTree](functions/setCustomScopeTree.md)               | Sets the custom scope tree, replacing all existing custom scopes with the provided ones.                   |
| [setGlobalLibConfigOptions](functions/setGlobalLibConfigOptions.md) | Sets global library configuration options that will be used as defaults for all operations of the library. |
| [syncCommerceScopes](functions/syncCommerceScopes.md)               | Syncs Commerce scopes by forcing a fresh fetch from Commerce API and updating the cache.                   |
