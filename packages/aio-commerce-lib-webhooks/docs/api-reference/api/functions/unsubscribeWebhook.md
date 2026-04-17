# `unsubscribeWebhook()`

```ts
function unsubscribeWebhook(
  httpClient: AdobeCommerceHttpClient,
  params: {
    batch_name: string;
    hook_name: string;
    webhook_method: string;
    webhook_type: string;
  },
  fetchOptions?: Options,
): Promise<void>;
```

Defined in: [api/webhooks/endpoints.ts:85](https://github.com/adobe/aio-commerce-sdk/blob/ba56294e6fee942ca0bc3a4f2e8fc3b3953d1455/packages/aio-commerce-lib-webhooks/source/api/webhooks/endpoints.ts#L85)

Unsubscribes a webhook from the Commerce instance.

## Parameters

| Parameter                | Type                                                                                                                                                                       | Description                                                                                                                                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`             | [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/index/classes/AdobeCommerceHttpClient.md) | The [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/index/classes/AdobeCommerceHttpClient.md) to use to make the request. |
| `params`                 | \{ `batch_name`: `string`; `hook_name`: `string`; `webhook_method`: `string`; `webhook_type`: `string`; \}                                                                 | The webhook identifiers (webhook_method, webhook_type, batch_name, hook_name).                                                                                                                           |
| `params.batch_name`      | `string`                                                                                                                                                                   | -                                                                                                                                                                                                        |
| `params.hook_name?`      | `string`                                                                                                                                                                   | -                                                                                                                                                                                                        |
| `params.webhook_method?` | `string`                                                                                                                                                                   | -                                                                                                                                                                                                        |
| `params.webhook_type?`   | `string`                                                                                                                                                                   | -                                                                                                                                                                                                        |
| `fetchOptions?`          | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                                 | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                                 |

## Returns

`Promise`\<`void`\>

## See

https://developer.adobe.com/commerce/extensibility/webhooks/api/#unsubscribe-a-webhook

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/error/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
