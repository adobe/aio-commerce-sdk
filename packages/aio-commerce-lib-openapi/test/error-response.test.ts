import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { createRoute } from "~/index";
import { omitType } from "./test-utils";

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

    expect(omitType(notFoundResponse)).toEqual({
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

    expect(omitType(serverErrorResponse)).toEqual({
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

    expect(omitType(response)).toEqual({
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

    expect(omitType(validationErrorResponse)).toEqual({
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

  it("should validate error response headers when provided", async () => {
    const route = createRoute({
      path: "/api/resources",
      method: "GET",
      request: {},
      responses: {
        429: {
          schema: v.object({
            error: v.literal("rate_limit_exceeded"),
            message: v.string(),
            retryAfter: v.number(),
          }),
          headers: v.object({
            "X-RateLimit-Limit": v.string(),
            "X-RateLimit-Remaining": v.string(),
            "X-RateLimit-Reset": v.string(),
            "Retry-After": v.optional(v.string()),
          }),
        },
        500: {
          schema: v.object({
            error: v.literal("internal_error"),
            message: v.string(),
            requestId: v.string(),
          }),
          headers: v.object({
            "X-Request-ID": v.string(),
            "X-Error-Code": v.string(),
          }),
        },
      },
    });

    const handler = route({});

    // Test 429 rate limit error with headers
    const rateLimitResponse = await handler.error(
      {
        error: "rate_limit_exceeded",
        message: "Too many requests",
        retryAfter: 60,
      },
      429,
      {
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": "1640995200",
        "Retry-After": "60",
      },
    );

    expect(omitType(rateLimitResponse)).toEqual({
      error: {
        statusCode: 429,
        body: {
          error: "rate_limit_exceeded",
          message: "Too many requests",
          retryAfter: 60,
        },
        headers: {
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": "1640995200",
          "Retry-After": "60",
        },
      },
    });

    // Test 500 internal error with headers
    const internalErrorResponse = await handler.error(
      {
        error: "internal_error",
        message: "Database connection failed",
        requestId: "req-123",
      },
      500,
      {
        "X-Request-ID": "req-123",
        "X-Error-Code": "DB_CONNECTION_FAILED",
      },
    );

    expect(omitType(internalErrorResponse)).toEqual({
      error: {
        statusCode: 500,
        body: {
          error: "internal_error",
          message: "Database connection failed",
          requestId: "req-123",
        },
        headers: {
          "X-Request-ID": "req-123",
          "X-Error-Code": "DB_CONNECTION_FAILED",
        },
      },
    });
  });

  it("should throw validation error for invalid error response headers", async () => {
    const route = createRoute({
      path: "/api/resources",
      method: "POST",
      request: {},
      responses: {
        400: {
          schema: v.object({
            error: v.literal("bad_request"),
            message: v.string(),
          }),
          headers: v.object({
            "X-Error-Code": v.string(),
            "X-Validation-Count": v.number(),
          }),
        },
      },
    });

    const handler = route({});

    // Test with invalid header type
    await expect(
      handler.error(
        {
          error: "bad_request",
          message: "Invalid request format",
        },
        400,
        {
          "X-Error-Code": "INVALID_FORMAT",
          "X-Validation-Count": "not-a-number", // Should be number
        } as unknown as Parameters<typeof handler.error>[2],
      ),
    ).rejects.toThrow(
      "Invalid error headers for route /api/resources with status 400",
    );

    // Test with missing required header
    await expect(
      handler.error(
        {
          error: "bad_request",
          message: "Invalid request format",
        },
        400,
        {
          "X-Error-Code": "INVALID_FORMAT",
        } as unknown as Parameters<typeof handler.error>[2],
      ),
    ).rejects.toThrow(
      "Invalid error headers for route /api/resources with status 400",
    );
  });

  it("should work without headers when headers schema is not defined", async () => {
    const route = createRoute({
      path: "/api/simple",
      method: "GET",
      request: {},
      responses: {
        404: {
          schema: v.object({
            error: v.literal("not_found"),
            message: v.string(),
          }),
          // No headers schema defined
        },
      },
    });

    const handler = route({});

    // Should work without headers
    const response = await handler.error(
      {
        error: "not_found",
        message: "Resource not found",
      },
      404,
    );

    expect(omitType(response)).toEqual({
      error: {
        statusCode: 404,
        body: {
          error: "not_found",
          message: "Resource not found",
        },
      },
    });

    const responseWithIgnoredHeaders = await handler.error(
      {
        error: "not_found",
        message: "Resource not found",
      },
      404,
      {
        "X-Custom-Header": "ignored",
      } as unknown as Parameters<typeof handler.error>[2],
    );

    expect(omitType(responseWithIgnoredHeaders)).toEqual({
      error: {
        statusCode: 404,
        body: {
          error: "not_found",
          message: "Resource not found",
        },
      },
    });
  });
});
