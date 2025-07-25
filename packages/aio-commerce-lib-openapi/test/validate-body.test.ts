import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { createRoute } from "~/index";

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
