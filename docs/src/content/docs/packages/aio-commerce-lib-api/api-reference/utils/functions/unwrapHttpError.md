---
title: "unwrapHttpError()"
editUrl: false
prev: false
next: false
---

```ts
function unwrapHttpError(error: unknown): Promise<string>;
```

Defined in: [aio-commerce-lib-api/source/utils/http/error.ts:34](https://github.com/adobe/aio-commerce-sdk/blob/d3b51b3a74b902fcf7e96c43e79d467248c8da30/packages/aio-commerce-lib-api/source/utils/http/error.ts#L34)

Unwraps a ky `HTTPError` to produce a human-readable string that includes the
HTTP status and the message extracted from the response body.

If `error` is not an `HTTPError`, falls back to `error.message` for `Error`
instances or `String(error)` for anything else.

Tries the following shapes from the response JSON body, in order:

- `body.message` (string) — if `body.parameters` is a non-empty array, `%1`/`%2`/... placeholders are replaced with the corresponding parameter values
- `body.error` (string)
- `body.error.message` (nested object)
- `body.errors[0].message` (array)
- raw text body

## Parameters

| Parameter | Type      |
| --------- | --------- |
| `error`   | `unknown` |

## Returns

`Promise`\<`string`\>

## Example

```ts
// Commerce returns { "message": "Provider already exists" } with status 400
await unwrapHttpError(err);
// → "HTTP 400 Bad Request — Provider already exists"
```
