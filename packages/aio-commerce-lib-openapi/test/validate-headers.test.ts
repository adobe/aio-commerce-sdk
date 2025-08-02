import * as v from "valibot";
import { describe, expect, it } from "vitest";

import { createRoute } from "~/index";

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
