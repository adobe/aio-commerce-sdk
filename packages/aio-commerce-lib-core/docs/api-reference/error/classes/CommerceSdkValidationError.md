# `CommerceSdkValidationError`

Defined in: [lib/error/validation-error.ts:103](https://github.com/adobe/aio-commerce-sdk/blob/b828858b2e024cee9599e664761b0da5b22f0cd1/packages/aio-commerce-lib-core/source/lib/error/validation-error.ts#L103)

Represents a validation error in the Commerce SDK.
This error should be thrown when an input does not conform to the expected schema.
It contains a list of issues that describe the validation errors.

## Example

```ts
const error = new CommerceSdkValidationError("Invalid input", {
  // `someIssues` is in scope, returned by some `valibot` operation.
  issues: someIssues,
});

console.log(error.display());
```

## Extends

- [`CommerceSdkErrorBase`](CommerceSdkErrorBase.md)

## Constructors

### Constructor

```ts
new CommerceSdkValidationError(message: string, options: CommerceSdkValidationErrorOptions): CommerceSdkValidationError;
```

Defined in: [lib/error/validation-error.ts:112](https://github.com/adobe/aio-commerce-sdk/blob/b828858b2e024cee9599e664761b0da5b22f0cd1/packages/aio-commerce-lib-core/source/lib/error/validation-error.ts#L112)

Constructs a new CommerceSdkValidationError instance.

#### Parameters

| Parameter | Type                                | Description                                                                   |
| --------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `message` | `string`                            | A human-friendly description of the validation error.                         |
| `options` | `CommerceSdkValidationErrorOptions` | Options for the validation error, including the issues that caused the error. |

#### Returns

`CommerceSdkValidationError`

#### Overrides

[`CommerceSdkErrorBase`](CommerceSdkErrorBase.md).[`constructor`](CommerceSdkErrorBase.md#constructor)

## Properties

### issues

```ts
readonly issues: GenericIssue[];
```

Defined in: [lib/error/validation-error.ts:104](https://github.com/adobe/aio-commerce-sdk/blob/b828858b2e024cee9599e664761b0da5b22f0cd1/packages/aio-commerce-lib-core/source/lib/error/validation-error.ts#L104)

---

### traceId?

```ts
readonly optional traceId: string;
```

Defined in: [lib/error/base-error.ts:54](https://github.com/adobe/aio-commerce-sdk/blob/b828858b2e024cee9599e664761b0da5b22f0cd1/packages/aio-commerce-lib-core/source/lib/error/base-error.ts#L54)

#### Inherited from

[`CommerceSdkErrorBase`](CommerceSdkErrorBase.md).[`traceId`](CommerceSdkErrorBase.md#traceid)

## Accessors

### fullStack

#### Get Signature

```ts
get fullStack(): string;
```

Defined in: [lib/error/base-error.ts:96](https://github.com/adobe/aio-commerce-sdk/blob/b828858b2e024cee9599e664761b0da5b22f0cd1/packages/aio-commerce-lib-core/source/lib/error/base-error.ts#L96)

Returns the full stack trace of the error and its causes.

##### Returns

`string`

#### Inherited from

[`CommerceSdkErrorBase`](CommerceSdkErrorBase.md).[`fullStack`](CommerceSdkErrorBase.md#fullstack)

---

### rootCause

#### Get Signature

```ts
get rootCause(): unknown;
```

Defined in: [lib/error/base-error.ts:109](https://github.com/adobe/aio-commerce-sdk/blob/b828858b2e024cee9599e664761b0da5b22f0cd1/packages/aio-commerce-lib-core/source/lib/error/base-error.ts#L109)

Returns the root cause of the error.

##### Returns

`unknown`

#### Inherited from

[`CommerceSdkErrorBase`](CommerceSdkErrorBase.md).[`rootCause`](CommerceSdkErrorBase.md#rootcause)

## Methods

### display()

```ts
display(withColor: boolean): string;
```

Defined in: [lib/error/validation-error.ts:124](https://github.com/adobe/aio-commerce-sdk/blob/b828858b2e024cee9599e664761b0da5b22f0cd1/packages/aio-commerce-lib-core/source/lib/error/validation-error.ts#L124)

Returns a pretty string (and colored) representation of the validation error.

#### Parameters

| Parameter   | Type      | Default value | Description                         |
| ----------- | --------- | ------------- | ----------------------------------- |
| `withColor` | `boolean` | `true`        | Whether to use color in the output. |

#### Returns

`string`

---

### toJSON()

```ts
toJSON(): {
  cause: unknown;
  message: string;
  name: string;
  stack: string;
  traceId: undefined | string;
};
```

Defined in: [lib/error/base-error.ts:124](https://github.com/adobe/aio-commerce-sdk/blob/b828858b2e024cee9599e664761b0da5b22f0cd1/packages/aio-commerce-lib-core/source/lib/error/base-error.ts#L124)

Converts the error to a JSON-like representation.

#### Returns

```ts
{
  cause: unknown;
  message: string;
  name: string;
  stack: string;
  traceId: undefined | string;
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
traceId: undefined | string;
```

#### Inherited from

[`CommerceSdkErrorBase`](CommerceSdkErrorBase.md).[`toJSON`](CommerceSdkErrorBase.md#tojson)

---

### toString()

```ts
toString(inspect: boolean): string;
```

Defined in: [lib/error/base-error.ts:139](https://github.com/adobe/aio-commerce-sdk/blob/b828858b2e024cee9599e664761b0da5b22f0cd1/packages/aio-commerce-lib-core/source/lib/error/base-error.ts#L139)

Returns a pretty string representation of the error.

#### Parameters

| Parameter | Type      | Default value | Description                                                                          |
| --------- | --------- | ------------- | ------------------------------------------------------------------------------------ |
| `inspect` | `boolean` | `true`        | Whether to inspect the error (returns a more detailed string, useful for debugging). |

#### Returns

`string`

#### Inherited from

[`CommerceSdkErrorBase`](CommerceSdkErrorBase.md).[`toString`](CommerceSdkErrorBase.md#tostring)

---

### isSdkError()

```ts
static isSdkError(error: unknown): error is CommerceSdkErrorBase;
```

Defined in: [lib/error/base-error.ts:91](https://github.com/adobe/aio-commerce-sdk/blob/b828858b2e024cee9599e664761b0da5b22f0cd1/packages/aio-commerce-lib-core/source/lib/error/base-error.ts#L91)

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

[`CommerceSdkErrorBase`](CommerceSdkErrorBase.md).[`isSdkError`](CommerceSdkErrorBase.md#issdkerror)
