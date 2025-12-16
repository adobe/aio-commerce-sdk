# `config`: Module

## Type Aliases

| Type Alias                                                                       | Description                                                                                                                                      |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [ApplicationMetadata](type-aliases/ApplicationMetadata.md)                       | The metadata associated to an Adobe Commerce application.                                                                                        |
| [BusinessConfig](type-aliases/BusinessConfig.md)                                 | The keys of the `businessConfig` settings in the extensibility config file.                                                                      |
| [BusinessConfigSchema](type-aliases/BusinessConfigSchema.md)                     | The schema type for the business configuration schema.                                                                                           |
| [BusinessConfigSchemaField](type-aliases/BusinessConfigSchemaField.md)           | The schema type for a configuration field.                                                                                                       |
| [BusinessConfigSchemaListOption](type-aliases/BusinessConfigSchemaListOption.md) | The schema type for an option in a list configuration field. Represents a single option that can be selected in a list-type configuration field. |
| [BusinessConfigSchemaValue](type-aliases/BusinessConfigSchemaValue.md)           | The schema type for the business configuration schema.                                                                                           |
| [ExtensibilityConfig](type-aliases/ExtensibilityConfig.md)                       | The input shape of the extensibility config schema.                                                                                              |
| [ExtensibilityConfigDomain](type-aliases/ExtensibilityConfigDomain.md)           | Individual validatable domains of the extensibility config.                                                                                      |
| [SchemaBusinessConfig](type-aliases/SchemaBusinessConfig.md)                     | The schema used to validate the `businessConfig` settings in the extensibility config file.                                                      |

## Functions

| Function                                                                      | Description                                                                      |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [defineConfig](functions/defineConfig.md)                                     | Helper to type-safely define the extensibility config.                           |
| [parseExtensibilityConfig](functions/parseExtensibilityConfig.md)             | Read the extensibility config file and parse its contents into its schema.       |
| [readBundledExtensibilityConfig](functions/readBundledExtensibilityConfig.md) | Read the bundled extensibility config file                                       |
| [readExtensibilityConfig](functions/readExtensibilityConfig.md)               | Read the extensibility config file as-is, without validating it.                 |
| [resolveExtensibilityConfig](functions/resolveExtensibilityConfig.md)         | Try to find (up to the nearest package.json file) the extensibility config file. |
| [validateConfig](functions/validateConfig.md)                                 | Validates a complete extensibility configuration object against the schema.      |
| [validateConfigDomain](functions/validateConfigDomain.md)                     | Validates a specific domain configuration within the extensibility config.       |
