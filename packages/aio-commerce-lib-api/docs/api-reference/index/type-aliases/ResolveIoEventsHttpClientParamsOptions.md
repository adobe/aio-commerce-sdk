# `ResolveIoEventsHttpClientParamsOptions`

```ts
type ResolveIoEventsHttpClientParamsOptions = {
  tryForwardAuthProvider?: boolean;
};
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:47](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L47)

Custom options to be taken into account when resolving I/O Events HTTP client parameters.

## Properties

### tryForwardAuthProvider?

```ts
optional tryForwardAuthProvider?: boolean;
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:52](https://github.com/adobe/aio-commerce-sdk/blob/aa606961236cac6f4a3cebc105d643da71d5ddb8/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L52)

Whether to attempt to forward the IMS auth provider from a pre-existing token or an auth header.

#### Default

```ts
false;
```
