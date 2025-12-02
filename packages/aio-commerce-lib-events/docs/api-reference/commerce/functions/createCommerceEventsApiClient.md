# `createCommerceEventsApiClient()`

```ts
function createCommerceEventsApiClient(params: CommerceHttpClientParams): ApiClientRecord<AdobeCommerceHttpClient, {
  updateEventingConfiguration: (httpClient: AdobeCommerceHttpClient, params: {
     enabled?: boolean;
     environmentId?: string;
     instanceId?: string;
     merchantId?: string;
     providerId?: string;
     workspaceConfiguration?:   | string
        | {
      [key: string]: unknown;
      };
  }, fetchOptions?: Options) => Promise<boolean>;
  createEventProvider: ;
  createEventSubscription: ;
  getAllEventProviders: ;
  getAllEventSubscriptions: ;
  getEventProviderById: ;
}>;
```

Defined in: [packages/aio-commerce-lib-events/source/commerce/lib/api-client.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/328e76511a3d6688c6ab08c0bd2228837474a89a/packages/aio-commerce-lib-events/source/commerce/lib/api-client.ts#L31)

Creates a new API client for the Commerce Events API client.

## Parameters

| Parameter | Type                       | Description                                                                                          |
| --------- | -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `params`  | `CommerceHttpClientParams` | The parameters to build the Commerce HTTP client that will communicate with the Commerce Events API. |

## Returns

`ApiClientRecord`\<[`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md), \{
`updateEventingConfiguration`: (`httpClient`: [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md), `params`: \{
`enabled?`: `boolean`;
`environmentId?`: `string`;
`instanceId?`: `string`;
`merchantId?`: `string`;
`providerId?`: `string`;
`workspaceConfiguration?`: \| `string`
\| \{
\[`key`: `string`\]: `unknown`;
\};
\}, `fetchOptions?`: [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)) => `Promise`\<`boolean`\>;
`createEventProvider`: ;
`createEventSubscription`: ;
`getAllEventProviders`: ;
`getAllEventSubscriptions`: ;
`getEventProviderById`: ;
\}\>
