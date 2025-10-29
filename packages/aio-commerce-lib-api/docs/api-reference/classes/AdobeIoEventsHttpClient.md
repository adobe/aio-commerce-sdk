# `AdobeIoEventsHttpClient`

Defined in: [packages-private/aio-commerce-lib-api/source/lib/io-events/http-client.ts:36](https://github.com/adobe/aio-commerce-sdk/blob/8cc35111c26be4d9997541cb07f95e4f82dd2c7b/packages-private/aio-commerce-lib-api/source/lib/io-events/http-client.ts#L36)

A Ky-based HTTP client used to make requests to the Adobe I/O Events API.

## See

https://github.com/sindresorhus/ky

## Extends

- `HttpClientBase`\<`RequiredIoEventsHttpClientConfig`\>

## Constructors

### Constructor

```ts
new AdobeIoEventsHttpClient(params: IoEventsHttpClientParams): AdobeIoEventsHttpClient;
```

Defined in: [packages-private/aio-commerce-lib-api/source/lib/io-events/http-client.ts:41](https://github.com/adobe/aio-commerce-sdk/blob/8cc35111c26be4d9997541cb07f95e4f82dd2c7b/packages-private/aio-commerce-lib-api/source/lib/io-events/http-client.ts#L41)

Creates a new Adobe I/O Events HTTP client instance.

#### Parameters

| Parameter | Type                                                                      | Description                                                   |
| --------- | ------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `params`  | [`IoEventsHttpClientParams`](../type-aliases/IoEventsHttpClientParams.md) | The parameters for building the Adobe I/O Events HTTP client. |

#### Returns

`AdobeIoEventsHttpClient`

#### Overrides

```ts
HttpClientBase<RequiredIoEventsHttpClientConfig>.constructor
```

## Properties

### config

```ts
readonly config: Readonly<T>;
```

Defined in: [packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts:26](https://github.com/adobe/aio-commerce-sdk/blob/8cc35111c26be4d9997541cb07f95e4f82dd2c7b/packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts#L26)

The configuration used by the HTTP client.

#### Inherited from

```ts
HttpClientBase.config;
```

---

### delete()

```ts
delete: <T>(url: Input, options?: Options) => ResponsePromise<T>;
```

Defined in: [packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/8cc35111c26be4d9997541cb07f95e4f82dd2c7b/packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts#L31)

Fetch the given `url` using the option `{method: 'delete'}`.

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter  | Type      | Description                                    |
| ---------- | --------- | ---------------------------------------------- |
| `url`      | `Input`   | `Request` object, `URL` object, or URL string. |
| `options?` | `Options` | -                                              |

#### Returns

`ResponsePromise`\<`T`\>

A promise with `Body` methods added.

#### Inherited from

```ts
HttpClientBase.delete;
```

---

### get()

```ts
get: <T>(url: Input, options?: Options) => ResponsePromise<T>;
```

Defined in: [packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts:28](https://github.com/adobe/aio-commerce-sdk/blob/8cc35111c26be4d9997541cb07f95e4f82dd2c7b/packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts#L28)

Fetch the given `url` using the option `{method: 'get'}`.

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter  | Type      | Description                                    |
| ---------- | --------- | ---------------------------------------------- |
| `url`      | `Input`   | `Request` object, `URL` object, or URL string. |
| `options?` | `Options` | -                                              |

#### Returns

`ResponsePromise`\<`T`\>

A promise with `Body` methods added.

#### Inherited from

```ts
HttpClientBase.get;
```

---

### head()

```ts
head: (url: Input, options?: Options) => ResponsePromise;
```

Defined in: [packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/8cc35111c26be4d9997541cb07f95e4f82dd2c7b/packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts#L33)

Fetch the given `url` using the option `{method: 'head'}`.

#### Parameters

| Parameter  | Type      | Description                                    |
| ---------- | --------- | ---------------------------------------------- |
| `url`      | `Input`   | `Request` object, `URL` object, or URL string. |
| `options?` | `Options` | -                                              |

#### Returns

`ResponsePromise`

A promise with `Body` methods added.

#### Inherited from

```ts
HttpClientBase.head;
```

---

### httpClient

```ts
protected httpClient: Readonly<KyInstance>;
```

Defined in: [packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/8cc35111c26be4d9997541cb07f95e4f82dd2c7b/packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts#L23)

The actual HTTP client instance.

#### Inherited from

```ts
HttpClientBase.httpClient;
```

---

### patch()

```ts
patch: <T>(url: Input, options?: Options) => ResponsePromise<T>;
```

Defined in: [packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts:32](https://github.com/adobe/aio-commerce-sdk/blob/8cc35111c26be4d9997541cb07f95e4f82dd2c7b/packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts#L32)

Fetch the given `url` using the option `{method: 'patch'}`.

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter  | Type      | Description                                    |
| ---------- | --------- | ---------------------------------------------- |
| `url`      | `Input`   | `Request` object, `URL` object, or URL string. |
| `options?` | `Options` | -                                              |

#### Returns

`ResponsePromise`\<`T`\>

A promise with `Body` methods added.

#### Inherited from

```ts
HttpClientBase.patch;
```

---

### post()

```ts
post: <T>(url: Input, options?: Options) => ResponsePromise<T>;
```

Defined in: [packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts:29](https://github.com/adobe/aio-commerce-sdk/blob/8cc35111c26be4d9997541cb07f95e4f82dd2c7b/packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts#L29)

Fetch the given `url` using the option `{method: 'post'}`.

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter  | Type      | Description                                    |
| ---------- | --------- | ---------------------------------------------- |
| `url`      | `Input`   | `Request` object, `URL` object, or URL string. |
| `options?` | `Options` | -                                              |

#### Returns

`ResponsePromise`\<`T`\>

A promise with `Body` methods added.

#### Inherited from

```ts
HttpClientBase.post;
```

---

### put()

```ts
put: <T>(url: Input, options?: Options) => ResponsePromise<T>;
```

Defined in: [packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/8cc35111c26be4d9997541cb07f95e4f82dd2c7b/packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts#L30)

Fetch the given `url` using the option `{method: 'put'}`.

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Parameters

| Parameter  | Type      | Description                                    |
| ---------- | --------- | ---------------------------------------------- |
| `url`      | `Input`   | `Request` object, `URL` object, or URL string. |
| `options?` | `Options` | -                                              |

#### Returns

`ResponsePromise`\<`T`\>

A promise with `Body` methods added.

#### Inherited from

```ts
HttpClientBase.put;
```

---

### stop

```ts
stop: typeof stop;
```

Defined in: [packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/8cc35111c26be4d9997541cb07f95e4f82dd2c7b/packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts#L34)

A `Symbol` that can be returned by a `beforeRetry` hook to stop the retry. This will also short circuit the remaining `beforeRetry` hooks.

Note: Returning this symbol makes Ky abort and return with an `undefined` response. Be sure to check for a response before accessing any properties on it or use [optional chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining). It is also incompatible with body methods, such as `.json()` or `.text()`, because there is no response to parse. In general, we recommend throwing an error instead of returning this symbol, as that will cause Ky to abort and then throw, which avoids these limitations.

A valid use-case for `ky.stop` is to prevent retries when making requests for side effects, where the returned data is not important. For example, logging client activity to the server.

#### Example

```
import ky from 'ky';

const options = {
    hooks: {
        beforeRetry: [
            async ({request, options, error, retryCount}) => {
                const shouldStopRetry = await ky('https://example.com/api');
                if (shouldStopRetry) {
                    return ky.stop;
                }
            }
        ]
    }
};

// Note that response will be `undefined` in case `ky.stop` is returned.
const response = await ky.post('https://example.com', options);

// Using `.text()` or other body methods is not supported.
const text = await ky('https://example.com', options).text();
```

#### Inherited from

```ts
HttpClientBase.stop;
```

## Methods

### extend()

```ts
extend(options: Options | (parentOptions: Options) => Options): HttpClientBase<Readonly<RequiredObjectDeep<IoEventsHttpClientConfig>>>;
```

Defined in: [packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts:65](https://github.com/adobe/aio-commerce-sdk/blob/8cc35111c26be4d9997541cb07f95e4f82dd2c7b/packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts#L65)

Extends the current HTTP client instance with the given options.

#### Parameters

| Parameter | Type                                                   | Description                                 |
| --------- | ------------------------------------------------------ | ------------------------------------------- |
| `options` | `Options` \| (`parentOptions`: `Options`) => `Options` | The options to extend the HTTP client with. |

#### Returns

`HttpClientBase`\<`Readonly`\<`RequiredObjectDeep`\<[`IoEventsHttpClientConfig`](../type-aliases/IoEventsHttpClientConfig.md)\>\>\>

#### Inherited from

```ts
HttpClientBase.extend;
```

---

### setHttpClient()

```ts
protected setHttpClient(httpClient: KyInstance): void;
```

Defined in: [packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts:50](https://github.com/adobe/aio-commerce-sdk/blob/8cc35111c26be4d9997541cb07f95e4f82dd2c7b/packages-private/aio-commerce-lib-api/source/lib/http-client-base.ts#L50)

Sets the HTTP client instance.

#### Parameters

| Parameter    | Type         | Description                      |
| ------------ | ------------ | -------------------------------- |
| `httpClient` | `KyInstance` | The HTTP client instance to set. |

#### Returns

`void`

#### Inherited from

```ts
HttpClientBase.setHttpClient;
```
