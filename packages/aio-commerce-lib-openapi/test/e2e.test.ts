import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { openapi } from "~/index";
import { omitType } from "~~/test/test-utils";

// Define regex patterns at module level for performance
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}T/;
const REQUEST_ID_REGEX = /^req-[a-z0-9]+$/;

describe("E2E: Adobe App Builder Runtime Action Simulation", () => {
  describe("Adobe App Builder Integration Patterns", () => {
    it("should demonstrate typical App Builder action structure", async () => {
      // This shows how the openapi library integrates with Adobe App Builder patterns

      const commerceInventoryAction = openapi(
        {
          path: "/commerce/inventory/{sku}/update",
          method: "PUT",
          request: {
            params: v.object({
              sku: v.string(),
            }),
            headers: v.object({
              authorization: v.pipe(v.string(), v.startsWith("Bearer ")),
              "x-api-key": v.string(),
            }),
            body: {
              schema: v.object({
                quantity: v.pipe(v.number(), v.integer(), v.minValue(0)),
                location: v.optional(v.string()),
                reason: v.optional(v.string()),
              }),
            },
          },
          responses: {
            200: {
              schema: v.object({
                sku: v.string(),
                previousQuantity: v.number(),
                newQuantity: v.number(),
                location: v.string(),
                updatedAt: v.string(),
              }),
            },
            404: {
              schema: v.object({
                error: v.literal("sku_not_found"),
                message: v.string(),
              }),
            },
            401: {
              schema: v.object({
                error: v.literal("unauthorized"),
                message: v.string(),
              }),
            },
          },
        },
        async (spec) => {
          const headers = await spec.validateHeaders();
          const params = await spec.validateParams();
          const body = await spec.validateBody();

          // Mock authentication check
          if (headers.authorization !== "Bearer inventory-service-token") {
            return spec.error(
              {
                error: "unauthorized",
                message: "Invalid service token",
              },
              401,
            );
          }

          // Mock inventory lookup
          const mockInventory = {
            "SKU-123": { quantity: 50, location: "warehouse-1" },
            "SKU-456": { quantity: 25, location: "warehouse-2" },
          };

          const currentInventory =
            mockInventory[params.sku as keyof typeof mockInventory];

          if (!currentInventory) {
            return spec.error(
              {
                error: "sku_not_found",
                message: `SKU ${params.sku} not found in inventory`,
              },
              404,
            );
          }

          // Update inventory
          const previousQuantity = currentInventory.quantity;
          currentInventory.quantity = body.quantity;

          return spec.json(
            {
              sku: params.sku,
              previousQuantity,
              newQuantity: body.quantity,
              location: body.location || currentInventory.location,
              updatedAt: new Date().toISOString(),
            },
            200,
          );
        },
      );

      // Simulate Adobe App Builder runtime calling the action
      const result = await commerceInventoryAction({
        // Parameters from App Builder routing
        sku: "SKU-123",

        // Headers from App Builder request
        authorization: "Bearer inventory-service-token",
        "x-api-key": "service-key-123",

        // Body from App Builder request
        quantity: 75,
        location: "warehouse-1",
        reason: "Restocking after shipment",
      });

      expect(omitType(result)).toEqual({
        statusCode: 200,
        body: {
          sku: "SKU-123",
          previousQuantity: 50,
          newQuantity: 75,
          location: "warehouse-1",
          updatedAt: expect.stringMatching(ISO_DATE_REGEX),
        },
      });
    });

    it("should handle App Builder error scenarios", async () => {
      const errorProneAction = openapi(
        {
          path: "/commerce/test/error",
          method: "POST",
          request: {
            body: {
              schema: v.object({
                triggerError: v.string(),
              }),
            },
          },
          responses: {
            200: {
              schema: v.object({ success: v.boolean() }),
            },
            500: {
              schema: v.object({
                error: v.literal("internal_error"),
                message: v.string(),
                requestId: v.optional(v.string()),
              }),
            },
          },
        },
        async (spec) => {
          const body = await spec.validateBody();

          let errorMessage: string | null = null;

          // Simulate different error conditions
          if (body.triggerError === "timeout") {
            errorMessage = "Service timeout";
          } else if (body.triggerError === "database") {
            errorMessage = "Database connection failed";
          }

          // Adobe App Builder error handling pattern
          if (errorMessage) {
            return spec.error(
              {
                error: "internal_error",
                message: errorMessage,
                requestId: `req-${Math.random().toString(36).substring(7)}`,
              },
              500,
            );
          }

          return spec.json({ success: true }, 200);
        },
      );

      const timeoutResult = await errorProneAction({
        triggerError: "timeout",
      });

      expect(omitType(timeoutResult)).toEqual({
        error: {
          statusCode: 500,
          body: {
            error: "internal_error",
            message: "Service timeout",
            requestId: expect.stringMatching(REQUEST_ID_REGEX),
          },
        },
      });

      const databaseResult = await errorProneAction({
        triggerError: "database",
      });

      expect(omitType(databaseResult)).toEqual({
        error: {
          statusCode: 500,
          body: {
            error: "internal_error",
            message: "Database connection failed",
            requestId: expect.stringMatching(REQUEST_ID_REGEX),
          },
        },
      });
    });
  });
});
