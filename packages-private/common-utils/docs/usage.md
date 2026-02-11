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

## API Reference

For a complete list of all available types, functions, and schemas, see the [API Reference](./api-reference/README.md).
