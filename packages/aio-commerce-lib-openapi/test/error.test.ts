import * as v from "valibot";
import { describe, expect, it } from "vitest";

import { createErrorHandler, createErrorRoute, error } from "~/error";

describe("aio-commerce-lib-openapi/error", () => {
  describe("exports", () => {
    it("should export createErrorRoute function", () => {
      expect(createErrorHandler).toBeDefined();
      expect(typeof createErrorHandler).toBe("function");

      expect(error).toBeDefined();
      expect(typeof error).toBe("function");
    });
  });

  describe("error route", () => {
    it("should create a typesafe error route", () => {
      const errorHandler = createErrorHandler(
        createErrorRoute("GET", "/test", 400, {
          schema: v.object({
            error: v.string(),
            message: v.string(),
          }),
        }),
      );

      expect(errorHandler).toBeDefined();
      expect(typeof errorHandler).toBe("function");
    });

    it("should create an error handler that accepts the schema defined", async () => {
      const schema = {
        schema: v.object({
          error: v.string(),
          message: v.string(),
        }),
        headers: v.object({
          "X-Error-Id": v.string(),
        }),
      } as const;

      const errorHandler = createErrorHandler(
        createErrorRoute("GET", "/test", 400, schema),
      );

      const result = await errorHandler(
        { error: "validation_error", message: "Invalid input" },
        { "X-Error-Id": "12345" },
      );

      expect(result).toEqual({
        error: {
          statusCode: 400,
          body: {
            error: "validation_error",
            message: "Invalid input",
          },
          headers: {
            "X-Error-Id": "12345",
          },
        },
      });
    });

    it("should create an error handler without headers", async () => {
      const schema = {
        schema: v.object({
          error: v.string(),
          message: v.string(),
        }),
      };

      const errorHandler = createErrorHandler(
        createErrorRoute("POST", "/api/users", 500, schema),
      );

      const result = await errorHandler({
        error: "internal_error",
        message: "Something went wrong",
      });

      expect(result).toEqual({
        error: {
          statusCode: 500,
          body: {
            error: "internal_error",
            message: "Something went wrong",
          },
        },
      });
    });
  });
});
