import * as v from "valibot";
import { describe, expect, it } from "vitest";

import { createJsonHandler, createSubRoute, json } from "~/json";

describe("aio-commerce-lib-openapi/json", () => {
  describe("exports", () => {
    it("should export createRoute function", () => {
      expect(createJsonHandler).toBeDefined();
      expect(typeof createJsonHandler).toBe("function");

      expect(json).toBeDefined();
      expect(typeof json).toBe("function");
    });
  });

  const args = [
    "GET",
    "/test",
    200,
    {
      schema: v.object({
        message: v.string(),
      }),
    },
  ] as const;

  describe("exports route", () => {
    it("should create a typesafe route", () => {
      const ok = createJsonHandler(createSubRoute(...args));

      expect(ok).toBeDefined();
      expect(typeof ok).toBe("function");
    });

    it("should create a handler that only accepts the schema defined ", async () => {
      const schema = {
        schema: v.object({
          message: v.string(),
        }),
        headers: v.object({
          "X-Custom-Header": v.string(),
        }),
      };

      const ok = createJsonHandler(createSubRoute("GET", "/test", 200, schema));

      const result = await ok(
        { message: "OK" },
        {
          "X-Custom-Header": "CustomValue",
        },
      );
      expect(result).toEqual({
        statusCode: 200,
        body: {
          message: "OK",
        },
        headers: {
          "X-Custom-Header": "CustomValue",
        },
      });
    });
  });
});
