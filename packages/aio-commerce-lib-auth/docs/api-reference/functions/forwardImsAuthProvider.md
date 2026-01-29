# `forwardImsAuthProvider()`

```ts
function forwardImsAuthProvider(
  params: Record<string, unknown>,
): ImsAuthProvider;
```

Defined in: [ims-auth/forwarding.ts:305](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-auth/source/lib/ims-auth/forwarding.ts#L305)

Creates an [ImsAuthProvider](../type-aliases/ImsAuthProvider.md) by forwarding authentication credentials from runtime action parameters.

This function automatically detects the source of credentials by trying multiple strategies in order:

1. **Params token** - Looks for `AIO_COMMERCE_AUTH_IMS_TOKEN` (and optionally `AIO_COMMERCE_AUTH_IMS_API_KEY`) in the params object
2. **HTTP headers** - Falls back to extracting the `Authorization` header from `__ow_headers`

Use this function when building actions that receive authenticated requests and need to forward
those credentials to downstream services (proxy pattern).

## Parameters

| Parameter | Type                            | Description                                                                                                                                                                                                                                      |
| --------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `params`  | `Record`\<`string`, `unknown`\> | The runtime action parameters object. Can contain either: - `AIO_COMMERCE_AUTH_IMS_TOKEN` and optionally `AIO_COMMERCE_AUTH_IMS_API_KEY` for direct token forwarding - `__ow_headers` with an `Authorization` header for HTTP request forwarding |

## Returns

[`ImsAuthProvider`](../type-aliases/ImsAuthProvider.md)

An [ImsAuthProvider](../type-aliases/ImsAuthProvider.md) instance that returns the forwarded access token and headers.

## Throws

If neither a valid token param nor Authorization header is found.

## Example

```typescript
import { forwardImsAuthProvider } from "@adobe/aio-commerce-lib-auth";

export async function main(params: Record<string, unknown>) {
  // Automatically detects credentials from params or headers
  const authProvider = forwardImsAuthProvider(params);

  // Get the access token
  const token = await authProvider.getAccessToken();

  // Get headers for downstream API requests
  const headers = await authProvider.getHeaders();
  // {
  //   Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
  //   "x-api-key": "my-api-key" // Only if available
  // }

  // Use the forwarded credentials in downstream API calls
  const response = await fetch("https://api.adobe.io/some-endpoint", {
    headers,
  });

  return { statusCode: 200, body: await response.json() };
}
```
