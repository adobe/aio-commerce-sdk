# `commerce`: Module

## Type Aliases

| Type Alias                                                                                     | Description                                                                                          |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [CommerceEventProvider](type-aliases/CommerceEventProvider.md)                                 | Defines the structure of a Commerce event provider.                                                  |
| [CommerceEventProviderManyResponse](type-aliases/CommerceEventProviderManyResponse.md)         | Defines the fields of many event provider entities returned by the Commerce API.                     |
| [CommerceEventProviderOneResponse](type-aliases/CommerceEventProviderOneResponse.md)           | Defines the fields of an event provider entity returned by the Commerce API.                         |
| [CommerceEventSubscription](type-aliases/CommerceEventSubscription.md)                         | Defines the structure of a Commerce event subscription.                                              |
| [CommerceEventSubscriptionField](type-aliases/CommerceEventSubscriptionField.md)               | Defines the structure of a field in a Commerce event subscription.                                   |
| [CommerceEventSubscriptionManyResponse](type-aliases/CommerceEventSubscriptionManyResponse.md) | Defines the fields of many event subscription entities returned by the Commerce API.                 |
| [CommerceEventSubscriptionOneResponse](type-aliases/CommerceEventSubscriptionOneResponse.md)   | Defines the fields of an event subscription entity returned by the Commerce API.                     |
| [CommerceEventSubscriptionRule](type-aliases/CommerceEventSubscriptionRule.md)                 | Defines the structure of a filtering rule in a Commerce event subscription.                          |
| [EventProviderCreateParams](type-aliases/EventProviderCreateParams.md)                         | The schema of the parameters received by the POST `eventing/eventProvider` Commerce API endpoint.    |
| [EventProviderGetByIdParams](type-aliases/EventProviderGetByIdParams.md)                       | The schema of the parameters received by the GET `eventing/eventProvider/:id` Commerce API endpoint. |
| [EventSubscriptionCreateParams](type-aliases/EventSubscriptionCreateParams.md)                 | The schema of the parameters received by the POST `eventing/eventSubscribe` Commerce API endpoint.   |
| [UpdateEventingConfigurationParams](type-aliases/UpdateEventingConfigurationParams.md)         | Defines the parameters received by the `updateConfiguration` Commerce Eventing API endpoint.         |

## Variables

| Variable                                                                                        | Description                                                                                        |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [EventProviderCreateParamsSchema](variables/EventProviderCreateParamsSchema.md)                 | -                                                                                                  |
| [EventProviderGetByIdParamsSchema](variables/EventProviderGetByIdParamsSchema.md)               | -                                                                                                  |
| [EventSubscriptionCreateParamsSchema](variables/EventSubscriptionCreateParamsSchema.md)         | -                                                                                                  |
| [UpdateEventingConfigurationParamsSchema](variables/UpdateEventingConfigurationParamsSchema.md) | The schema of the parameters received by the `updateConfiguration` Commerce Eventing API endpoint. |

## Functions

| Function                                                                                | Description                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [createCommerceEventsApiClient](functions/createCommerceEventsApiClient.md)             | Creates a new API client for the Commerce Events API client.                                                                                                                                                                                                          |
| [createCustomCommerceEventsApiClient](functions/createCustomCommerceEventsApiClient.md) | Creates a customized Commerce Events API client.                                                                                                                                                                                                                      |
| [createEventProvider](functions/createEventProvider.md)                                 | Creates an event provider in the Commerce instance bound to the given [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md).                             |
| [createEventSubscription](functions/createEventSubscription.md)                         | Creates an event subscription in the Commerce instance bound to the given [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md).                         |
| [getAllEventProviders](functions/getAllEventProviders.md)                               | Lists all event providers of the Commerce instance bound to the given [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md).                             |
| [getAllEventSubscriptions](functions/getAllEventSubscriptions.md)                       | Gets all event subscriptions in the Commerce instance bound to the given [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md).                          |
| [getEventProviderById](functions/getEventProviderById.md)                               | Gets the info of the event provider with the given ID of the Commerce instance bound to the given [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md). |
| [updateEventingConfiguration](functions/updateEventingConfiguration.md)                 | Updates the configuration of the Commerce Eventing API.                                                                                                                                                                                                               |
