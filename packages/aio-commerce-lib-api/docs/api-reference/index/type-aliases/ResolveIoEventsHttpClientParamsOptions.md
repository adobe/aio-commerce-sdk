# `ResolveIoEventsHttpClientParamsOptions`

```ts
type ResolveIoEventsHttpClientParamsOptions = {
  tryForwardAuthProvider?: boolean;
};
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L41)

Custom options to be taken into account when resolving I/O Events HTTP client parameters.

## Properties

### tryForwardAuthProvider?

```ts
optional tryForwardAuthProvider: boolean;
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L46)

Whether to attempt to forward the IMS auth provider from a pre-existing token or an auth header.

#### Default

```ts
false;
```
