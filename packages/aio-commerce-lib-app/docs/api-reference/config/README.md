# `config`: Module

## Type Aliases

| Type Alias                                                                             | Description                                                                                            |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [AppConfigWithBusinessConfig](type-aliases/AppConfigWithBusinessConfig.md)             | Config type when business config is present.                                                           |
| [AppConfigWithBusinessConfigSchema](type-aliases/AppConfigWithBusinessConfigSchema.md) | Config type when business config schema is present.                                                    |
| [AppEvent](type-aliases/AppEvent.md)                                                   | Union type of all supported event configurations                                                       |
| [ApplicationMetadata](type-aliases/ApplicationMetadata.md)                             | The metadata associated to an Adobe Commerce application.                                              |
| [CommerceAppConfig](type-aliases/CommerceAppConfig.md)                                 | The input shape of the commerce app config schema.                                                     |
| [CommerceAppConfigDomain](type-aliases/CommerceAppConfigDomain.md)                     | Individual validatable domains of the commerce app config.                                             |
| [CommerceEvent](type-aliases/CommerceEvent.md)                                         | Commerce event configuration                                                                           |
| [CommerceEventsConfig](type-aliases/CommerceEventsConfig.md)                           | Config type when commerce event sources are present.                                                   |
| [CommerceEventSource](type-aliases/CommerceEventSource.md)                             | Commerce event source configuration                                                                    |
| [EventingConfiguration](type-aliases/EventingConfiguration.md)                         | The eventing configuration for an Adobe Commerce application                                           |
| [EventProvider](type-aliases/EventProvider.md)                                         | Event provider configuration                                                                           |
| [EventsConfig](type-aliases/EventsConfig.md)                                           | Config type when eventing is present.                                                                  |
| [ExternalEvent](type-aliases/ExternalEvent.md)                                         | External event configuration                                                                           |
| [ExternalEventsConfig](type-aliases/ExternalEventsConfig.md)                           | Config type when external event sources are present.                                                   |
| [ExternalEventSource](type-aliases/ExternalEventSource.md)                             | External event source configuration                                                                    |
| [WebhookDefinition](type-aliases/WebhookDefinition.md)                                 | Nested webhook payload (webhook_method, fields, etc.) — union of base shape and url-carrying shape.    |
| [WebhookEntry](type-aliases/WebhookEntry.md)                                           | Single webhook entry — either runtimeAction-based or url-based (mutually exclusive at the type level). |
| [WebhookField](type-aliases/WebhookField.md)                                           | Webhook field configuration                                                                            |
| [WebhookHeader](type-aliases/WebhookHeader.md)                                         | Webhook header configuration                                                                           |
| [WebhookRule](type-aliases/WebhookRule.md)                                             | Webhook rule configuration                                                                             |
| [WebhooksConfig](type-aliases/WebhooksConfig.md)                                       | Config type when webhooks are present (non-empty array).                                               |
| [WebhooksConfiguration](type-aliases/WebhooksConfiguration.md)                         | Webhooks configuration (array of webhook entries).                                                     |

## Variables

| Variable                                                            | Description                                                                         |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [CommerceAppConfigSchemas](variables/CommerceAppConfigSchemas.md)   | The individual validatable domains of the app config.                               |
| [CommerceEventSourceSchema](variables/CommerceEventSourceSchema.md) | Schema for Commerce event source configuration                                      |
| [EventingSchema](variables/EventingSchema.md)                       | Schema for eventing configuration with separate commerce and external arrays        |
| [ExternalEventSourceSchema](variables/ExternalEventSourceSchema.md) | Schema for external event source configuration                                      |
| [WebhooksSchema](variables/WebhooksSchema.md)                       | Schema for the optional webhooks array (when present, must have at least one item). |

## Functions

| Function                                                                        | Description                                                                |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [defineConfig](functions/defineConfig.md)                                       | Helper to type-safely define the app config.                               |
| [getConfigDomains](functions/getConfigDomains.md)                               | Get the config domains that are present in the config.                     |
| [hasBusinessConfig](functions/hasBusinessConfig.md)                             | Check if config has business config.                                       |
| [hasBusinessConfigSchema](functions/hasBusinessConfigSchema.md)                 | Check if config has business config schema.                                |
| [hasCommerceEvents](functions/hasCommerceEvents.md)                             | Check if config has commerce event sources.                                |
| [hasConfigDomain](functions/hasConfigDomain.md)                                 | Check if the config has a specific domain.                                 |
| [hasCustomInstallation](functions/hasCustomInstallation.md)                     | Check if config has custom installation settings.                          |
| [hasCustomInstallationSteps](functions/hasCustomInstallationSteps.md)           | Check if config has custom installation steps.                             |
| [hasEventing](functions/hasEventing.md)                                         | Check if config has any eventing configuration.                            |
| [hasExternalEvents](functions/hasExternalEvents.md)                             | Check if config has external event sources.                                |
| [hasMetadata](functions/hasMetadata.md)                                         | Check if config has metadata.                                              |
| [hasWebhooks](functions/hasWebhooks.md)                                         | Check if config has webhooks (non-empty array).                            |
| [parseCommerceAppConfig](functions/parseCommerceAppConfig.md)                   | Read the commerce app config file and parse its contents into its schema.  |
| [readCommerceAppConfig](functions/readCommerceAppConfig.md)                     | Read the commerce app config file as-is, without validating it.            |
| [resolveCommerceAppConfig](functions/resolveCommerceAppConfig.md)               | Try to find (up to the nearest package.json file) the app config file.     |
| [validateCommerceAppConfig](functions/validateCommerceAppConfig.md)             | Validates a complete commerce app configuration object against the schema. |
| [validateCommerceAppConfigDomain](functions/validateCommerceAppConfigDomain.md) | Validates a specific domain configuration within the commerce app config.  |
