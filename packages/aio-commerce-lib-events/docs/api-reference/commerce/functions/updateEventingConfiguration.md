# `updateEventingConfiguration()`

```ts
function updateEventingConfiguration(
  httpClient: AdobeCommerceHttpClient,
  params: {
    enabled?: boolean;
    environment_id?: string;
    instance_id?: string;
    merchant_id?: string;
    provider_id?: string;
    workspace_configuration?:
      | string
      | {
          [key: string]: unknown;
        };
  },
  fetchOptions?: Options,
): Promise<boolean>;
```

Defined in: [commerce/api/eventing-configuration/endpoints.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/56effeb75fc9dd82afc4ef7ec109d3451fa8a60e/packages/aio-commerce-lib-events/source/commerce/api/eventing-configuration/endpoints.ts#L33)

Updates the configuration of the Commerce Eventing API.

## Parameters

| Parameter                         | Type                                                                                                                                                                                                                      | Description                                                                                                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient`                      | [`AdobeCommerceHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md)                                                      | The [AdobeCommerceHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeCommerceHttpClient.md) to use to make the request. |
| `params`                          | \{ `enabled?`: `boolean`; `environment_id?`: `string`; `instance_id?`: `string`; `merchant_id?`: `string`; `provider_id?`: `string`; `workspace_configuration?`: \| `string` \| \{ \[`key`: `string`\]: `unknown`; \}; \} | The parameters to update the configuration with.                                                                                                                                                   |
| `params.enabled?`                 | `boolean`                                                                                                                                                                                                                 | -                                                                                                                                                                                                  |
| `params.environment_id?`          | `string`                                                                                                                                                                                                                  | -                                                                                                                                                                                                  |
| `params.instance_id?`             | `string`                                                                                                                                                                                                                  | -                                                                                                                                                                                                  |
| `params.merchant_id?`             | `string`                                                                                                                                                                                                                  | -                                                                                                                                                                                                  |
| `params.provider_id?`             | `string`                                                                                                                                                                                                                  | -                                                                                                                                                                                                  |
| `params.workspace_configuration?` | \| `string` \| \{ \[`key`: `string`\]: `unknown`; \}                                                                                                                                                                      | -                                                                                                                                                                                                  |
| `fetchOptions?`                   | [`Options`](https://github.com/sindresorhus/ky?tab=readme-ov-file#options)                                                                                                                                                | The [Options](https://github.com/sindresorhus/ky?tab=readme-ov-file#options) to use to make the request.                                                                                           |

## Returns

`Promise`\<`boolean`\>

## See

https://developer.adobe.com/commerce/extensibility/events/api/#configure-commerce-eventing

## Throws

A [CommerceSdkValidationError](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-core/docs/api-reference/classes/CommerceSdkValidationError.md) If the parameters are in the wrong format.

## Throws

An [HTTPError](https://github.com/sindresorhus/ky?tab=readme-ov-file#httperror) If the status code is not 2XX.
