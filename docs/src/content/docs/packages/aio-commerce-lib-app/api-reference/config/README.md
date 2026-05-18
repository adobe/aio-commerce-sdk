---
title: "config"
editUrl: false
prev: false
next: false
---

## Type Aliases

| Type Alias                                                                             | Description                                                                                            |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [AdminUiSdkConfiguration](type-aliases/AdminUiSdkConfiguration.md)                     | The Admin UI SDK configuration for an Adobe Commerce application.                                      |
| [AdminUiSdkRegistration](type-aliases/AdminUiSdkRegistration.md)                       | The Admin UI SDK registration configuration.                                                           |
| [AppConfigWithBusinessConfig](type-aliases/AppConfigWithBusinessConfig.md)             | Config type when business config is present.                                                           |
| [AppConfigWithBusinessConfigSchema](type-aliases/AppConfigWithBusinessConfigSchema.md) | Config type when business config schema is present.                                                    |
| [AppEvent](type-aliases/AppEvent.md)                                                   | Union type of all supported event configurations                                                       |
| [ApplicationMetadata](type-aliases/ApplicationMetadata.md)                             | The metadata associated to an Adobe Commerce application.                                              |
| [BannerNotification](type-aliases/BannerNotification.md)                               | Banner notification registration configuration.                                                        |
| [CommerceAppConfig](type-aliases/CommerceAppConfig.md)                                 | The input shape of the commerce app config schema.                                                     |
| [CommerceAppConfigDomain](type-aliases/CommerceAppConfigDomain.md)                     | Individual validatable domains of the commerce app config.                                             |
| [CommerceEvent](type-aliases/CommerceEvent.md)                                         | Commerce event configuration                                                                           |
| [CommerceEventsConfig](type-aliases/CommerceEventsConfig.md)                           | Config type when commerce event sources are present.                                                   |
| [CommerceEventSource](type-aliases/CommerceEventSource.md)                             | Commerce event source configuration                                                                    |
| [CustomerMassAction](type-aliases/CustomerMassAction.md)                               | A customer mass action registration entry (uses `customerSelectLimit`).                                |
| [CustomFee](type-aliases/CustomFee.md)                                                 | A custom fee registration entry.                                                                       |
| [EventingConfiguration](type-aliases/EventingConfiguration.md)                         | The eventing configuration for an Adobe Commerce application                                           |
| [EventProvider](type-aliases/EventProvider.md)                                         | Event provider configuration                                                                           |
| [EventsConfig](type-aliases/EventsConfig.md)                                           | Config type when eventing is present.                                                                  |
| [ExternalEvent](type-aliases/ExternalEvent.md)                                         | External event configuration                                                                           |
| [ExternalEventsConfig](type-aliases/ExternalEventsConfig.md)                           | Config type when external event sources are present.                                                   |
| [ExternalEventSource](type-aliases/ExternalEventSource.md)                             | External event source configuration                                                                    |
| [GridColumns](type-aliases/GridColumns.md)                                             | Grid columns registration configuration.                                                               |
| [MenuItem](type-aliases/MenuItem.md)                                                   | A menu item registration entry.                                                                        |
| [OrderMassAction](type-aliases/OrderMassAction.md)                                     | An order mass action registration entry (uses `selectionLimit`).                                       |
| [OrderViewButton](type-aliases/OrderViewButton.md)                                     | An order view button registration entry.                                                               |
| [ProductMassAction](type-aliases/ProductMassAction.md)                                 | A product mass action registration entry (uses `productSelectLimit`).                                  |
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
| [hasAdminUiSdk](functions/hasAdminUiSdk.md)                                     | Check if config has Admin UI SDK registration configuration.               |
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
