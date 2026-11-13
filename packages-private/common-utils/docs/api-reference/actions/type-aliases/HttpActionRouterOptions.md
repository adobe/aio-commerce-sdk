# `HttpActionRouterOptions`

```ts
type HttpActionRouterOptions = {
  headers?: Record<string, string>;
};
```

Defined in: [actions/http/router.ts:37](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/actions/http/router.ts#L37)

Options for creating an [HttpActionRouter](../classes/HttpActionRouter.md).

## Properties

### headers?

```ts
headers?: Record<string, string>;
```

Defined in: [actions/http/router.ts:44](https://github.com/adobe/aio-commerce-sdk/blob/6e9704065e17b124069637c99898c47981974e20/packages-private/common-utils/source/actions/http/router.ts#L44)

Headers added to every response the router produces: handler responses, validation
and handler errors, and the router's own 404 and 405 responses.

Headers set by a handler win over these defaults. Names are compared case-insensitively.
