# `publishEvent()`

```ts
function publishEvent<TPayload>(
  httpClient: AdobeIoEventsHttpClient,
  params: PublishEventParams<TPayload>,
): Promise<void>;
```

Defined in: [io-events/api/event-ingress/endpoints.ts:44](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-events/source/io-events/api/event-ingress/endpoints.ts#L44)

Publishes an event to the Adobe I/O Events ingress endpoint.

Builds a CloudEvents 1.0 envelope and POSTs it directly to the ingress URL
configured on the HTTP client. The provider is identified via the CloudEvents
`source` field as `urn:uuid:{providerId}`. Authentication headers are applied
automatically from the client's IMS auth configuration.

## Type Parameters

| Type Parameter                                       | Default type                    |
| ---------------------------------------------------- | ------------------------------- |
| `TPayload` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |

## Parameters

| Parameter    | Type                                                                                                                                                                 | Description                                                                                                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `httpClient` | [`AdobeIoEventsHttpClient`](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) | The [AdobeIoEventsHttpClient](https://github.com/adobe/aio-commerce-sdk/blob/main/packages/aio-commerce-lib-api/docs/api-reference/classes/AdobeIoEventsHttpClient.md) to use for the request. |
| `params`     | [`PublishEventParams`](../type-aliases/PublishEventParams.md)\<`TPayload`\>                                                                                          | The resolved provider ID, event code, and payload.                                                                                                                                             |

## Returns

`Promise`\<`void`\>
