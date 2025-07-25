import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { openapi } from "~/index";

describe("openapi", () => {
  it("should create a handler function that uses the provided handler", async () => {
    const routeDefinition = {
      path: "/products/{id}",
      method: "GET" as const,
      request: {
        params: v.object({
          id: v.string(),
        }),
      },
      responses: {
        200: {
          schema: v.object({
            id: v.string(),
            name: v.string(),
            price: v.number(),
          }),
        },
        404: {
          schema: v.object({
            error: v.string(),
            message: v.string(),
          }),
        },
      },
    };

    const handler = openapi(routeDefinition, async (spec) => {
      const params = await spec.validateParams();

      if (params.id === "999") {
        return spec.error(
          {
            error: "not_found",
            message: "Product not found",
          },
          404,
        );
      }

      return spec.json(
        {
          id: params.id,
          name: "Test Product",
          price: 29.99,
        },
        200,
      );
    });

    // Test successful response
    const successResult = await handler({ id: "123" });
    expect(successResult).toEqual({
      statusCode: 200,
      body: {
        id: "123",
        name: "Test Product",
        price: 29.99,
      },
    });

    // Test error response
    const errorResult = await handler({ id: "999" });
    expect(errorResult).toEqual({
      error: {
        statusCode: 404,
        body: {
          error: "not_found",
          message: "Product not found",
        },
      },
    });
  });

  it("should handle validation errors in openapi handler", async () => {
    const routeDefinition = {
      path: "/products",
      method: "POST" as const,
      request: {
        body: {
          schema: v.object({
            name: v.string(),
            price: v.number(),
          }),
        },
      },
      responses: {
        201: {
          schema: v.object({
            id: v.string(),
            name: v.string(),
            price: v.number(),
          }),
        },
        400: {
          schema: v.object({
            error: v.string(),
            message: v.string(),
          }),
        },
      },
    };

    const handler = openapi(routeDefinition, async (c) => {
      try {
        const body = await c.validateBody();
        return c.json(
          {
            id: "new-123",
            name: body.name,
            price: body.price,
          },
          201,
        );
      } catch (_error) {
        return c.error(
          {
            error: "validation_error",
            message: "Invalid request body",
          },
          400,
        );
      }
    });

    // Test with valid data
    const successResult = await handler({
      name: "New Product",
      price: 49.99,
    });
    expect(successResult).toEqual({
      statusCode: 201,
      body: {
        id: "new-123",
        name: "New Product",
        price: 49.99,
      },
    });

    // Test with invalid data
    const errorResult = await handler({ name: "Missing Price" });
    expect(errorResult).toEqual({
      error: {
        statusCode: 400,
        body: {
          error: "validation_error",
          message: "Invalid request body",
        },
      },
    });
  });

  it("should work with complex business logic", async () => {
    const routeDefinition = {
      path: "/orders/{orderId}/cancel",
      method: "POST" as const,
      request: {
        params: v.object({
          orderId: v.string(),
        }),
        body: {
          schema: v.object({
            reason: v.string(),
            notifyCustomer: v.boolean(),
          }),
        },
      },
      responses: {
        200: {
          schema: v.object({
            orderId: v.string(),
            status: v.literal("cancelled"),
            cancelledAt: v.string(),
          }),
        },
        400: {
          schema: v.object({
            error: v.literal("invalid_state"),
            message: v.string(),
          }),
        },
        404: {
          schema: v.object({
            error: v.literal("not_found"),
            message: v.string(),
          }),
        },
      },
    };

    // Mock order database
    const orders = {
      "order-123": { status: "pending" },
      "order-456": { status: "shipped" },
    };

    const handler = openapi(routeDefinition, async (c) => {
      const params = await c.validateParams();

      const order = orders[params.orderId as keyof typeof orders];

      if (!order) {
        return c.error(
          {
            error: "not_found",
            message: `Order ${params.orderId} not found`,
          },
          404,
        );
      }

      if (order.status !== "pending") {
        return c.error(
          {
            error: "invalid_state",
            message: `Cannot cancel order in ${order.status} state`,
          },
          400,
        );
      }

      return c.json(
        {
          orderId: params.orderId,
          status: "cancelled",
          cancelledAt: new Date().toISOString(),
        },
        200,
      );
    });

    // Test successful cancellation
    const successResult = await handler({
      orderId: "order-123",
      reason: "Customer request",
      notifyCustomer: true,
    });

    expect(successResult).toHaveProperty("statusCode", 200);
    expect(successResult).toHaveProperty("body.status", "cancelled");

    // Test order not found
    const notFoundResult = await handler({
      orderId: "order-999",
      reason: "Test",
      notifyCustomer: false,
    });

    expect(notFoundResult).toEqual({
      error: {
        statusCode: 404,
        body: {
          error: "not_found",
          message: "Order order-999 not found",
        },
      },
    });

    // Test invalid state
    const invalidStateResult = await handler({
      orderId: "order-456",
      reason: "Test",
      notifyCustomer: false,
    });

    expect(invalidStateResult).toEqual({
      error: {
        statusCode: 400,
        body: {
          error: "invalid_state",
          message: "Cannot cancel order in shipped state",
        },
      },
    });
  });

  it("should validate headers in openapi handler", async () => {
    const routeDefinition = {
      path: "/api/protected",
      method: "GET" as const,
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
        },
        401: {
          schema: v.object({
            error: v.literal("unauthorized"),
            message: v.string(),
          }),
        },
      },
    };

    const handler = openapi(routeDefinition, async (c) => {
      try {
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

        // Return success with optional request ID if provided
        return c.json(
          {
            data: "Protected resource data",
            requestId: headers["x-request-id"],
          },
          200,
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
    });

    // Test with valid headers
    const successResult = await handler({
      authorization: "Bearer valid-token",
      "x-api-key": "test-api-key",
      "x-request-id": "req-123",
    });

    expect(successResult).toEqual({
      statusCode: 200,
      body: {
        data: "Protected resource data",
        requestId: "req-123",
      },
    });

    // Test with invalid authorization
    const invalidAuthResult = await handler({
      authorization: "Bearer invalid-token",
      "x-api-key": "test-api-key",
    });
    expect(invalidAuthResult).toEqual({
      error: {
        statusCode: 401,
        body: {
          error: "unauthorized",
          message: "Invalid authorization token",
        },
      },
    });

    // Test with missing required headers
    const missingHeadersResult = await handler({
      authorization: "Bearer valid-token",
      // missing x-api-key
    });
    expect(missingHeadersResult).toEqual({
      error: {
        statusCode: 401,
        body: {
          error: "unauthorized",
          message: "Missing or invalid headers",
        },
      },
    });

    // Test with malformed authorization header
    const malformedAuthResult = await handler({
      authorization: "InvalidFormat token",
      "x-api-key": "test-api-key",
    });
    expect(malformedAuthResult).toEqual({
      error: {
        statusCode: 401,
        body: {
          error: "unauthorized",
          message: "Missing or invalid headers",
        },
      },
    });
  });

  it("should validate query parameters in openapi handler", async () => {
    const routeDefinition = {
      path: "/api/search",
      method: "GET" as const,
      request: {
        query: v.object({
          q: v.string(),
          category: v.optional(v.string()),
          limit: v.optional(
            v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
          ),
          offset: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
        }),
      },
      responses: {
        200: {
          schema: v.object({
            results: v.array(
              v.object({
                id: v.string(),
                title: v.string(),
                category: v.string(),
              }),
            ),
            total: v.number(),
            query: v.string(),
          }),
          headers: v.object({
            "X-Total-Count": v.string(),
            "X-Page": v.number(),
          }),
        },
        400: {
          schema: v.object({
            error: v.string(),
            message: v.string(),
          }),
        },
      },
    };

    const handler = openapi(routeDefinition, async (c) => {
      try {
        const query = await c.validateQuery();

        // Mock search results based on query
        const mockResults = [
          {
            id: "1",
            title: "Product 1",
            category: query.category || "general",
          },
          {
            id: "2",
            title: "Product 2",
            category: query.category || "general",
          },
        ];

        const limit = query.limit || 10;
        const offset = query.offset || 0;
        const paginatedResults = mockResults.slice(offset, offset + limit);

        return c.json(
          {
            results: paginatedResults,
            total: mockResults.length,
            query: query.q,
          },
          200,
          {
            "X-Total-Count": "100",
            "X-Page": 1,
          },
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
    });

    // Test with valid query parameters
    const successResult = await handler({
      q: "test search",
      category: "electronics",
      limit: 5,
      offset: 0,
    });

    expect(successResult).toEqual({
      statusCode: 200,
      body: {
        results: [
          { id: "1", title: "Product 1", category: "electronics" },
          { id: "2", title: "Product 2", category: "electronics" },
        ],
        total: 2,
        query: "test search",
      },
      headers: {
        "X-Page": 1,
        "X-Total-Count": "100",
      },
    });

    // Test with minimal query (only required parameter)
    const minimalResult = await handler({
      q: "minimal search",
    });

    expect(minimalResult).toEqual({
      statusCode: 200,
      body: {
        results: [
          { id: "1", title: "Product 1", category: "general" },
          { id: "2", title: "Product 2", category: "general" },
        ],
        total: 2,
        query: "minimal search",
      },
      headers: {
        "X-Page": 1,
        "X-Total-Count": "100",
      },
    });

    // Test with invalid limit (exceeds maximum)
    const invalidLimitResult = await handler({
      q: "test",
      limit: 200,
    });
    expect(invalidLimitResult).toEqual({
      error: {
        statusCode: 400,
        body: {
          error: "invalid_query",
          message: "Invalid search parameters",
        },
      },
    });

    // Test with missing required query parameter
    const missingQueryResult = await handler({
      category: "electronics",
    });
    expect(missingQueryResult).toEqual({
      error: {
        statusCode: 400,
        body: {
          error: "invalid_query",
          message: "Invalid search parameters",
        },
      },
    });
  });
});
