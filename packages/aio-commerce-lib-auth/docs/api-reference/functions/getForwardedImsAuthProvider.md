# `getForwardedImsAuthProvider()`

```ts
function getForwardedImsAuthProvider(
  source:
    | {
        from: "headers";
        headers: {
          [key: string]: string | undefined;
        };
      }
    | {
        from: "getter";
        getHeaders: () => ImsAuthHeaders | Promise<ImsAuthHeaders>;
      }
    | {
        from: "params";
        params: {
          AIO_COMMERCE_AUTH_IMS_API_KEY?: string;
          AIO_COMMERCE_AUTH_IMS_TOKEN: string;
        } & {
          [key: string]: unknown;
        };
      },
): ImsAuthProvider;
```

Defined in: [ims-auth/forwarding.ts:110](https://github.com/adobe/aio-commerce-sdk/blob/24de65f0066c2a72e7dbcf59dd146ea501386562/packages/aio-commerce-lib-auth/source/lib/ims-auth/forwarding.ts#L110)

Creates an [ImsAuthProvider](../type-aliases/ImsAuthProvider.md) by forwarding authentication credentials from various sources.

## Parameters

| Parameter | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Description                                                                                                         |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `source`  | \| \{ `from`: `"headers"`; `headers`: \{ \[`key`: `string`\]: `string` \| `undefined`; \}; \} \| \{ `from`: `"getter"`; `getHeaders`: () => \| [`ImsAuthHeaders`](../type-aliases/ImsAuthHeaders.md) \| `Promise`\<[`ImsAuthHeaders`](../type-aliases/ImsAuthHeaders.md)\>; \} \| \{ `from`: `"params"`; `params`: \{ `AIO_COMMERCE_AUTH_IMS_API_KEY?`: `string`; `AIO_COMMERCE_AUTH_IMS_TOKEN`: `string`; \} & \{ \[`key`: `string`\]: `unknown`; \}; \} | The source of the credentials to forward, as a [ForwardedImsAuthSource](../type-aliases/ForwardedImsAuthSource.md). |

## Returns

[`ImsAuthProvider`](../type-aliases/ImsAuthProvider.md)

An [ImsAuthProvider](../type-aliases/ImsAuthProvider.md) instance that returns the forwarded access token and headers.

## Throws

If the source object is invalid.

## Throws

If `from: "headers"` is used and the `Authorization` header is missing.

## Throws

If `from: "headers"` is used and the `Authorization` header is not in Bearer token format.

## Throws

If `from: "params"` is used and `AIO_COMMERCE_AUTH_IMS_TOKEN` is missing or empty.

## Example

```typescript
import { getForwardedImsAuthProvider } from "@adobe/aio-commerce-lib-auth";

// From raw headers (e.g. from an HTTP request).
const provider1 = getForwardedImsAuthProvider({
  from: "headers",
  headers: params.__ow_headers,
});

// From async getter (e.g. fetch from secret manager)
const provider2 = getForwardedImsAuthProvider({
  from: "getter",
  getHeaders: async () => {
    const token = await secretManager.getSecret("ims-token");
    return { Authorization: `Bearer ${token}` };
  },
});

// From a params object (using AIO_COMMERCE_AUTH_IMS_TOKEN and AIO_COMMERCE_AUTH_IMS_API_KEY keys)
const provider3 = getForwardedImsAuthProvider({
  from: "params",
  params: actionParams,
});

// Use the provider
const token = await provider1.getAccessToken();
const headers = await provider1.getHeaders();
```
