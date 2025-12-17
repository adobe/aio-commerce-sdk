/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { describe, expect, it } from "vitest";

import {
  addOperation,
  exceptionOperation,
  removeOperation,
  replaceOperation,
  successOperation,
} from "~/operations";
import { ok } from "~/responses";

describe("responses/presets", () => {
  describe("ok (200)", () => {
    it("should create a 200 OK response with single operation", () => {
      const operation = successOperation();
      const result = ok(operation);

      expect(result).toEqual({
        type: "success",
        statusCode: 200,
        body: {
          op: "success",
        },
      });
    });

    it("should create a 200 OK response with exception operation", () => {
      const operation = exceptionOperation("Product is out of stock");
      const result = ok(operation);

      expect(result).toEqual({
        type: "success",
        statusCode: 200,
        body: {
          op: "exception",
          message: "Product is out of stock",
        },
      });
    });

    it("should create a 200 OK response with add operation", () => {
      const operation = addOperation("result", { data: "test" });
      const result = ok(operation);

      expect(result).toEqual({
        type: "success",
        statusCode: 200,
        body: {
          op: "add",
          path: "result",
          value: { data: "test" },
        },
      });
    });

    it("should create a 200 OK response with replace operation", () => {
      const operation = replaceOperation("result/price", 99.99);
      const result = ok(operation);

      expect(result).toEqual({
        type: "success",
        statusCode: 200,
        body: {
          op: "replace",
          path: "result/price",
          value: 99.99,
        },
      });
    });

    it("should create a 200 OK response with remove operation", () => {
      const operation = removeOperation("result/deprecated");
      const result = ok(operation);

      expect(result).toEqual({
        type: "success",
        statusCode: 200,
        body: {
          op: "remove",
          path: "result/deprecated",
        },
      });
    });

    it("should create a 200 OK response with array of operations", () => {
      const operations = [
        addOperation("result", { id: 1 }),
        addOperation("result", { id: 2 }),
      ];
      const result = ok(operations);

      expect(result).toEqual({
        type: "success",
        statusCode: 200,
        body: [
          {
            op: "add",
            path: "result",
            value: { id: 1 },
          },
          {
            op: "add",
            path: "result",
            value: { id: 2 },
          },
        ],
      });
    });

    it("should create a 200 OK response with mixed operations array", () => {
      const operations = [
        addOperation("result/new_field", "value"),
        replaceOperation("result/existing_field", "updated"),
        removeOperation("result/old_field"),
      ];
      const result = ok(operations);

      expect(result.statusCode).toBe(200);
      expect(result.type).toBe("success");
      expect(Array.isArray(result.body)).toBe(true);
      expect(result.body).toHaveLength(3);
    });

    it("should handle empty array of operations", () => {
      const result = ok([]);

      expect(result).toEqual({
        type: "success",
        statusCode: 200,
        body: [],
      });
    });

    it("should maintain operation structure in response", () => {
      const operation = addOperation(
        "result",
        { amount: "5.00", carrier_code: "custom" },
        "Magento\\Quote\\Api\\Data\\ShippingMethodInterface",
      );
      const result = ok(operation);

      expect(result.body).toHaveProperty("op", "add");
      expect(result.body).toHaveProperty("path", "result");
      expect(result.body).toHaveProperty("value");
      expect(result.body).toHaveProperty("instance");
    });
  });

  describe("webhook-optimized response functions", () => {
    it("should have correct response type", () => {
      const okResult = ok(successOperation());

      expect(okResult.type).toBe("success");
    });

    it("should have correct status code", () => {
      const operation = successOperation();
      const okResult = ok(operation);

      expect(okResult.statusCode).toBe(200);
    });

    it("should handle complex real-world scenarios", () => {
      const operations = [
        addOperation(
          "result",
          {
            data: {
              amount: "5.00",
              carrier_code: "customshipping",
              carrier_title: "Custom Shipping",
            },
          },
          "Magento\\Quote\\Api\\Data\\ShippingMethodInterface",
        ),
        replaceOperation("result/totals/shipping_amount", 5.0),
        removeOperation("result/payment_methods/cashondelivery"),
      ];

      const result = ok(operations);

      expect(result.statusCode).toBe(200);
      expect(result.type).toBe("success");
      expect(Array.isArray(result.body)).toBe(true);
      expect(result.body).toHaveLength(3);
      if (Array.isArray(result.body)) {
        expect(result.body[0]).toHaveProperty("op", "add");
        expect(result.body[1]).toHaveProperty("op", "replace");
        expect(result.body[2]).toHaveProperty("op", "remove");
      }
    });
  });

  describe("comparison with core library pattern", () => {
    it("should shadow core library ok() with webhook-optimized version", () => {
      // Webhook-optimized: accepts operations directly
      const webhookResult = ok(successOperation());

      // Core library would require: ok({ body: successOperation() })
      // This test verifies the webhook version works with direct operation
      expect(webhookResult.body).toEqual({ op: "success" });
      expect(webhookResult.statusCode).toBe(200);
    });

    it("should maintain success response structure", () => {
      const result = ok(successOperation());

      // Should have the same structure as core library success responses
      expect(result).toHaveProperty("type", "success");
      expect(result).toHaveProperty("statusCode");
      expect(result).toHaveProperty("body");
      expect(result).not.toHaveProperty("error");
    });
  });
});
