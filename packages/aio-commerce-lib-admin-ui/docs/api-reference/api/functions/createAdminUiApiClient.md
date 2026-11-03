# `createAdminUiApiClient()`

```ts
function createAdminUiApiClient(
  params: CommerceHttpClientParams,
): ApiClientRecord<
  AdobeCommerceHttpClient,
  {
    enableAdminUiSdk(
      httpClient: AdobeCommerceHttpClient,
      fetchOptions?: Options,
    ): Promise<boolean>;
    refreshExtension(
      httpClient: AdobeCommerceHttpClient,
      params: {
        extensionName: string;
        workspaceName: string;
      },
      fetchOptions?: Options,
    ): Promise<void>;
    registerExtension(
      httpClient: AdobeCommerceHttpClient,
      params: {
        extensionName: string;
        extensionTitle: string;
        extensionWorkspace: string;
      },
      fetchOptions?: Options,
    ): Promise<RegisterExtensionResponse>;
    unregisterExtension(
      httpClient: AdobeCommerceHttpClient,
      params: {
        extensionName: string;
        workspaceName: string;
      },
      fetchOptions?: Options,
    ): Promise<void>;
  }
>;
```

Defined in: [aio-commerce-lib-admin-ui/source/api/lib/api-client.ts:28](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-admin-ui/source/api/lib/api-client.ts#L28)

Creates a new API client for the Admin UI API with all available operations.

## Parameters

| Parameter | Type                       | Description                                       |
| --------- | -------------------------- | ------------------------------------------------- |
| `params`  | `CommerceHttpClientParams` | The parameters to build the Commerce HTTP client. |

## Returns

`ApiClientRecord`\<[`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md), \{
`enableAdminUiSdk`(`httpClient`: [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md), `fetchOptions?`: [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)): `Promise`\<`boolean`\>;
`refreshExtension`(`httpClient`: [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md), `params`: \{
`extensionName`: `string`;
`workspaceName`: `string`;
\}, `fetchOptions?`: [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)): `Promise`\<`void`\>;
`registerExtension`(`httpClient`: [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md), `params`: \{
`extensionName`: `string`;
`extensionTitle`: `string`;
`extensionWorkspace`: `string`;
\}, `fetchOptions?`: [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)): `Promise`\<[`RegisterExtensionResponse`](../type-aliases/RegisterExtensionResponse.md)\>;
`unregisterExtension`(`httpClient`: [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md), `params`: \{
`extensionName`: `string`;
`workspaceName`: `string`;
\}, `fetchOptions?`: [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)): `Promise`\<`void`\>;
\}\>
