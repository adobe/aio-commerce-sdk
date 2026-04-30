# `@aio-commerce-sdk/common-utils` Documentation

## Overview

This package provides common utility functions for the Adobe Commerce SDK packages and applications. It includes reusable helpers for validation and schema definitions using [Valibot](https://valibot.dev/).

## HTTP Action Router

```typescript
import { HttpActionRouter, logger } from "@adobe/aio-commerce-lib-core/actions";
import { ok, created, notFound } from "@adobe/aio-commerce-lib-core/responses";

const router = new HttpActionRouter().use(logger());

router.get("/users/:id", {
  handler: (req, ctx) => {
    ctx.logger.info(`Fetching user ${req.params.id}`);
    return ok({ body: { id: req.params.id } });
  },
});

router.post("/users", {
  handler: (req) => created({ body: req.body }),
});

export const main = router.handler();
```

[Read the HTTP Action Router Guide →](./guides/http-action-router.md)

## Valibot Utilities

The package exports Valibot-related utilities through the `@aio-commerce-sdk/common-utils/valibot` entrypoint.

### Schema Factories

Pre-built schema factories for common validation patterns:

```typescript
import {
  stringValueSchema,
  booleanValueSchema,
  alphaNumericOrUnderscoreSchema,
  alphaNumericOrUnderscoreOrHyphenSchema,
} from "@aio-commerce-sdk/common-utils/valibot";

// Create a string schema with a descriptive error message
const nameSchema = stringValueSchema("name");

// Create a boolean schema with a descriptive error message
const enabledSchema = booleanValueSchema("enabled");

// Validate alphanumeric strings with underscores (e.g., "my_variable_1")
const identifierSchema = alphaNumericOrUnderscoreSchema("identifier");

// Validate alphanumeric strings with underscores and hyphens (e.g., "my-variable-1")
const slugSchema = alphaNumericOrUnderscoreOrHyphenSchema("slug");
```

### Parse or Throw

A utility function that parses input using a Valibot schema and throws a `CommerceSdkValidationError` if validation fails:

```typescript
import { parseOrThrow } from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

const userSchema = v.object({
  name: v.string(),
  age: v.number(),
});

// Throws CommerceSdkValidationError if input is invalid
const user = parseOrThrow(userSchema, { name: "John", age: 30 });
```

### Function Schema Helpers

The Valibot entrypoint also exports helpers for validating function signatures and return values with consistent error messages.

```typescript
import * as v from "valibot";
import {
  asyncFunctionSchema,
  syncFunctionSchema,
  syncOrAsyncFunctionSchema,
} from "@aio-commerce-sdk/common-utils/valibot";

const args = v.tuple([v.string()]);
const output = v.number();

const syncValidator = syncFunctionSchema({ args, output });
const asyncValidator = asyncFunctionSchema({ args, output });
const hybridValidator = syncOrAsyncFunctionSchema({ args, output });

const syncHandler = v.parse(syncValidator, (value: string) => value.length);
const asyncHandler = v.parse(
  asyncValidator,
  async (value: string) => value.length,
);
const hybridHandler = v.parse(hybridValidator, (value: string) => value.length);

syncHandler("abc");
await asyncHandler("abc");
await hybridHandler("abc");
```

Use `syncOrAsyncFunctionSchema` when the validated function may return either a direct value or a promise-like value at runtime.

### Prefixed Validation Messages

Use `withPrefixedMessage` to prepend a fixed label or an issue-aware label to any Valibot schema message.

```typescript
import * as v from "valibot";
import { withPrefixedMessage } from "@aio-commerce-sdk/common-utils/valibot";

const schema = withPrefixedMessage(
  v.object({
    email: v.pipe(v.string(), v.email("Must be a valid email address")),
  }),
  (issue) => {
    const path = v.getDotPath(issue);
    return path ? `Invalid payload at "${path}"` : "Invalid payload";
  },
);

v.parse(schema, { email: "not-an-email" });
// Throws a ValiError with a message like:
// Invalid payload at "email" → Must be a valid email address
```

Pass a custom separator as the third argument when you need something other than the default `" →"` joiner.

## API Reference

For a complete list of all available types, functions, and schemas, see the [API Reference](./api-reference/README.md).
