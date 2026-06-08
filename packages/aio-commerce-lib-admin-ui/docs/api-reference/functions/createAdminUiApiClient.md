# `createAdminUiApiClient()`

```ts
function createAdminUiApiClient(
  params: CommerceHttpClientParams,
): ApiClientRecord<
  AdobeCommerceHttpClient,
  {
    registerExtension: Promise<RegisterExtensionResponse>;
    unregisterExtension: Promise<void>;
  }
>;
```

Defined in: [lib/api-client.ts:27](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-admin-ui/source/lib/api-client.ts#L27)

Creates a new API client for the Admin UI API with all available operations.

## Parameters

| Parameter | Type                       | Description                                       |
| --------- | -------------------------- | ------------------------------------------------- |
| `params`  | `CommerceHttpClientParams` | The parameters to build the Commerce HTTP client. |

## Returns

`ApiClientRecord`\<[`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md), \{
`registerExtension`: `Promise`\<[`RegisterExtensionResponse`](../type-aliases/RegisterExtensionResponse.md)\>;
`unregisterExtension`: `Promise`\<`void`\>;
\}\>
