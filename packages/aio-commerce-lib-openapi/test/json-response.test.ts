import * as v from "valibot";
import { describe, expect, it } from "vitest";

import { createRoute } from "~/index";

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
    const errorResponse = await handler.error(
      {
        error: "not_found",
        message: "Stock item not found",
      },
      404,
    );

    expect(errorResponse).toEqual({
      error: {
        statusCode: 404,
        body: {
          error: "not_found",
          message: "Stock item not found",
        },
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
      "Invalid response for route [GET] /stock/{id} with status 200",
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
      "Invalid response for route [GET] /stock/{id} with status 200",
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
      "Invalid response for route [GET] /stock/{id} with status 200",
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
      // @ts-expect-error - Testing invalid status code scenario
      handler.json({ data: "test" }),
    ).rejects.toThrow(
      "No valid response schema defined for status 404 in route /stock/{id}",
    );
  });

  it("should handle explicit status code 200", async () => {
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

    // Explicitly specify status 200
    const response = await handler.json({ data: "test" }, 200);

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
