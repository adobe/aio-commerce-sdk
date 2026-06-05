# `resolveIoEventsHttpClientParams()`

```ts
function resolveIoEventsHttpClientParams(
  params: Record<string, unknown>,
  options?: ResolveIoEventsHttpClientParamsOptions,
): IoEventsHttpClientParams;
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/helpers.ts:81](https://github.com/adobe/aio-commerce-sdk/blob/f055aca3ba51e08584fb5e4c366fab9c7770bd5e/packages/aio-commerce-lib-api/source/lib/io-events/helpers.ts#L81)

Resolves the [IoEventsHttpClientParams](../type-aliases/IoEventsHttpClientParams.md) from the given App Builder action inputs.

## Parameters

| Parameter | Type                                                                                                  | Description                                                                                                                |
| --------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `params`  | `Record`\<`string`, `unknown`\>                                                                       | The App Builder action inputs to resolve the [IoEventsHttpClientParams](../type-aliases/IoEventsHttpClientParams.md) from. |
| `options` | [`ResolveIoEventsHttpClientParamsOptions`](../type-aliases/ResolveIoEventsHttpClientParamsOptions.md) | -                                                                                                                          |

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
