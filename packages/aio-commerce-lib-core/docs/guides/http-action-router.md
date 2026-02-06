# HTTP Action Router Guide

The `@adobe/aio-commerce-lib-core/actions` module provides a type-safe HTTP router for Adobe I/O Runtime actions, with built-in schema validation, path parameter extraction, and middleware support.

## Overview

When building Adobe I/O Runtime actions, you often need to:

- Route requests to different handlers based on path and method
- Extract and validate path parameters, query strings, and request bodies
- Add shared context (authentication, logging) across routes
- Handle errors consistently

The HTTP Action Router simplifies these common patterns with a fluent, Express-like API.

## Basic Usage

```typescript
import { HttpActionRouter } from "@adobe/aio-commerce-lib-core/actions";
import { ok, notFound } from "@adobe/aio-commerce-lib-core/responses";

const router = new HttpActionRouter();

router.get("/users/:id", {
  handler: (req) => {
    return ok({ body: { id: req.params.id } });
  },
});

router.post("/users", {
  handler: (req) => {
    return created({ body: req.body });
  },
});

// Export the handler for Adobe I/O Runtime
export const main = router.handler();
```

## Route Methods

The router supports all standard HTTP methods:

```typescript
router.get("/resource", { handler: (req) => ok() });
router.post("/resource", { handler: (req) => created() });
router.put("/resource/:id", { handler: (req) => ok() });
router.patch("/resource/:id", { handler: (req) => ok() });
router.delete("/resource/:id", { handler: (req) => ok() });
```

## Path Parameters

Path parameters are extracted automatically using `:param` syntax:

```typescript
// Named parameters
router.get("/users/:userId/posts/:postId", {
  handler: (req) => {
    // TypeScript infers: req.params = { userId: string, postId: string }
    console.log(req.params.userId, req.params.postId);
    return ok({ body: req.params });
  },
});

// Optional parameters (trailing ?)
router.get("/products/:category/:id?", {
  handler: (req) => {
    // req.params = { category: string, id?: string }
    return ok({ body: { category: req.params.category, id: req.params.id } });
  },
});

// Wildcard (catches everything after)
router.get("/files/*", {
  handler: (req) => {
    // req.params = { wild: string }
    return ok({ body: { path: req.params.wild } });
  },
});
```

## Schema Validation

Use any [Standard Schema](https://github.com/standard-schema/standard-schema) compatible library (Valibot, Zod, ArkType, etc.) for validation:

```typescript
import { object, string, pipe, minLength } from "valibot";

const userIdSchema = object({
  id: pipe(string(), minLength(1)),
});

const createUserSchema = object({
  name: pipe(string(), minLength(1)),
  email: string(),
});

router.get("/users/:id", {
  params: userIdSchema,
  handler: (req) => {
    // req.params is typed as { id: string } with validation applied
    return ok({ body: { id: req.params.id } });
  },
});

router.post("/users", {
  body: createUserSchema,
  handler: (req) => {
    // req.body is typed as { name: string, email: string }
    return created({ body: req.body });
  },
});
```

### Validation Error Responses

When validation fails, the router automatically returns a 400 Bad Request response:

```json
{
  "statusCode": 400,
  "body": {
    "message": "Invalid request body",
    "issues": [{ "path": ["email"], "message": "Invalid email format" }]
  }
}
```

### Query Parameter Validation

```typescript
const paginationSchema = object({
  page: optional(string()),
  limit: optional(string()),
});

router.get("/users", {
  query: paginationSchema,
  handler: (req) => {
    const page = parseInt(req.query.page ?? "1", 10);
    const limit = parseInt(req.query.limit ?? "10", 10);
    return ok({ body: { page, limit } });
  },
});
```

## Request Object

The handler receives a request object with the following properties:

```typescript
router.get("/example", {
  handler: (req) => {
    req.params; // Extracted path parameters
    req.body; // Parsed request body
    req.query; // Query string parameters
    req.headers; // HTTP headers
    req.method; // HTTP method ("GET", "POST", etc.)
    req.path; // Matched path

    return ok();
  },
});
```

## Context and Middleware

Use `.use()` to register context builders (middleware) that run before route handlers:

```typescript
import { HttpActionRouter, logger } from "@adobe/aio-commerce-lib-core/actions";

const router = new HttpActionRouter()
  .use(logger({ level: "debug" }))
  .use(async (ctx) => ({
    user: await authenticateUser(ctx.rawParams.__ow_headers?.authorization),
  }));

router.get("/me", {
  handler: (req, ctx) => {
    // ctx.logger is available from logger middleware
    ctx.logger.info("Fetching current user");

    // ctx.user is available from auth middleware
    return ok({ body: ctx.user });
  },
});
```

### Built-in Logger Middleware

The `logger` middleware adds an `@adobe/aio-lib-core-logging` instance to the context:

```typescript
import { HttpActionRouter, logger } from "@adobe/aio-commerce-lib-core/actions";

const router = new HttpActionRouter().use(
  logger({
    level: "debug",
    name: (ctx) => "my-action", // Custom logger name
  }),
);

router.get("/test", {
  handler: (req, ctx) => {
    ctx.logger.debug("Debug message");
    ctx.logger.info("Info message");
    ctx.logger.warn("Warning message");
    ctx.logger.error("Error message");
    return ok();
  },
});
```

### Custom Context Builders

Create your own middleware by returning an object with context properties:

```typescript
import { HttpActionRouter } from "@adobe/aio-commerce-lib-core/actions";

interface AuthContext {
  user: { id: string; role: string };
}

function authMiddleware() {
  return async (ctx) => {
    const token = ctx.rawParams.__ow_headers?.authorization;
    const user = await validateToken(token);
    return { user };
  };
}

const router = new HttpActionRouter().use(authMiddleware());

// TypeScript knows ctx.user is available
router.get("/admin", {
  handler: (req, ctx) => {
    if (ctx.user.role !== "admin") {
      return forbidden("Admin access required");
    }
    return ok({ body: { admin: true } });
  },
});
```

### Accessing Raw OpenWhisk Parameters

The `ctx.rawParams` property contains the original OpenWhisk/Runtime action parameters:

```typescript
router.get("/debug", {
  handler: (req, ctx) => {
    const { __ow_method, __ow_path, __ow_headers } = ctx.rawParams;
    return ok({
      body: {
        method: __ow_method,
        path: __ow_path,
        headers: __ow_headers,
      },
    });
  },
});
```

## Defining Routes Separately

Use `defineRoute` to define route handlers in separate files while maintaining type safety:

```typescript
// routes/users.ts
import { defineRoute } from "@adobe/aio-commerce-lib-core/actions";
import { ok } from "@adobe/aio-commerce-lib-core/responses";
import { router } from "../router";

export const getUser = defineRoute(router, {
  handler: (req, ctx) => {
    // ctx is properly typed based on router's middleware
    return ok({ body: { id: req.params.id } });
  },
});

// router.ts
import { HttpActionRouter, logger } from "@adobe/aio-commerce-lib-core/actions";
import { getUser } from "./routes/users";

export const router = new HttpActionRouter().use(logger());

router.get("/users/:id", getUser);
```

## Error Handling

The router automatically catches errors in handlers and returns 500 responses:

```typescript
router.get("/risky", {
  handler: async (req) => {
    // If this throws, router returns 500 with error message
    const data = await riskyOperation();
    return ok({ body: data });
  },
});
```

### HTTP Status Responses

The router automatically handles common scenarios:

- **404 Not Found**: When no route matches the path
- **405 Method Not Allowed**: When path matches but method doesn't
- **400 Bad Request**: When schema validation fails
- **500 Internal Server Error**: When handler throws an error

## Best Practices

### 1. Use Schema Validation for Input

```typescript
// ✅ Validate inputs with schemas
router.post("/users", {
  body: createUserSchema,
  handler: (req) => created({ body: req.body }),
});

// ❌ Manual validation is error-prone
router.post("/users", {
  handler: (req) => {
    if (!req.body.name) return badRequest("Name required");
    // ...
  },
});
```

### 2. Chain Middleware for Shared Context

```typescript
// ✅ Build context incrementally
const router = new HttpActionRouter()
  .use(logger())
  .use(auth())
  .use(rateLimit());

// All routes have access to logger, auth, and rateLimit context
```

### 3. Keep Handlers Focused

```typescript
// ✅ Single responsibility handlers
router.get("/users/:id", {
  params: userIdSchema,
  handler: async (req, ctx) => {
    const user = await ctx.userService.findById(req.params.id);
    return user ? ok({ body: user }) : notFound("User not found");
  },
});
```

### 4. Use Response Helpers Consistently

```typescript
import {
  ok,
  created,
  badRequest,
  notFound,
  forbidden,
} from "@adobe/aio-commerce-lib-core/responses";

// Use the appropriate response helper for each scenario
return ok({ body: data });
return created({ body: newResource });
return badRequest("Invalid input");
return notFound("Resource not found");
return forbidden("Access denied");
```
