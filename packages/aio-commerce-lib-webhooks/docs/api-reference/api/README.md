# `api`: Module

## Type Aliases

| Type Alias                                                                                   | Description                                                               |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [CommerceSupportedWebhook](type-aliases/CommerceSupportedWebhook.md)                         | A single entry from GET /webhooks/supportedList (SaaS only).              |
| [CommerceSupportedWebhookManyResponse](type-aliases/CommerceSupportedWebhookManyResponse.md) | The response type for GET /webhooks/supportedList.                        |
| [CommerceWebhook](type-aliases/CommerceWebhook.md)                                           | A single Commerce webhook subscription as returned by GET /webhooks/list. |
| [CommerceWebhookDeveloperConsoleOAuth](type-aliases/CommerceWebhookDeveloperConsoleOAuth.md) | Developer Console OAuth credentials attached to a webhook.                |
| [CommerceWebhookField](type-aliases/CommerceWebhookField.md)                                 | A field mapping in a Commerce webhook subscription.                       |
| [CommerceWebhookHeader](type-aliases/CommerceWebhookHeader.md)                               | A custom HTTP header in a Commerce webhook subscription.                  |
| [CommerceWebhookManyResponse](type-aliases/CommerceWebhookManyResponse.md)                   | The response type for GET /webhooks/list.                                 |
| [CommerceWebhookRule](type-aliases/CommerceWebhookRule.md)                                   | A conditional rule in a Commerce webhook subscription.                    |
| [CommerceWebhooksApiClient](type-aliases/CommerceWebhooksApiClient.md)                       | An API client for the Commerce Webhooks API.                              |
| [WebhookSubscribeParams](type-aliases/WebhookSubscribeParams.md)                             | The parameters for POST /webhooks/subscribe.                              |
| [WebhookUnsubscribeParams](type-aliases/WebhookUnsubscribeParams.md)                         | The parameters for POST /webhooks/unsubscribe.                            |

## Functions

| Function                                                                                    | Description                                                                              |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [createCommerceWebhooksApiClient](functions/createCommerceWebhooksApiClient.md)             | biome-ignore-all lint/performance/noBarrelFile: This is the package API entrypoint.      |
| [createCustomCommerceWebhooksApiClient](functions/createCustomCommerceWebhooksApiClient.md) | biome-ignore-all lint/performance/noBarrelFile: This is the package API entrypoint.      |
| [getSupportedWebhookList](functions/getSupportedWebhookList.md)                             | Returns the list of webhooks supported in Adobe Commerce as a Cloud Service (SaaS only). |
| [getWebhookList](functions/getWebhookList.md)                                               | Returns a list of all subscribed webhooks in the Commerce instance.                      |
| [subscribeWebhook](functions/subscribeWebhook.md)                                           | Subscribes a webhook in the Commerce instance.                                           |
| [unsubscribeWebhook](functions/unsubscribeWebhook.md)                                       | Unsubscribes a webhook from the Commerce instance.                                       |
