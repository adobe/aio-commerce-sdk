# `ResolveIoEventsHttpClientParamsOptions`

```ts
type ResolveIoEventsHttpClientParamsOptions = {
  tryForwardAuthProvider?: boolean;
};
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L47)

Custom options to be taken into account when resolving I/O Events HTTP client parameters.

## Properties

### tryForwardAuthProvider?

```ts
tryForwardAuthProvider?: boolean;
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/1aa18dfd977a20c07f169618df52fadc30b4839c/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L52)

Whether to attempt to forward the IMS auth provider from a pre-existing token or an auth header.

#### Default

```ts
false;
```
