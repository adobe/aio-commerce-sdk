# `@adobe/aio-commerce-lib-openapi`

Type-safe OpenAPI route handling for Adobe Commerce SDK with automatic request/response validation using Valibot schemas.

## Features

- 🔒 **Type-safe routes** - Full TypeScript support with inferred types
- ✅ **Automatic validation** - Request and response validation using Valibot
- 🎯 **OpenAPI compliant** - Follows OpenAPI specification patterns
- 🚀 **Simple API** - Easy to use with minimal boilerplate
- 🛡️ **Runtime safety** - Validates data at runtime matching compile-time types

## Installation

```bash
npm install @adobe/aio-commerce-lib-openapi
```

## Basic Usage

```typescript
import { openapi } from "@adobe/aio-commerce-lib-openapi";
import * as v from "valibot";

// Define your API handler with route and business logic
const getProductHandler = openapi(
  {
    path: "/products/{id}",
    method: "GET",
    request: {
      params: v.object({
        id: v.string(),
      }),
    },
    responses: {
      200: v.object({
        id: v.string(),
        name: v.string(),
        price: v.number(),
        inStock: v.boolean(),
      }),
      404: v.object({
        error: v.string(),
        message: v.string(),
      }),
    },
  },
  async (spec) => {
    // Validate and get params
    const { id } = await spec.validateParams();

    // Your business logic here
    const product = await getProductFromDatabase(id);

    if (!product) {
      // Return error response
      return spec.error(
        {
          error: "not_found",
          message: `Product ${id} not found`,
        },
        404,
      );
    }

    // Return success response
    return spec.json(product, 200);
  },
);

// Use the handler (e.g., in Adobe App Builder action)
export async function main(params) {
  return getProductHandler(params);
}
```

## API Reference

### `openapi(route, handler)`

Creates a complete API handler by combining route definition with business logic. This is the recommended way to create handlers as it provides a cleaner, more functional approach.

#### Parameters

- `route`: Route definition object (same as `createRoute` options)
- `handler`: Async function that receives the OpenApiSpecHandler and returns a response

#### Returns

An async function that accepts request parameters and returns the handler's response.

#### Example

```typescript
const getProductHandler = openapi(
  {
    path: "/products/{id}",
    method: "GET",
    request: {
      params: v.object({
        id: v.string(),
      }),
    },
    responses: {
      200: v.object({
        id: v.string(),
        name: v.string(),
        price: v.number(),
      }),
      404: v.object({
        error: v.string(),
        message: v.string(),
      }),
    },
  },
  async (spec) => {
    const { id } = await spec.validateParams();
    const product = await getProductById(id);

    if (!product) {
      return spec.error(
        {
          error: "not_found",
          message: `Product ${id} not found`,
        },
        404,
      );
    }

    return spec.json(product, 200);
  },
);

// Use the handler
const response = await getProductHandler({ id: "123" });
```

### `createRoute(options)`

Creates a type-safe route handler with automatic validation. Use this when you need more control over the handler implementation.

#### Options

- `path` (string): The route path (e.g., "/products/{id}")
- `method` (string): HTTP method (GET, POST, PUT, DELETE, PATCH)
- `request` (object): Request schemas
  - `body?`: Request body schema
  - `params?`: URL parameters schema
  - `query?`: Query parameters schema
  - `headers?`: Headers schema
- `responses` (object): Response schemas keyed by status code. Each response can be a Valibot schema or an object with `{schema: bodySchema, headers?: headersSchema}`

#### Returns

An async function that accepts request data and returns an OpenApiSpecHandler.

### OpenApiSpecHandler Methods

#### `validateParams()`

Validates URL parameters against the defined schema.

```typescript
const route = createRoute({
  path: "/users/{userId}/posts/{postId}",
  method: "GET",
  request: {
    params: v.object({
      userId: v.string(),
      postId: v.string(),
    }),
  },
  responses: {
    200: v.object({ data: v.string() }),
  },
});

const handler = await route({ userId: "123", postId: "456" });
const params = await handler.validateParams();
// params is typed as { userId: string, postId: string }
```

#### `validateBody()`

Validates request body against the defined schema.

```typescript
const createProductRoute = createRoute({
  path: "/products",
  method: "POST",
  request: {
    body: {
      schema: v.object({
        name: v.string(),
        price: v.number(),
        description: v.optional(v.string()),
      }),
    },
  },
  responses: {
    201: v.object({ id: v.string() }),
  },
});

const handler = await createProductRoute({
  name: "New Product",
  price: 49.99,
});
const body = await handler.validateBody();
// body is typed and validated
```

#### `validateHeaders()`

Validates request headers against the defined schema.

```typescript
const protectedRoute = createRoute({
  path: "/api/protected",
  method: "GET",
  request: {
    headers: v.object({
      authorization: v.pipe(v.string(), v.startsWith("Bearer ")),
      "x-api-key": v.string(),
    }),
  },
  responses: {
    200: v.object({ data: v.string() }),
  },
});

const handler = await protectedRoute({
  authorization: "Bearer token123",
  "x-api-key": "secret-key",
});
const headers = await handler.validateHeaders();
// headers is typed as { authorization: string, "x-api-key": string }
```

#### `validateQuery()`

Validates query parameters against the defined schema.

```typescript
const searchRoute = createRoute({
  path: "/api/search",
  method: "GET",
  request: {
    query: v.object({
      q: v.string(),
      limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
      offset: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
      category: v.optional(v.string()),
    }),
  },
  responses: {
    200: v.object({
      results: v.array(v.string()),
      total: v.number(),
    }),
  },
});

const handler = await searchRoute({
  q: "search term",
  limit: 10,
  offset: 0,
  category: "electronics",
});
const query = await handler.validateQuery();
// query is typed as { q: string, limit?: number, offset?: number, category?: string }
```

#### `json(data, status?, headers?)`

Returns a successful response with validated data and optional headers.

```typescript
// TypeScript will enforce the correct shape based on status code
const response = await handler.json(
  {
    id: "123",
    name: "Product",
    price: 99.99,
    inStock: true,
  },
  200,
); // status defaults to 200 if not provided

// Returns: { statusCode: 200, body: {...} }

// With headers
const responseWithHeaders = await handler.json(
  { data: "paginated results" },
  200,
  {
    "X-Total-Count": "100",
    "X-Page": 1,
  },
);
// Returns: { statusCode: 200, body: {...}, headers: {...} }
```

#### `error(data, status?)`

Returns an error response with validated data.

```typescript
// Return a 404 error
const notFound = await handler.error(
  {
    error: "not_found",
    message: "Resource not found",
  },
  404,
); // status defaults to 500 if not provided

// Returns: { error: { statusCode: 404, body: {...} } }
```

## Advanced Examples

### Complex Validation with Arrays and Nested Objects

```typescript
const createOrderRoute = createRoute({
  path: "/orders",
  method: "POST",
  request: {
    body: {
      schema: v.object({
        customerId: v.string(),
        items: v.array(
          v.object({
            productId: v.string(),
            quantity: v.number(),
            price: v.number(),
          }),
        ),
        shippingAddress: v.object({
          street: v.string(),
          city: v.string(),
          zipCode: v.string(),
          country: v.string(),
        }),
      }),
    },
  },
  responses: {
    201: v.object({
      orderId: v.string(),
      total: v.number(),
      status: v.literal("pending"),
    }),
    400: v.object({
      error: v.literal("validation_error"),
      message: v.string(),
      errors: v.array(
        v.object({
          field: v.string(),
          message: v.string(),
        }),
      ),
    }),
  },
});

// Usage
const handler = await createOrderRoute({
  customerId: "cust-123",
  items: [
    { productId: "prod-1", quantity: 2, price: 29.99 },
    { productId: "prod-2", quantity: 1, price: 49.99 },
  ],
  shippingAddress: {
    street: "123 Main St",
    city: "New York",
    zipCode: "10001",
    country: "USA",
  },
});

// Validate and process
const body = await handler.validateBody();
const orderId = generateOrderId();
const total = calculateTotal(body.items);

// Return success response
const response = await handler.json(
  {
    orderId,
    total,
    status: "pending",
  },
  201,
);
```

### Error Handling

```typescript
try {
  const handler = await route(requestData);
  const body = await handler.validateBody();

  // Process request...

  return await handler.json(responseData, 200);
} catch (error) {
  if (error instanceof CommerceSdkValidationError) {
    // Validation failed
    const handler = await route({});
    return await handler.error(
      {
        error: "validation_error",
        message: "Invalid request data",
        errors: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      400,
    );
  }

  // Other errors
  const handler = await route({});
  return await handler.error(
    {
      error: "internal_server_error",
      message: "An unexpected error occurred",
    },
    500,
  );
}
```

### Headers Example

Request and response headers can be validated for enhanced API security and functionality.

```typescript
const protectedApiHandler = openapi(
  {
    path: "/api/protected",
    method: "GET",
    request: {
      headers: v.object({
        authorization: v.pipe(v.string(), v.startsWith("Bearer ")),
        "x-api-key": v.string(),
        "x-request-id": v.optional(v.string()),
      }),
    },
    responses: {
      200: {
        schema: v.object({
          data: v.string(),
          requestId: v.optional(v.string()),
        }),
        headers: v.object({
          "X-RateLimit-Limit": v.string(),
          "X-RateLimit-Remaining": v.string(),
          "X-RateLimit-Reset": v.string(),
        }),
      },
      401: v.object({
        error: v.literal("unauthorized"),
        message: v.string(),
      }),
    },
  },
  async (c) => {
    try {
      // Validate request headers
      const headers = await c.validateHeaders();

      // Verify authorization token
      if (headers.authorization !== "Bearer valid-token") {
        return c.error(
          {
            error: "unauthorized",
            message: "Invalid authorization token",
          },
          401,
        );
      }

      // Return success with response headers
      return c.json(
        {
          data: "Protected resource data",
          requestId: headers["x-request-id"],
        },
        200,
        {
          "X-RateLimit-Limit": "1000",
          "X-RateLimit-Remaining": "999",
          "X-RateLimit-Reset": "1640995200",
        },
      );
    } catch (_error) {
      return c.error(
        {
          error: "unauthorized",
          message: "Missing or invalid headers",
        },
        401,
      );
    }
  },
);
```

### Query Parameters Example

Query parameters can be validated for search, filtering, and pagination functionality.

```typescript
const searchApiHandler = openapi(
  {
    path: "/api/products/search",
    method: "GET",
    request: {
      query: v.object({
        q: v.string(),
        category: v.optional(v.string()),
        minPrice: v.optional(v.pipe(v.string(), v.transform(Number))),
        maxPrice: v.optional(v.pipe(v.string(), v.transform(Number))),
        limit: v.optional(
          v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
        ),
        offset: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
        sortBy: v.optional(v.picklist(["name", "price", "date"])),
        sortOrder: v.optional(v.picklist(["asc", "desc"])),
      }),
    },
    responses: {
      200: v.object({
        results: v.array(
          v.object({
            id: v.string(),
            name: v.string(),
            price: v.number(),
            category: v.string(),
          }),
        ),
        total: v.number(),
        pagination: v.object({
          limit: v.number(),
          offset: v.number(),
          hasMore: v.boolean(),
        }),
      }),
      400: v.object({
        error: v.literal("invalid_query"),
        message: v.string(),
      }),
    },
  },
  async (c) => {
    try {
      // Validate query parameters
      const query = await c.validateQuery();

      // Apply defaults
      const limit = query.limit || 20;
      const offset = query.offset || 0;
      const sortBy = query.sortBy || "name";
      const sortOrder = query.sortOrder || "asc";

      // Build search filters
      const filters = {
        searchTerm: query.q,
        category: query.category,
        priceRange: {
          min: query.minPrice,
          max: query.maxPrice,
        },
      };

      // Execute search with validation-processed parameters
      const searchResults = await searchProducts(filters, {
        limit,
        offset,
        sortBy,
        sortOrder,
      });

      return c.json(
        {
          results: searchResults.items,
          total: searchResults.totalCount,
          pagination: {
            limit,
            offset,
            hasMore: offset + limit < searchResults.totalCount,
          },
        },
        200,
      );
    } catch (_error) {
      return c.error(
        {
          error: "invalid_query",
          message: "Invalid search parameters",
        },
        400,
      );
    }
  },
);

// Usage examples:
// GET /api/products/search?q=laptop&category=electronics&limit=10
// GET /api/products/search?q=phone&minPrice=100&maxPrice=500&sortBy=price&sortOrder=asc
```

### Multiple Response Types

```typescript
const searchRoute = createRoute({
  path: "/products/search",
  method: "GET",
  request: {
    params: v.object({
      query: v.string(),
      limit: v.optional(v.number()),
    }),
  },
  responses: {
    200: v.object({
      results: v.array(
        v.object({
          id: v.string(),
          name: v.string(),
          price: v.number(),
        }),
      ),
      total: v.number(),
    }),
    400: v.object({
      error: v.string(),
      message: v.string(),
    }),
    429: v.object({
      error: v.literal("rate_limit_exceeded"),
      message: v.string(),
      retryAfter: v.number(),
    }),
  },
});

// Different responses based on conditions
if (rateLimitExceeded) {
  return await handler.error(
    {
      error: "rate_limit_exceeded",
      message: "Too many requests",
      retryAfter: 60,
    },
    429,
  );
}

if (!validQuery) {
  return await handler.error(
    {
      error: "invalid_query",
      message: "Search query is invalid",
    },
    400,
  );
}

return await handler.json(
  {
    results: searchResults,
    total: totalCount,
  },
  200,
);
```

## Type Safety

The library provides full type safety throughout:

```typescript
const route = createRoute({
  path: "/products/{id}",
  method: "GET",
  request: {
    params: v.object({
      id: v.string(),
    }),
  },
  responses: {
    200: v.object({
      id: v.string(),
      name: v.string(),
      price: v.number(),
    }),
  },
});

const handler = await route({ id: "123" });

// ✅ TypeScript knows this is valid
await handler.json(
  {
    id: "123",
    name: "Product",
    price: 99.99,
  },
  200,
);

// ❌ TypeScript error: missing required properties
await handler.json(
  {
    id: "123",
  },
  200,
);

// ❌ TypeScript error: wrong type for price
await handler.json(
  {
    id: "123",
    name: "Product",
    price: "not a number",
  },
  200,
);

// ❌ Runtime error: no schema defined for status 201
await handler.json(
  {
    id: "123",
    name: "Product",
    price: 99.99,
  },
  201,
);
```

## Integration with Adobe App Builder

This library is designed to work seamlessly with Adobe App Builder actions:

```typescript
import { createRoute } from "@adobe/aio-commerce-lib-openapi";
import * as v from "valibot";

const route = createRoute({
  path: "/openapi/products/{id}",
  method: "GET",
  request: {
    params: v.object({
      id: v.string(),
    }),
  },
  responses: {
    200: v.object({
      id: v.string(),
      name: v.string(),
      price: v.number(),
    }),
    404: v.object({
      error: v.string(),
      message: v.string(),
    }),
  },
});

async function main(params) {
  const handler = await route(params);

  try {
    const { id } = await handler.validateParams();
    const product = await getProductById(id);

    if (!product) {
      return handler.error(
        {
          error: "not_found",
          message: `Product ${id} not found`,
        },
        404,
      );
    }

    return handler.json(product, 200);
  } catch (error) {
    return handler.error(
      {
        error: "internal_error",
        message: "Failed to fetch product",
      },
      500,
    );
  }
}

exports.main = main;
```

## License

Apache-2.0
