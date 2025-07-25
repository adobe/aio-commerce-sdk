import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { createRoute } from "~/index";

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
