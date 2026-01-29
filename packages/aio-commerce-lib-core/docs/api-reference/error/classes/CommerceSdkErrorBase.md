# `CommerceSdkErrorBase`

Defined in: [error/base-error.ts:53](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-core/source/error/base-error.ts#L53)

Base class for all the errors in the AIO Commerce SDK.

## Example

```ts
class ValidationError extends CommerceSdkErrorBase {
  constructor(message: string, options: ValidationErrorOptions) {
    super(message, options);
  }
}

const err = new ValidationError("Invalid value", {
  tag: "ValidationError",
  field: "name",
  value: "John Doe",
});

console.log(err.toJSON());
```

## Extends

- `Error`

## Extended by

- [`CommerceSdkValidationError`](CommerceSdkValidationError.md)

## Constructors

### Constructor

```ts
new CommerceSdkErrorBase(message: string, options?: CommerceSdkErrorBaseOptions): CommerceSdkErrorBase;
```

Defined in: [error/base-error.ts:63](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-core/source/error/base-error.ts#L63)

Constructs a new CommerceSdkErrorBase instance. This is an abstract class so you
should not instantiate it directly. Only invoke this constructor from a subclass.

#### Parameters

| Parameter  | Type                          | Description                                      |
| ---------- | ----------------------------- | ------------------------------------------------ |
| `message`  | `string`                      | A human-friendly description of the error.       |
| `options?` | `CommerceSdkErrorBaseOptions` | Optional error options (additional information). |

#### Returns

`CommerceSdkErrorBase`

#### Overrides

```ts
Error.constructor;
```

## Properties

### traceId?

```ts
readonly optional traceId: string;
```

Defined in: [error/base-error.ts:54](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-core/source/error/base-error.ts#L54)

## Accessors

### fullStack

#### Get Signature

```ts
get fullStack(): string;
```

Defined in: [error/base-error.ts:96](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-core/source/error/base-error.ts#L96)

Returns the full stack trace of the error and its causes.

##### Returns

`string`

---

### rootCause

#### Get Signature

```ts
get rootCause(): unknown;
```

Defined in: [error/base-error.ts:109](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-core/source/error/base-error.ts#L109)

Returns the root cause of the error.

##### Returns

`unknown`

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

Defined in: [error/base-error.ts:124](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-core/source/error/base-error.ts#L124)

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

---

### toString()

```ts
toString(inspect: boolean): string;
```

Defined in: [error/base-error.ts:139](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-core/source/error/base-error.ts#L139)

Returns a pretty string representation of the error.

#### Parameters

| Parameter | Type      | Default value | Description                                                                          |
| --------- | --------- | ------------- | ------------------------------------------------------------------------------------ |
| `inspect` | `boolean` | `true`        | Whether to inspect the error (returns a more detailed string, useful for debugging). |

#### Returns

`string`

---

### isSdkError()

```ts
static isSdkError(error: unknown): error is CommerceSdkErrorBase;
```

Defined in: [error/base-error.ts:91](https://github.com/adobe/aio-commerce-sdk/blob/384f3fbf71723e5cec7e52e6dc0abda47dee95e6/packages/aio-commerce-lib-core/source/error/base-error.ts#L91)

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
