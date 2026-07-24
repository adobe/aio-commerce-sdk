# `createAdminUiApiClient()`

```ts
function createAdminUiApiClient(
  params: CommerceHttpClientParams,
): ApiClientRecord<
  AdobeCommerceHttpClient,
  {
    enableAdminUiSdk: Promise<boolean>;
    registerExtension: Promise<RegisterExtensionResponse>;
    unregisterExtension: Promise<void>;
  }
>;
```

Defined in: [aio-commerce-lib-admin-ui/source/api/lib/api-client.ts:28](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/api/lib/api-client.ts#L28)

Creates a new API client for the Admin UI API with all available operations.

## Parameters

| Parameter | Type                       | Description                                       |
| --------- | -------------------------- | ------------------------------------------------- |
| `params`  | `CommerceHttpClientParams` | The parameters to build the Commerce HTTP client. |

## Returns

`ApiClientRecord`\<[`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md), \{
`enableAdminUiSdk`: `Promise`\<`boolean`\>;
`registerExtension`: `Promise`\<[`RegisterExtensionResponse`](../type-aliases/RegisterExtensionResponse.md)\>;
`unregisterExtension`: `Promise`\<`void`\>;
\}\>
