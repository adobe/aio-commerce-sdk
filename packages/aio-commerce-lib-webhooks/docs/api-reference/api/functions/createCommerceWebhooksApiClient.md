# `createCommerceWebhooksApiClient()`

```ts
function createCommerceWebhooksApiClient(
  params: CommerceHttpClientParams,
): ApiClientRecord<
  AdobeCommerceHttpClient,
  {
    getSupportedWebhookList: (
      httpClient: AdobeCommerceHttpClient,
      fetchOptions?: Options,
    ) => Promise<CommerceSupportedWebhookManyResponse>;
    getWebhookList: (
      httpClient: AdobeCommerceHttpClient,
      fetchOptions?: Options,
    ) => Promise<CommerceWebhookManyResponse>;
    subscribeWebhook: (
      httpClient: AdobeCommerceHttpClient,
      params: {
        batch_name: string;
        batch_order?: number;
        developer_console_oauth?: {
          client_id: string;
          client_secret: string;
          environment?: string;
          org_id: string;
        };
        fallback_error_message?: string;
        fields?: {
          name: string;
          source?: string;
        }[];
        headers?: {
          name: string;
          value: string;
        }[];
        hook_name: string;
        method?: string;
        priority?: number;
        required?: boolean;
        rules?: {
          field: string;
          operator: string;
          value: string;
        }[];
        soft_timeout?: number;
        timeout?: number;
        ttl?: number;
        url: string;
        webhook_method: string;
        webhook_type: string;
      },
      fetchOptions?: Options,
    ) => Promise<void>;
    unsubscribeWebhook: (
      httpClient: AdobeCommerceHttpClient,
      params: {
        batch_name: string;
        hook_name: string;
        webhook_method: string;
        webhook_type: string;
      },
      fetchOptions?: Options,
    ) => Promise<void>;
  }
>;
```

Defined in: [lib/api-client.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages/aio-commerce-lib-webhooks/source/lib/api-client.ts#L34)

Creates a new API client for the Commerce Webhooks API.

## Parameters

| Parameter | Type                                                                                                                                                                              | Description                                       |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `params`  | [`CommerceHttpClientParams`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/index/type-aliases/CommerceHttpClientParams.md) | The parameters to build the Commerce HTTP client. |

## Returns

`ApiClientRecord`\<[`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/index/classes/AdobeCommerceHttpClient.md), \{
`getSupportedWebhookList`: (`httpClient`: [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/index/classes/AdobeCommerceHttpClient.md), `fetchOptions?`: [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)) => `Promise`\<[`CommerceSupportedWebhookManyResponse`](../type-aliases/CommerceSupportedWebhookManyResponse.md)\>;
`getWebhookList`: (`httpClient`: [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/index/classes/AdobeCommerceHttpClient.md), `fetchOptions?`: [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)) => `Promise`\<[`CommerceWebhookManyResponse`](../type-aliases/CommerceWebhookManyResponse.md)\>;
`subscribeWebhook`: (`httpClient`: [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/index/classes/AdobeCommerceHttpClient.md), `params`: \{
`batch_name`: `string`;
`batch_order?`: `number`;
`developer_console_oauth?`: \{
`client_id`: `string`;
`client_secret`: `string`;
`environment?`: `string`;
`org_id`: `string`;
\};
`fallback_error_message?`: `string`;
`fields?`: \{
`name`: `string`;
`source?`: `string`;
\}[];
`headers?`: \{
`name`: `string`;
`value`: `string`;
\}[];
`hook_name`: `string`;
`method?`: `string`;
`priority?`: `number`;
`required?`: `boolean`;
`rules?`: \{
`field`: `string`;
`operator`: `string`;
`value`: `string`;
\}[];
`soft_timeout?`: `number`;
`timeout?`: `number`;
`ttl?`: `number`;
`url`: `string`;
`webhook_method`: `string`;
`webhook_type`: `string`;
\}, `fetchOptions?`: [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)) => `Promise`\<`void`\>;
`unsubscribeWebhook`: (`httpClient`: [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/index/classes/AdobeCommerceHttpClient.md), `params`: \{
`batch_name`: `string`;
`hook_name`: `string`;
`webhook_method`: `string`;
`webhook_type`: `string`;
\}, `fetchOptions?`: [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)) => `Promise`\<`void`\>;
\}\>
