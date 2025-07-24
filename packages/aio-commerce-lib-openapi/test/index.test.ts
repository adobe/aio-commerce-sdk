import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { createRoute, isSuccessResponse, openapi } from "~/index";

describe("aio-commerce-lib-openapi", () => {
  it("should be defined", () => {
    expect(createRoute).toBeDefined();
  });

  describe("validateParams", () => {
    it("should validate params successfully when valid data is provided", async () => {
      const route = createRoute({
        path: "/stock/{id}",
        method: "GET",
        request: {
          params: v.object({
            id: v.string(),
          }),
        },
        responses: {
          200: {
            schema: v.object({
              data: v.string(),
            }),
          },
        },
      });

      const handler = route({ id: "123" });
      const params = await handler.validateParams();

      expect(params).toEqual({ id: "123" });
    });

    it("should throw an error when params are invalid", async () => {
      const route = createRoute({
        path: "/stock/{id}",
        method: "GET",
        request: {
          params: v.object({
            id: v.string(),
          }),
        },
        responses: {
          200: {
            schema: v.object({
              data: v.string(),
            }),
          },
        },
      });

      const handler = route({ id: 123 }); // number instead of string
      await expect(handler.validateParams()).rejects.toThrow(
        "Invalid params for route /stock/{id}",
      );
    });

    it("should throw an error when no params schema is defined", async () => {
      const route = createRoute({
        path: "/stock",
        method: "GET",
        request: {},
        responses: {
          200: {
            schema: v.object({
              data: v.string(),
            }),
          },
        },
      });

      const handler = route({});
      await expect(handler.validateParams()).rejects.toThrow(
        "No params schema defined for route /stock",
      );
    });
  });

  describe("validateBody", () => {
    it("should validate body successfully when valid data is provided", async () => {
      const route = createRoute({
        path: "/stock",
        method: "POST",
        request: {
          body: {
            schema: v.object({
              id: v.string(),
              name: v.string(),
              price: v.number(),
              inStock: v.boolean(),
            }),
          },
        },
        responses: {
          201: {
            schema: v.object({
              id: v.string(),
            }),
          },
        },
      });

      const validInput = {
        id: "123",
        name: "Product",
        price: 99.99,
        inStock: true,
      };

      const handler = route(validInput);
      const body = await handler.validateBody();

      expect(body).toEqual(validInput);
    });

    it("should throw an error when body is invalid", async () => {
      const route = createRoute({
        path: "/stock",
        method: "POST",
        request: {
          body: {
            schema: v.object({
              id: v.string(),
              name: v.string(),
              price: v.number(),
              inStock: v.boolean(),
            }),
          },
        },
        responses: {
          201: {
            schema: v.object({
              id: v.string(),
            }),
          },
        },
      });

      const handler = route({ id: "123" }); // missing required fields
      await expect(handler.validateBody()).rejects.toThrow(
        "Invalid request body for route /stock",
      );
    });

    it("should throw an error when no body schema is defined", async () => {
      const route = createRoute({
        path: "/stock",
        method: "GET",
        request: {},
        responses: {
          200: {
            schema: v.object({
              data: v.string(),
            }),
          },
        },
      });

      const handler = route({});
      await expect(handler.validateBody()).rejects.toThrow(
        "No body schema defined for route /stock",
      );
    });
  });

  describe("validateHeaders", () => {
    it("should validate headers successfully when valid data is provided", async () => {
      const route = createRoute({
        path: "/api/data",
        method: "GET",
        request: {
          headers: v.object({
            authorization: v.string(),
            "x-api-key": v.string(),
          }),
        },
        responses: {
          200: {
            schema: v.object({
              data: v.string(),
            }),
          },
        },
      });

      const handler = route({
        authorization: "Bearer token123",
        "x-api-key": "secret-key",
      });
      const headers = await handler.validateHeaders();

      expect(headers).toEqual({
        authorization: "Bearer token123",
        "x-api-key": "secret-key",
      });
    });

    it("should throw an error when headers are invalid", async () => {
      const route = createRoute({
        path: "/api/data",
        method: "GET",
        request: {
          headers: v.object({
            authorization: v.string(),
            "x-api-key": v.string(),
          }),
        },
        responses: {
          200: {
            schema: v.object({
              data: v.string(),
            }),
          },
        },
      });

      const handler = route({
        authorization: "Bearer token123",
        // missing x-api-key
      });
      await expect(handler.validateHeaders()).rejects.toThrow(
        "Invalid headers for route /api/data",
      );
    });

    it("should throw an error when no headers schema is defined", async () => {
      const route = createRoute({
        path: "/api/data",
        method: "GET",
        request: {},
        responses: {
          200: {
            schema: v.object({
              data: v.string(),
            }),
          },
        },
      });

      const handler = route({});
      await expect(handler.validateHeaders()).rejects.toThrow(
        "No headers schema defined for route /api/data",
      );
    });

    it("should validate complex header schemas", async () => {
      const route = createRoute({
        path: "/api/secure",
        method: "POST",
        request: {
          headers: v.object({
            authorization: v.pipe(v.string(), v.startsWith("Bearer ")),
            "content-type": v.literal("application/json"),
            "x-request-id": v.pipe(v.string(), v.uuid()),
            "x-api-version": v.optional(v.string()),
          }),
        },
        responses: {
          200: {
            schema: v.object({
              success: v.boolean(),
            }),
          },
        },
      });

      const validHeaders = {
        authorization: "Bearer valid-token",
        "content-type": "application/json",
        "x-request-id": "550e8400-e29b-41d4-a716-446655440000",
        "x-api-version": "v2",
      };

      const handler = route(validHeaders);
      const headers = await handler.validateHeaders();

      expect(headers).toEqual(validHeaders);

      // Test with invalid authorization format
      const invalidHandler = route({
        authorization: "Invalid format",
        "content-type": "application/json",
        "x-request-id": "550e8400-e29b-41d4-a716-446655440000",
      });
      await expect(invalidHandler.validateHeaders()).rejects.toThrow();
    });
  });

  describe("validateQuery", () => {
    it("should validate query parameters successfully when valid data is provided", async () => {
      const route = createRoute({
        path: "/api/search",
        method: "GET",
        request: {
          query: v.object({
            q: v.string(),
            limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
            offset: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
          }),
        },
        responses: {
          200: {
            schema: v.object({
              results: v.array(v.string()),
              total: v.number(),
            }),
          },
        },
      });

      const handler = route({
        q: "search term",
        limit: 10,
        offset: 0,
      });
      const query = await handler.validateQuery();

      expect(query).toEqual({
        q: "search term",
        limit: 10,
        offset: 0,
      });
    });

    it("should throw an error when query parameters are invalid", async () => {
      const route = createRoute({
        path: "/api/search",
        method: "GET",
        request: {
          query: v.object({
            q: v.string(),
            limit: v.pipe(v.number(), v.integer(), v.minValue(1)),
          }),
        },
        responses: {
          200: {
            schema: v.object({
              results: v.array(v.string()),
            }),
          },
        },
      });

      const handler = route({
        q: "search term",
        limit: 0, // violates minValue(1)
      });
      await expect(handler.validateQuery()).rejects.toThrow(
        "Invalid query for route /api/search",
      );
    });

    it("should throw an error when no query schema is defined", async () => {
      const route = createRoute({
        path: "/api/simple",
        method: "GET",
        request: {},
        responses: {
          200: {
            schema: v.object({
              data: v.string(),
            }),
          },
        },
      });

      const handler = route({});
      await expect(handler.validateQuery()).rejects.toThrow(
        "No query schema defined for route /api/simple",
      );
    });

    it("should validate complex query schemas with transformations", async () => {
      const route = createRoute({
        path: "/api/products",
        method: "GET",
        request: {
          query: v.object({
            category: v.string(),
            minPrice: v.optional(v.pipe(v.string(), v.transform(Number))),
            maxPrice: v.optional(v.pipe(v.string(), v.transform(Number))),
            sortBy: v.optional(v.picklist(["name", "price", "date"])),
            sortOrder: v.optional(v.picklist(["asc", "desc"])),
          }),
        },
        responses: {
          200: {
            schema: v.object({
              products: v.array(v.object({ id: v.string(), name: v.string() })),
            }),
          },
        },
      });

      const validQuery = {
        category: "electronics",
        minPrice: "100",
        maxPrice: "500",
        sortBy: "price",
        sortOrder: "asc",
      };

      const handler = route(validQuery);
      const query = await handler.validateQuery();

      expect(query).toEqual({
        category: "electronics",
        minPrice: 100, // transformed to number
        maxPrice: 500, // transformed to number
        sortBy: "price",
        sortOrder: "asc",
      });

      // Test with invalid sortBy value
      const invalidHandler = route({
        category: "electronics",
        sortBy: "invalid-sort",
      });
      await expect(invalidHandler.validateQuery()).rejects.toThrow();
    });
  });

  describe("json", () => {
    it("should return expected response bodies for different status codes", async () => {
      const route = createRoute({
        path: "/stock/{id}",
        method: "GET",
        request: {
          body: {
            schema: v.object({
              id: v.string(),
            }),
          },
        },
        responses: {
          200: {
            schema: v.object({
              id: v.string(),
              name: v.string(),
              price: v.number(),
              inStock: v.boolean(),
            }),
          },
          404: {
            schema: v.object({
              error: v.string(),
              message: v.string(),
            }),
          },
        },
      });

      const handler = route({ id: "123" });

      // Test 200 response
      const successResponse = await handler.json(
        {
          id: "123",
          name: "Product",
          price: 99.99,
          inStock: true,
        },
        200,
      );

      expect(successResponse).toEqual({
        statusCode: 200,
        body: {
          id: "123",
          name: "Product",
          price: 99.99,
          inStock: true,
        },
      });

      // Test 404 response
      const errorResponse = await handler.json(
        {
          error: "not_found",
          message: "Stock item not found",
        },
        404,
      );

      expect(errorResponse).toEqual({
        statusCode: 404,
        body: {
          error: "not_found",
          message: "Stock item not found",
        },
      });
    });

    it("should throw an error when response body does not match expected schema", async () => {
      const OkResponseSchema = v.object({
        id: v.string(),
        name: v.string(),
        price: v.number(),
        inStock: v.boolean(),
      });

      const NotFoundResponseSchema = v.object({
        error: v.string(),
        message: v.string(),
      });

      const route = createRoute({
        path: "/stock/{id}",
        method: "GET",
        request: {
          body: {
            schema: v.object({
              id: v.string(),
              name: v.string(),
              price: v.number(),
              inStock: v.boolean(),
            }),
          },
        },
        responses: {
          200: {
            schema: OkResponseSchema,
          },
          404: {
            schema: NotFoundResponseSchema,
          },
        },
      });

      const handler = route({
        id: "123",
        name: "Product",
        price: 99.99,
        inStock: true,
      });

      // Missing required properties should throw error
      await expect(
        handler.json(
          { id: "123" } as unknown as v.InferInput<typeof OkResponseSchema>,
          200,
        ),
      ).rejects.toThrow(
        "Invalid response for route /stock/{id} with status 200",
      );

      // Wrong type for a property should throw error
      await expect(
        handler.json(
          {
            id: "123",
            name: "Product",
            price: "not a number",
            inStock: true,
          } as unknown as v.InferInput<typeof OkResponseSchema>,
          200,
        ),
      ).rejects.toThrow(
        "Invalid response for route /stock/{id} with status 200",
      );

      // Extra properties are allowed by default in valibot, but wrong status code should throw
      await expect(
        handler.json(
          {
            error: "not_found",
            message: "Stock item not found",
          } as unknown as v.InferInput<typeof OkResponseSchema>,
          200,
        ),
      ).rejects.toThrow(
        "Invalid response for route /stock/{id} with status 200",
      );
    });

    it("should throw an error when no response schema is defined for status", async () => {
      const route = createRoute({
        path: "/stock/{id}",
        method: "GET",
        request: {
          body: {
            schema: v.object({
              id: v.string(),
            }),
          },
        },
        responses: {
          200: {
            schema: v.object({
              data: v.string(),
            }),
          },
        },
      });

      const handler = route({ id: "123" });

      // Trying to use undefined status code
      await expect(
        handler.json(
          { data: "test" },
          404 as unknown as Parameters<typeof handler.json>[1],
        ),
      ).rejects.toThrow("No response schema defined for status 404");
    });

    it("should use default status code 200 when not specified", async () => {
      const route = createRoute({
        path: "/stock",
        method: "GET",
        request: {},
        responses: {
          200: {
            schema: v.object({
              data: v.string(),
            }),
          },
        },
      });

      const handler = route({});

      // Should default to status 200
      const response = await handler.json({ data: "test" });

      expect(response).toEqual({
        statusCode: 200,
        body: {
          data: "test",
        },
      });
    });

    it("should validate and return headers when provided", async () => {
      const HeaderSchema = v.object({
        "X-Total-Count": v.string(),
        "X-Page": v.number(),
      });

      const route = createRoute({
        path: "/api/data",
        method: "GET",
        request: {},
        responses: {
          200: {
            schema: v.object({
              data: v.string(),
            }),
            headers: HeaderSchema,
          },
        },
      });

      const handler = route({});

      // Test with valid headers
      const response = await handler.json({ data: "test" }, 200, {
        "X-Total-Count": "100",
        "X-Page": 1,
      });

      expect(response).toEqual({
        statusCode: 200,
        body: {
          data: "test",
        },
        headers: {
          "X-Total-Count": "100",
          "X-Page": 1,
        },
      });
    });

    it("should work without headers when headers schema is not defined", async () => {
      const route = createRoute({
        path: "/api/simple",
        method: "GET",
        request: {},
        responses: {
          200: {
            schema: v.object({
              data: v.string(),
            }),
          },
        },
      });

      const handler = route({});

      // Test without headers (should work fine)
      const response = await handler.json({ data: "test" }, 200);

      expect(response).toEqual({
        statusCode: 200,
        body: {
          data: "test",
        },
      });

      // Ensure headers property is not present
      expect(response).not.toHaveProperty("headers");
    });
  });

  describe("error", () => {
    it("should return expected error response bodies for different status codes", async () => {
      const route = createRoute({
        path: "/stock/{id}",
        method: "GET",
        request: {
          params: v.object({
            id: v.string(),
          }),
        },
        responses: {
          404: {
            schema: v.object({
              error: v.string(),
              message: v.string(),
            }),
          },
          500: {
            schema: v.object({
              error: v.string(),
              message: v.string(),
              stackTrace: v.optional(v.string()),
            }),
          },
        },
      });

      const handler = route({ id: "123" });

      // Test 404 error response
      const notFoundResponse = await handler.error(
        {
          error: "not_found",
          message: "Stock item not found",
        },
        404,
      );

      expect(notFoundResponse).toEqual({
        error: {
          statusCode: 404,
          body: {
            error: "not_found",
            message: "Stock item not found",
          },
        },
      });

      // Test 500 error response
      const serverErrorResponse = await handler.error(
        {
          error: "internal_server_error",
          message: "Database connection failed",
          stackTrace: "Error at line 42",
        },
        500,
      );

      expect(serverErrorResponse).toEqual({
        error: {
          statusCode: 500,
          body: {
            error: "internal_server_error",
            message: "Database connection failed",
            stackTrace: "Error at line 42",
          },
        },
      });
    });

    it("should throw an error when error response body does not match expected schema", async () => {
      const BadRequestResponseSchema = v.object({
        error: v.string(),
        message: v.string(),
        field: v.string(),
      });

      const InternalServerErrorResponseSchema = v.object({
        error: v.string(),
        message: v.string(),
      });

      const route = createRoute({
        path: "/stock/{id}",
        method: "GET",
        request: {},
        responses: {
          400: {
            schema: BadRequestResponseSchema,
          },
          500: {
            schema: InternalServerErrorResponseSchema,
          },
        },
      });

      const handler = route({});

      // Missing required field should throw error
      await expect(
        handler.error(
          {
            error: "validation_error",
            message: "Invalid input",
            // missing 'field' property
          } as unknown as v.InferInput<typeof BadRequestResponseSchema>,
          400,
        ),
      ).rejects.toThrow(
        "Invalid error response for route /stock/{id} with status 400",
      );

      // Wrong type for a property should throw error
      await expect(
        handler.error(
          {
            error: "validation_error",
            message: 123, // should be string
            field: "price",
          } as unknown as v.InferInput<typeof BadRequestResponseSchema>,
          400,
        ),
      ).rejects.toThrow(
        "Invalid error response for route /stock/{id} with status 400",
      );
    });

    it("should throw an error when no error response schema is defined for status", async () => {
      const route = createRoute({
        path: "/stock/{id}",
        method: "GET",
        request: {},
        responses: {
          200: {
            schema: v.object({
              data: v.string(),
            }),
          },
          404: {
            schema: v.object({
              error: v.string(),
              message: v.string(),
            }),
          },
        },
      });

      const handler = route({});

      // Trying to use undefined error status code
      await expect(
        handler.error(
          {
            error: "bad_request",
            message: "Invalid request",
          },
          400 as unknown as Parameters<typeof handler.error>[1],
        ),
      ).rejects.toThrow("No response schema defined for status 400");
    });

    it("should use default status code 500 when not specified", async () => {
      const route = createRoute({
        path: "/stock",
        method: "POST",
        request: {},
        responses: {
          500: {
            schema: v.object({
              error: v.string(),
              message: v.string(),
            }),
          },
        },
      });

      const handler = route({});

      // Should default to status 500
      const response = await handler.error({
        error: "internal_error",
        message: "Something went wrong",
      });

      expect(response).toEqual({
        error: {
          statusCode: 500,
          body: {
            error: "internal_error",
            message: "Something went wrong",
          },
        },
      });
    });

    it("should validate error responses with complex schemas", async () => {
      const route = createRoute({
        path: "/openapi/products",
        method: "POST",
        request: {},
        responses: {
          422: {
            schema: v.object({
              error: v.literal("validation_error"),
              message: v.string(),
              errors: v.array(
                v.object({
                  field: v.string(),
                  message: v.string(),
                  code: v.string(),
                }),
              ),
            }),
          },
        },
      });

      const handler = route({});

      const validationErrorResponse = await handler.error(
        {
          error: "validation_error",
          message: "Validation failed",
          errors: [
            {
              field: "price",
              message: "Price must be greater than 0",
              code: "MIN_VALUE",
            },
            {
              field: "name",
              message: "Name is required",
              code: "REQUIRED",
            },
          ],
        },
        422,
      );

      expect(validationErrorResponse).toEqual({
        error: {
          statusCode: 422,
          body: {
            error: "validation_error",
            message: "Validation failed",
            errors: [
              {
                field: "price",
                message: "Price must be greater than 0",
                code: "MIN_VALUE",
              },
              {
                field: "name",
                message: "Name is required",
                code: "REQUIRED",
              },
            ],
          },
        },
      });
    });
  });

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
              error: v.literal("invalid_query"),
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
      });

      // Test with minimal query (only required parameter)
      const minimalResult = await handler({
        q: "minimal search",
      });

      if (isSuccessResponse(200, minimalResult)) {
        const _test = minimalResult.body.results;
      }
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
});
