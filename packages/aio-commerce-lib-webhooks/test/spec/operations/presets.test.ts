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

describe("operations/presets", () => {
  describe("successOperation", () => {
    it("should create a success operation", () => {
      const result = successOperation();

      expect(result).toEqual({
        op: "success",
      });
    });

    it("should be callable without arguments", () => {
      expect(() => successOperation()).not.toThrow();
    });
  });

  describe("exceptionOperation", () => {
    it("should create an exception operation with message", () => {
      const result = exceptionOperation("Product is out of stock");

      expect(result).toEqual({
        op: "exception",
        message: "Product is out of stock",
      });
    });

    it("should create an exception operation with message and class", () => {
      const result = exceptionOperation(
        "Payment validation failed",
        "Magento\\Payment\\Exception\\PaymentException",
      );

      expect(result).toEqual({
        op: "exception",
        message: "Payment validation failed",
        class: "Magento\\Payment\\Exception\\PaymentException",
      });
    });

    it("should omit empty message", () => {
      const result = exceptionOperation("");

      // Empty string is falsy, so it won't be included in the result
      expect(result).toEqual({
        op: "exception",
      });
      expect(result).not.toHaveProperty("message");
    });

    it("should handle long error messages", () => {
      const longMessage =
        "This is a very long error message that describes in detail what went wrong with the operation and provides helpful context for debugging";
      const result = exceptionOperation(longMessage);

      expect(result.message).toBe(longMessage);
    });

    it("should handle special characters in message", () => {
      const result = exceptionOperation(
        "Error: Invalid input <test@example.com>",
      );

      expect(result.message).toBe("Error: Invalid input <test@example.com>");
    });
  });

  describe("addOperation", () => {
    it("should create an add operation with path and value", () => {
      const result = addOperation("result", { data: "test" });

      expect(result).toEqual({
        op: "add",
        path: "result",
        value: { data: "test" },
      });
    });

    it("should create an add operation with instance", () => {
      const result = addOperation(
        "result",
        { data: { amount: "5", carrier_code: "custom" } },
        "Magento\\Quote\\Api\\Data\\ShippingMethodInterface",
      );

      expect(result).toEqual({
        op: "add",
        path: "result",
        value: { data: { amount: "5", carrier_code: "custom" } },
        instance: "Magento\\Quote\\Api\\Data\\ShippingMethodInterface",
      });
    });

    it("should handle array values", () => {
      const result = addOperation("result/items", [
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ]);

      expect(result.value).toEqual([
        { id: 1, name: "Item 1" },
        { id: 2, name: "Item 2" },
      ]);
    });

    it("should handle primitive values", () => {
      const stringResult = addOperation("result/name", "Product Name");
      const numberResult = addOperation("result/price", 99.99);
      const boolResult = addOperation("result/in_stock", true);
      const nullResult = addOperation("result/discount", null);

      expect(stringResult.value).toBe("Product Name");
      expect(numberResult.value).toBe(99.99);
      expect(boolResult.value).toBe(true);
      expect(nullResult.value).toBe(null);
    });

    it("should handle nested object values", () => {
      const result = addOperation("result/shipping", {
        method: "flatrate",
        cost: 5.99,
        address: {
          street: "123 Main St",
          city: "Springfield",
          country: "US",
        },
      });

      expect(result.value).toEqual({
        method: "flatrate",
        cost: 5.99,
        address: {
          street: "123 Main St",
          city: "Springfield",
          country: "US",
        },
      });
    });
  });

  describe("replaceOperation", () => {
    it("should create a replace operation with path and value", () => {
      const result = replaceOperation("result/price", 149.99);

      expect(result).toEqual({
        op: "replace",
        path: "result/price",
        value: 149.99,
      });
    });

    it("should create a replace operation with instance", () => {
      const result = replaceOperation(
        "result/product",
        { sku: "ABC123", name: "Updated Product" },
        "Magento\\Catalog\\Api\\Data\\ProductInterface",
      );

      expect(result).toEqual({
        op: "replace",
        path: "result/product",
        value: { sku: "ABC123", name: "Updated Product" },
        instance: "Magento\\Catalog\\Api\\Data\\ProductInterface",
      });
    });

    it("should handle nested path replacements", () => {
      const result = replaceOperation("result/cart/items/0/quantity", 10);

      expect(result).toEqual({
        op: "replace",
        path: "result/cart/items/0/quantity",
        value: 10,
      });
    });

    it("should handle replacing with null", () => {
      const result = replaceOperation("result/optional_field", null);

      expect(result.value).toBe(null);
    });

    it("should handle replacing with complex objects", () => {
      const result = replaceOperation("result/config", {
        enabled: true,
        settings: {
          timeout: 30,
          retries: 3,
        },
      });

      expect(result.value).toEqual({
        enabled: true,
        settings: {
          timeout: 30,
          retries: 3,
        },
      });
    });
  });

  describe("removeOperation", () => {
    it("should create a remove operation with path", () => {
      const result = removeOperation("result/deprecated_field");

      expect(result).toEqual({
        op: "remove",
        path: "result/deprecated_field",
      });
    });

    it("should handle nested paths", () => {
      const result = removeOperation("result/data/nested/field");

      expect(result).toEqual({
        op: "remove",
        path: "result/data/nested/field",
      });
    });

    it("should handle array index paths", () => {
      const result = removeOperation("result/items/2");

      expect(result).toEqual({
        op: "remove",
        path: "result/items/2",
      });
    });

    it("should handle complex paths", () => {
      const result = removeOperation(
        "result/payment_methods/cashondelivery/config/enabled",
      );

      expect(result.path).toBe(
        "result/payment_methods/cashondelivery/config/enabled",
      );
    });
  });

  describe("preset functions consistency", () => {
    it("should all return objects with op field", () => {
      expect(successOperation()).toHaveProperty("op");
      expect(exceptionOperation("error")).toHaveProperty("op");
      expect(addOperation("path", "value")).toHaveProperty("op");
      expect(replaceOperation("path", "value")).toHaveProperty("op");
      expect(removeOperation("path")).toHaveProperty("op");
    });

    it("should have correct operation types", () => {
      expect(successOperation().op).toBe("success");
      expect(exceptionOperation("error").op).toBe("exception");
      expect(addOperation("path", "value").op).toBe("add");
      expect(replaceOperation("path", "value").op).toBe("replace");
      expect(removeOperation("path").op).toBe("remove");
    });
  });

  describe("real-world usage scenarios", () => {
    it("should support adding shipping methods", () => {
      const result = addOperation(
        "result",
        {
          data: {
            amount: "5.00",
            carrier_code: "customshipping",
            carrier_title: "Custom Shipping",
            method_code: "standard",
            method_title: "Standard Delivery",
          },
        },
        "Magento\\Quote\\Api\\Data\\ShippingMethodInterface",
      );

      expect(result.op).toBe("add");
      expect(result.path).toBe("result");
      expect(result.instance).toBe(
        "Magento\\Quote\\Api\\Data\\ShippingMethodInterface",
      );
    });

    it("should support modifying cart totals", () => {
      const result = replaceOperation("result/totals/grand_total", 199.99);

      expect(result.op).toBe("replace");
      expect(result.value).toBe(199.99);
    });

    it("should support removing payment methods", () => {
      const result = removeOperation("result/payment_methods/cashondelivery");

      expect(result.op).toBe("remove");
      expect(result.path).toBe("result/payment_methods/cashondelivery");
    });

    it("should support exception with custom class", () => {
      const result = exceptionOperation(
        "Insufficient inventory",
        "Magento\\InventoryApi\\Exception\\InsufficientStockException",
      );

      expect(result.op).toBe("exception");
      expect(result.message).toBe("Insufficient inventory");
      expect(result.class).toBe(
        "Magento\\InventoryApi\\Exception\\InsufficientStockException",
      );
    });
  });
});
