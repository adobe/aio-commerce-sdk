# API Documentation

## packages/aio-commerce-lib-core/source/lib/error.ts

### Classs

#### `CommerceSdkErrorBase`

Base class for all AioCommerceSdk errors.

**Examples:**

````javascript
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
````

```

**Location:** `packages/aio-commerce-lib-core/source/lib/error.ts:53`


---

### Methods

#### `constructor`

Constructs a new CommerceSdkErrorBase instance.

**Parameters:**

- `message` - - A human-friendly description of the error.
- `traceId` - - An optional trace ID for tracking the error in logs.
- `options` - - Required error options.

**Location:** `packages/aio-commerce-lib-core/source/lib/error.ts:63`


---

#### `is`

/** Checks if the error is an CommerceSdkErrorBase instance.

**Location:** `packages/aio-commerce-lib-core/source/lib/error.ts:81`


---

#### `fullStack`

/** Returns the full stack trace of the error and its causes.

**Location:** `packages/aio-commerce-lib-core/source/lib/error.ts:86`


---

#### `rootCause`

/** Returns the root cause of the error.

**Location:** `packages/aio-commerce-lib-core/source/lib/error.ts:99`


---

#### `toJSON`

/** Converts the error to a JSON-like representation.

**Location:** `packages/aio-commerce-lib-core/source/lib/error.ts:114`


---

#### `toString`

/** Returns a pretty string representation of the error.

**Location:** `packages/aio-commerce-lib-core/source/lib/error.ts:126`


---

### Variables

#### `out`

/** Returns the full stack trace of the error and its causes.

**Location:** `packages/aio-commerce-lib-core/source/lib/error.ts:87`


---

#### `cause`

/** Returns the full stack trace of the error and its causes.

**Location:** `packages/aio-commerce-lib-core/source/lib/error.ts:88`


---

#### `cause`

/** Returns the root cause of the error.

**Location:** `packages/aio-commerce-lib-core/source/lib/error.ts:100`


---

```
