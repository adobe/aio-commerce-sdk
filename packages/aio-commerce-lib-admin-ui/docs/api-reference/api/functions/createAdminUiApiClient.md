# `createAdminUiApiClient()`

```ts
function createAdminUiApiClient(
  params: CommerceHttpClientParams,
): ApiClientRecord<
  AdobeCommerceHttpClient,
  {
    enableAdminUiSdk: Promise<boolean>;
    refreshExtension: Promise<void>;
    registerExtension: Promise<RegisterExtensionResponse>;
    unregisterExtension: Promise<void>;
  }
>;
```

Defined in: [aio-commerce-lib-admin-ui/source/api/lib/api-client.ts:28](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-admin-ui/source/api/lib/api-client.ts#L28)

Creates a new API client for the Admin UI API with all available operations.

## Parameters

| Parameter | Type                       | Description                                       |
| --------- | -------------------------- | ------------------------------------------------- |
| `params`  | `CommerceHttpClientParams` | The parameters to build the Commerce HTTP client. |

## Returns

`ApiClientRecord`\<[`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md), \{
`enableAdminUiSdk`: `Promise`\<`boolean`\>;
`refreshExtension`: `Promise`\<`void`\>;
`registerExtension`: `Promise`\<[`RegisterExtensionResponse`](../type-aliases/RegisterExtensionResponse.md)\>;
`unregisterExtension`: `Promise`\<`void`\>;
\}\>
