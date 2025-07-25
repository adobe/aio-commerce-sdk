import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { createRoute } from "~/index";

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
