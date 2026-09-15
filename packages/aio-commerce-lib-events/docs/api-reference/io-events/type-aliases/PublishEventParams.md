# `PublishEventParams\<TPayload *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>\>`

```ts
type PublishEventParams<
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> = {
  eventCode: string;
  isPhiData?: boolean;
  payload: TPayload;
  providerId: string;
};
```

Defined in: [io-events/api/event-ingress/endpoints.ts:16](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-events/source/io-events/api/event-ingress/endpoints.ts#L16)

Parameters required to publish an event to the I/O Events ingress.

## Type Parameters

| Type Parameter                                       | Default type                    |
| ---------------------------------------------------- | ------------------------------- |
| `TPayload` _extends_ `Record`\<`string`, `unknown`\> | `Record`\<`string`, `unknown`\> |

## Properties

### eventCode

```ts
eventCode: string;
```

Defined in: [io-events/api/event-ingress/endpoints.ts:22](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-events/source/io-events/api/event-ingress/endpoints.ts#L22)

The fully-qualified event code.

---

### isPhiData?

```ts
optional isPhiData?: boolean;
```

Defined in: [io-events/api/event-ingress/endpoints.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-events/source/io-events/api/event-ingress/endpoints.ts#L30)

When `true`, marks the event as containing Protected Health Information (PHI)
by sending `x-event-phidata: true` to the ingress. Required for HIPAA compliance.
Defaults to `false` when omitted.

---

### payload

```ts
payload: TPayload;
```

Defined in: [io-events/api/event-ingress/endpoints.ts:24](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-events/source/io-events/api/event-ingress/endpoints.ts#L24)

The event payload. Must be a JSON object.

---

### providerId

```ts
providerId: string;
```

Defined in: [io-events/api/event-ingress/endpoints.ts:20](https://github.com/adobe/aio-commerce-sdk/blob/c4d8d960809a7ee71cdf5efeed1e53485edd3792/packages/aio-commerce-lib-events/source/io-events/api/event-ingress/endpoints.ts#L20)

The I/O Events provider UUID.
