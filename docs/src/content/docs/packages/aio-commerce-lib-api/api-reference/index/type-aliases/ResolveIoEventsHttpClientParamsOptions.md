---
title: "ResolveIoEventsHttpClientParamsOptions"
editUrl: false
prev: false
next: false
---

```ts
type ResolveIoEventsHttpClientParamsOptions = {
  tryForwardAuthProvider?: boolean;
};
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L41)

Custom options to be taken into account when resolving I/O Events HTTP client parameters.

## Properties

### tryForwardAuthProvider?

```ts
optional tryForwardAuthProvider?: boolean;
```

Defined in: [aio-commerce-lib-api/source/lib/io-events/types.ts:46](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-api/source/lib/io-events/types.ts#L46)

Whether to attempt to forward the IMS auth provider from a pre-existing token or an auth header.

#### Default

```ts
false;
```
