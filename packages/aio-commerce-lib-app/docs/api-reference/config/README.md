# `config`: Module

## Type Aliases

| Type Alias                                                                       | Description                                                                                                                                      |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [ApplicationMetadata](type-aliases/ApplicationMetadata.md)                       | The metadata associated to an Adobe Commerce application.                                                                                        |
| [BusinessConfig](type-aliases/BusinessConfig.md)                                 | The keys of the `businessConfig` settings in the app config file.                                                                                |
| [BusinessConfigSchema](type-aliases/BusinessConfigSchema.md)                     | The schema type for the business configuration schema.                                                                                           |
| [BusinessConfigSchemaField](type-aliases/BusinessConfigSchemaField.md)           | The schema type for a configuration field.                                                                                                       |
| [BusinessConfigSchemaListOption](type-aliases/BusinessConfigSchemaListOption.md) | The schema type for an option in a list configuration field. Represents a single option that can be selected in a list-type configuration field. |
| [BusinessConfigSchemaValue](type-aliases/BusinessConfigSchemaValue.md)           | The schema type for the business configuration schema.                                                                                           |
| [CommerceAppConfig](type-aliases/CommerceAppConfig.md)                           | The input shape of the commerce app config schema.                                                                                               |
| [CommerceAppConfigDomain](type-aliases/CommerceAppConfigDomain.md)               | Individual validatable domains of the commerce app config.                                                                                       |
| [SchemaBusinessConfig](type-aliases/SchemaBusinessConfig.md)                     | The schema used to validate the `businessConfig` settings in the app config file.                                                                |

## Functions

| Function                                                                        | Description                                                                |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [defineConfig](functions/defineConfig.md)                                       | Helper to type-safely define the app config.                               |
| [parseCommerceAppConfig](functions/parseCommerceAppConfig.md)                   | Read the commerce app config file and parse its contents into its schema.  |
| [readBundledCommerceAppConfig](functions/readBundledCommerceAppConfig.md)       | Read the bundled commerce app config file                                  |
| [readCommerceAppConfig](functions/readCommerceAppConfig.md)                     | Read the commerce app config file as-is, without validating it.            |
| [resolveCommerceAppConfig](functions/resolveCommerceAppConfig.md)               | Try to find (up to the nearest package.json file) the app config file.     |
| [validateCommerceAppConfig](functions/validateCommerceAppConfig.md)             | Validates a complete commerce app configuration object against the schema. |
| [validateCommerceAppConfigDomain](functions/validateCommerceAppConfigDomain.md) | Validates a specific domain configuration within the commerce app config.  |
