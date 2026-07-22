# `AdminUiPermissionDeniedError`

Defined in: [aio-commerce-lib-admin-ui/source/errors.ts:24](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/errors.ts#L24)

Error thrown when the current user is denied access to an Admin UI SDK ACL resource.

## Extends

- [`AdminUiPermissionError`](AdminUiPermissionError.md)

## Constructors

### Constructor

```ts
new AdminUiPermissionDeniedError(resource: string, options?: AdminUiPermissionDeniedErrorOptions): AdminUiPermissionDeniedError;
```

Defined in: [aio-commerce-lib-admin-ui/source/errors.ts:27](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/errors.ts#L27)

#### Parameters

| Parameter  | Type                                                                                            |
| ---------- | ----------------------------------------------------------------------------------------------- |
| `resource` | `string`                                                                                        |
| `options?` | [`AdminUiPermissionDeniedErrorOptions`](../type-aliases/AdminUiPermissionDeniedErrorOptions.md) |

#### Returns

`AdminUiPermissionDeniedError`

#### Overrides

[`AdminUiPermissionError`](AdminUiPermissionError.md).[`constructor`](AdminUiPermissionError.md#constructor)

## Properties

### resource

```ts
readonly resource: string;
```

Defined in: [aio-commerce-lib-admin-ui/source/errors.ts:25](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-admin-ui/source/errors.ts#L25)

---

### traceId?

```ts
readonly optional traceId?: string;
```

Defined in: [aio-commerce-lib-core/source/error/base-error.ts:54](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-core/source/error/base-error.ts#L54)

#### Inherited from

[`AdminUiPermissionError`](AdminUiPermissionError.md).[`traceId`](AdminUiPermissionError.md#traceid)

## Accessors

### fullStack

#### Get Signature

```ts
get fullStack(): string;
```

Defined in: [aio-commerce-lib-core/source/error/base-error.ts:96](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-core/source/error/base-error.ts#L96)

Returns the full stack trace of the error and its causes.

##### Returns

`string`

#### Inherited from

[`AdminUiPermissionError`](AdminUiPermissionError.md).[`fullStack`](AdminUiPermissionError.md#fullstack)

---

### rootCause

#### Get Signature

```ts
get rootCause(): unknown;
```

Defined in: [aio-commerce-lib-core/source/error/base-error.ts:109](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-core/source/error/base-error.ts#L109)

Returns the root cause of the error.

##### Returns

`unknown`

#### Inherited from

[`AdminUiPermissionError`](AdminUiPermissionError.md).[`rootCause`](AdminUiPermissionError.md#rootcause)

## Methods

### toJSON()

```ts
toJSON(): {
  cause: unknown;
  message: string;
  name: string;
  stack: string;
  traceId: string | undefined;
};
```

Defined in: [aio-commerce-lib-core/source/error/base-error.ts:124](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-core/source/error/base-error.ts#L124)

Converts the error to a JSON-like representation.

#### Returns

```ts
{
  cause: unknown;
  message: string;
  name: string;
  stack: string;
  traceId: string | undefined;
}
```

##### cause

```ts
cause: unknown;
```

##### message

```ts
message: string;
```

##### name

```ts
name: string;
```

##### stack

```ts
stack: string;
```

##### traceId

```ts
traceId: string | undefined;
```

#### Inherited from

[`AdminUiPermissionError`](AdminUiPermissionError.md).[`toJSON`](AdminUiPermissionError.md#tojson)

---

### toString()

```ts
toString(inspect?: boolean): string;
```

Defined in: [aio-commerce-lib-core/source/error/base-error.ts:139](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-core/source/error/base-error.ts#L139)

Returns a pretty string representation of the error.

#### Parameters

| Parameter | Type      | Default value | Description                                                                          |
| --------- | --------- | ------------- | ------------------------------------------------------------------------------------ |
| `inspect` | `boolean` | `true`        | Whether to inspect the error (returns a more detailed string, useful for debugging). |

#### Returns

`string`

#### Inherited from

[`AdminUiPermissionError`](AdminUiPermissionError.md).[`toString`](AdminUiPermissionError.md#tostring)

---

### isSdkError()

```ts
static isSdkError(error: unknown): error is CommerceSdkErrorBase;
```

Defined in: [aio-commerce-lib-core/source/error/base-error.ts:91](https://github.com/adobe/aio-commerce-sdk/blob/4d87f72a1eb376a4bae7e6bc80e12098f7b0f2b3/packages/aio-commerce-lib-core/source/error/base-error.ts#L91)

Checks if the error is any CommerceSdkErrorBase instance.

#### Parameters

| Parameter | Type      |
| --------- | --------- |
| `error`   | `unknown` |

#### Returns

`error is CommerceSdkErrorBase`

#### Example

```ts
class ValidationError extends CommerceSdkErrorBase {}
const err = new ValidationError("Invalid", {});

CommerceSdkErrorBase.isSdkError(err); // true
ValidationError.isSdkError(err); // true
CommerceSdkErrorBase.isSdkError(new Error("Regular")); // false
```

#### Inherited from

[`AdminUiPermissionError`](AdminUiPermissionError.md).[`isSdkError`](AdminUiPermissionError.md#issdkerror)
