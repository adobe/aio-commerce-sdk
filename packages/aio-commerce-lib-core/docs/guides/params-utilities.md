# Params Utilities Guide

The `@adobe/aio-commerce-lib-core/params` module provides helper functions for validating Adobe I/O Runtime action parameters.

## nonEmpty

Checks if a parameter has a non-empty value.

```typescript
import { nonEmpty } from "@adobe/aio-commerce-lib-core/params";
import { badRequest } from "@adobe/aio-commerce-lib-core/responses";

function main(params) {
  if (!nonEmpty("apiKey", params.apiKey)) {
    return badRequest({ message: "apiKey is required" });
  }

  // apiKey is now guaranteed to be non-empty
  const key = params.apiKey;
}
```

### What is Considered Non-Empty?

The `nonEmpty` function returns `false` for:

- `undefined` values
- `null` values
- Empty strings (`""`)
- Whitespace-only strings (`"   "`)
- App Builder dev mode placeholders (e.g., `$PARAM_NAME`)

All other values (including `0`, `false`, arrays, objects) are considered non-empty.

### Examples

```typescript
nonEmpty("apiKey", "abc123"); // true
nonEmpty("apiKey", ""); // false
nonEmpty("apiKey", "   "); // false
nonEmpty("apiKey", undefined); // false
nonEmpty("apiKey", null); // false
nonEmpty("apiKey", "$apiKey"); // false (dev mode placeholder)
nonEmpty("apiKey", 0); // true
nonEmpty("apiKey", false); // true
nonEmpty("apiKey", []); // false (becomes empty string)
nonEmpty("apiKey", [1, 2, 3]); // true
```

## allNonEmpty

Checks if all required parameters are non-empty. When the check passes, TypeScript automatically narrows the type to guarantee that all required parameters are strings.

```typescript
import { allNonEmpty } from "@adobe/aio-commerce-lib-core/params";
import { badRequest } from "@adobe/aio-commerce-lib-core/responses";

function main(params) {
  const required = ["apiKey", "clientId", "clientSecret"] as const;

  if (!allNonEmpty(params, required)) {
    return badRequest({
      message: "Missing required parameters",
      body: { required },
    });
  }

  // TypeScript now knows that apiKey, clientId, and clientSecret are strings
  const { apiKey, clientId, clientSecret } = params;

  // Use the validated parameters...
}
```

### Examples

```typescript
// All parameters present and non-empty
allNonEmpty({ apiKey: "abc", clientId: "123", clientSecret: "xyz" }, [
  "apiKey",
  "clientId",
  "clientSecret",
]); // true

// Missing parameter
allNonEmpty({ apiKey: "abc", clientSecret: "xyz" }, [
  "apiKey",
  "clientId",
  "clientSecret",
]); // false

// Empty parameter
allNonEmpty({ apiKey: "abc", clientId: "", clientSecret: "xyz" }, [
  "apiKey",
  "clientId",
  "clientSecret",
]); // false

// Extra parameters are ignored
allNonEmpty({ apiKey: "abc", clientId: "123", extra: "" }, [
  "apiKey",
  "clientId",
]); // true
```

## App Builder Dev Mode Compatibility

The params utilities are designed to work seamlessly with Adobe I/O App Builder's dev mode.

### The Problem

> [!NOTE]
> This has been fixed in since v11 of the AIO CLI, but it's kept here for backwards compatibility.

In App Builder, when you map action inputs to environment variables:

- **Production mode**: Undefined environment variables appear as empty strings (`""`)
- **Dev mode**: Undefined environment variables appear as placeholders (`$VAR_NAME`)

This inconsistency can make validation difficult.

### The Solution

The `nonEmpty` function automatically handles both cases:

```typescript
// In production, undefined env var comes as ""
nonEmpty("API_KEY", ""); // false

// In dev mode, undefined env var comes as "$API_KEY"
nonEmpty("API_KEY", "$API_KEY"); // false

// Both are treated as empty!
```
