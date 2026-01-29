# `AdobeCommerceHttpClient`

Defined in: [aio-commerce-lib-api/source/lib/commerce/http-client.ts:48](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-api/source/lib/commerce/http-client.ts#L48)

A Ky-based HTTP client used to make requests to the Commerce API.

## See

https://github.com/sindresorhus/ky

## Extends

- `HttpClientBase`\<`RequiredComerceHttpClientConfig`\>

## Constructors

### Constructor

```ts
new AdobeCommerceHttpClient(params: CommerceHttpClientParams): AdobeCommerceHttpClient;
```

Defined in: [aio-commerce-lib-api/source/lib/commerce/http-client.ts:53](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-api/source/lib/commerce/http-client.ts#L53)

Creates a new Commerce HTTP client instance.

#### Parameters

| Parameter | Type                                                                      | Description                                           |
| --------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| `params`  | [`CommerceHttpClientParams`](../type-aliases/CommerceHttpClientParams.md) | The parameters for building the Commerce HTTP client. |

#### Returns

`AdobeCommerceHttpClient`

#### Overrides

```ts
HttpClientBase<RequiredComerceHttpClientConfig>.constructor
```

## Properties

### config

```ts
readonly config: Readonly<RequiredComerceHttpClientConfig>;
```

Defined in: [aio-commerce-lib-api/source/lib/http-client-base.ts:26](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-api/source/lib/http-client-base.ts#L26)

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

Defined in: [aio-commerce-lib-api/source/lib/http-client-base.ts:31](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-api/source/lib/http-client-base.ts#L31)

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

Defined in: [aio-commerce-lib-api/source/lib/http-client-base.ts:28](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-api/source/lib/http-client-base.ts#L28)

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

Defined in: [aio-commerce-lib-api/source/lib/http-client-base.ts:33](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-api/source/lib/http-client-base.ts#L33)

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

Defined in: [aio-commerce-lib-api/source/lib/http-client-base.ts:23](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-api/source/lib/http-client-base.ts#L23)

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

Defined in: [aio-commerce-lib-api/source/lib/http-client-base.ts:32](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-api/source/lib/http-client-base.ts#L32)

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

Defined in: [aio-commerce-lib-api/source/lib/http-client-base.ts:29](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-api/source/lib/http-client-base.ts#L29)

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

Defined in: [aio-commerce-lib-api/source/lib/http-client-base.ts:30](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-api/source/lib/http-client-base.ts#L30)

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

### retry()

```ts
retry: (options?: ForceRetryOptions) => RetryMarker;
```

Defined in: [aio-commerce-lib-api/source/lib/http-client-base.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-api/source/lib/http-client-base.ts#L34)

Force a retry from an `afterResponse` hook.

This allows you to retry a request based on the response content, even if the response has a successful status code. The retry will respect the `retry.limit` option and skip the `shouldRetry` check. The forced retry is observable in `beforeRetry` hooks, where the error will be a `ForceRetryError`.

Force a retry from an `afterResponse` hook.

This allows you to retry a request based on the response content, even if the response has a successful status code. The retry will respect the `retry.limit` option and skip the `shouldRetry` check. The forced retry is observable in `beforeRetry` hooks, where the error will be a `ForceRetryError`.

#### Parameters

| Parameter  | Type                | Description                           |
| ---------- | ------------------- | ------------------------------------- |
| `options?` | `ForceRetryOptions` | Optional configuration for the retry. |

#### Returns

`RetryMarker`

#### Example

```
import ky, {isForceRetryError} from 'ky';

const api = ky.extend({
    hooks: {
        afterResponse: [
            async (request, options, response) => {
                // Retry based on response body content
                if (response.status === 200) {
                    const data = await response.clone().json();

                    // Simple retry with default delay
                    if (data.error?.code === 'TEMPORARY_ERROR') {
                        return ky.retry();
                    }

                    // Retry with custom delay from API response
                    if (data.error?.code === 'RATE_LIMIT') {
                        return ky.retry({
                            delay: data.error.retryAfter * 1000,
                            code: 'RATE_LIMIT'
                        });
                    }

                    // Retry with a modified request (e.g., fallback endpoint)
                    if (data.error?.code === 'FALLBACK_TO_BACKUP') {
                        return ky.retry({
                            request: new Request('https://backup-api.com/endpoint', {
                                method: request.method,
                                headers: request.headers,
                            }),
                            code: 'BACKUP_ENDPOINT'
                        });
                    }

                    // Retry with refreshed authentication
                    if (data.error?.code === 'TOKEN_REFRESH' && data.newToken) {
                        return ky.retry({
                            request: new Request(request, {
                                headers: {
                                    ...Object.fromEntries(request.headers),
                                    'Authorization': `Bearer ${data.newToken}`
                                }
                            }),
                            code: 'TOKEN_REFRESHED'
                        });
                    }

                    // Retry with cause to preserve error chain
                    try {
                        validateResponse(data);
                    } catch (error) {
                        return ky.retry({
                            code: 'VALIDATION_FAILED',
                            cause: error
                        });
                    }
                }
            }
        ],
        beforeRetry: [
            ({error, retryCount}) => {
                // Observable in beforeRetry hooks
                if (isForceRetryError(error)) {
                    console.log(`Forced retry #${retryCount}: ${error.message}`);
                    // Example output: "Forced retry #1: Forced retry: RATE_LIMIT"
                }
            }
        ]
    }
});

const response = await api.get('https://example.com/api');
```

#### Example

```
import ky, {isForceRetryError} from 'ky';

const api = ky.extend({
    hooks: {
        afterResponse: [
            async (request, options, response) => {
                // Retry based on response body content
                if (response.status === 200) {
                    const data = await response.clone().json();

                    // Simple retry with default delay
                    if (data.error?.code === 'TEMPORARY_ERROR') {
                        return ky.retry();
                    }

                    // Retry with custom delay from API response
                    if (data.error?.code === 'RATE_LIMIT') {
                        return ky.retry({
                            delay: data.error.retryAfter * 1000,
                            code: 'RATE_LIMIT'
                        });
                    }
                }
            }
        ],
        beforeRetry: [
            ({error, retryCount}) => {
                // Observable in beforeRetry hooks
                if (isForceRetryError(error)) {
                    console.log(`Forced retry #${retryCount}: ${error.message}`);
                    // Example output: "Forced retry #1: Forced retry: RATE_LIMIT"
                }
            }
        ]
    }
});

const response = await api.get('https://example.com/api');
```

#### Inherited from

```ts
HttpClientBase.retry;
```

---

### stop

```ts
stop: typeof stop;
```

Defined in: [aio-commerce-lib-api/source/lib/http-client-base.ts:35](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-api/source/lib/http-client-base.ts#L35)

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
extend(options: Options | (parentOptions: Options) => Options): HttpClientBase<Readonly<RequiredComerceHttpClientConfig>>;
```

Defined in: [aio-commerce-lib-api/source/lib/http-client-base.ts:67](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-api/source/lib/http-client-base.ts#L67)

Extends the current HTTP client instance with the given options.

#### Parameters

| Parameter | Type                                                   | Description                                 |
| --------- | ------------------------------------------------------ | ------------------------------------------- |
| `options` | `Options` \| (`parentOptions`: `Options`) => `Options` | The options to extend the HTTP client with. |

#### Returns

`HttpClientBase`\<`Readonly`\<`RequiredComerceHttpClientConfig`\>\>

#### Inherited from

```ts
HttpClientBase.extend;
```

---

### setHttpClient()

```ts
protected setHttpClient(httpClient: KyInstance): void;
```

Defined in: [aio-commerce-lib-api/source/lib/http-client-base.ts:51](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-api/source/lib/http-client-base.ts#L51)

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
