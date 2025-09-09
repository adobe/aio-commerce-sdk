# `updateEventingConfiguration()`

```ts
function updateEventingConfiguration(
  httpClient: AdobeCommerceHttpClient,
  params: {
    enabled?: boolean;
    environmentId?: string;
    instanceId?: string;
    merchantId?: string;
    providerId?: string;
    workspaceConfiguration?:
      | string
      | {
          [key: string]: unknown;
        };
  },
  fetchOptions?: Options,
): Promise<boolean>;
```

Defined in: [packages/aio-commerce-lib-events/source/commerce/api/eventing-configuration/endpoints.ts:24](https://github.com/adobe/aio-commerce-sdk/blob/5a56cf6f89369fbe4cacf586ea1b3d08993680a9/packages/aio-commerce-lib-events/source/commerce/api/eventing-configuration/endpoints.ts#L24)

Updates the configuration of the Commerce Eventing API.

## Parameters

| Parameter                        | Type                                                                                                                                                                                                                 | Description                                                                                                                                                                                                |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`                     | [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages-private/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md)                                         | The [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages-private/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md) to use to make the request. |
| `params`                         | \{ `enabled?`: `boolean`; `environmentId?`: `string`; `instanceId?`: `string`; `merchantId?`: `string`; `providerId?`: `string`; `workspaceConfiguration?`: \| `string` \| \{ \[`key`: `string`\]: `unknown`; \}; \} | The parameters to update the configuration with.                                                                                                                                                           |
| `params.enabled?`                | `boolean`                                                                                                                                                                                                            | -                                                                                                                                                                                                          |
| `params.environmentId?`          | `string`                                                                                                                                                                                                             | -                                                                                                                                                                                                          |
| `params.instanceId?`             | `string`                                                                                                                                                                                                             | -                                                                                                                                                                                                          |
| `params.merchantId?`             | `string`                                                                                                                                                                                                             | -                                                                                                                                                                                                          |
| `params.providerId?`             | `string`                                                                                                                                                                                                             | -                                                                                                                                                                                                          |
| `params.workspaceConfiguration?` | \| `string` \| \{ \[`key`: `string`\]: `unknown`; \}                                                                                                                                                                 | -                                                                                                                                                                                                          |
| `fetchOptions?`                  | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                                                                           | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                                   |

## Returns

`Promise`\<`boolean`\>

## See

https://developer.adobe.com/commerce/extensibility/events/api/#configure-commerce-eventing

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
