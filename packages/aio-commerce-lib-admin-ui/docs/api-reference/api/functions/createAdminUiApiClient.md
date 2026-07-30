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

Defined in: [aio-commerce-lib-admin-ui/source/api/lib/api-client.ts:28](https://github.com/adobe/aio-commerce-sdk/blob/97b39588c9be1d7c405453e1095714aa55bea129/packages/aio-commerce-lib-admin-ui/source/api/lib/api-client.ts#L28)

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
