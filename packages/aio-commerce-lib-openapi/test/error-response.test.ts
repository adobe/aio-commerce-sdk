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
});
