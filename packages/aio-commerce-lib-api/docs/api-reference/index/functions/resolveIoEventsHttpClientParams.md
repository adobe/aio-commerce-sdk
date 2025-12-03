# `resolveIoEventsHttpClientParams()`

```ts
function resolveIoEventsHttpClientParams(
  params: Record<string, unknown>,
): IoEventsHttpClientParams;
```

Defined in: [packages/aio-commerce-lib-api/source/lib/io-events/helpers.ts:76](https://github.com/adobe/aio-commerce-sdk/blob/6b16d0bd0d47b3f7207ca2bc8c7b54931221ca0c/packages/aio-commerce-lib-api/source/lib/io-events/helpers.ts#L76)

Resolves the [IoEventsHttpClientParams](../type-aliases/IoEventsHttpClientParams.md) from the given App Builder action inputs.

## Parameters

| Parameter | Type                            | Description                                                                                                                |
| --------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `params`  | `Record`\<`string`, `unknown`\> | The App Builder action inputs to resolve the [IoEventsHttpClientParams](../type-aliases/IoEventsHttpClientParams.md) from. |

## Returns

[`IoEventsHttpClientParams`](../type-aliases/IoEventsHttpClientParams.md)

## Throws

If the authentication parameters cannot be resolved or if non-IMS auth is detected.

## Example

```typescript
import {
  resolveIoEventsHttpClientParams,
  AdobeIoEventsHttpClient,
} from "@adobe/aio-commerce-lib-api/io-events";

export const main = async function (params: Record<string, unknown>) {
  // Automatically resolves IMS auth params from environment variables
  const clientParams = resolveIoEventsHttpClientParams(params);
  const eventsClient = new AdobeIoEventsHttpClient(clientParams);

  // Use the client
  const response = await eventsClient.get("{orgId}/providers").json();
  return { statusCode: 200, body: response };
};
```
