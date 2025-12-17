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
  buildAddOperation,
  buildExceptionOperation,
  buildRemoveOperation,
  buildReplaceOperation,
  buildSuccessOperation,
} from "~/operations";

describe("operations/helpers", () => {
  describe("buildSuccessOperation", () => {
    it("should create a success operation", () => {
      const result = buildSuccessOperation();

      expect(result).toEqual({
        op: "success",
      });
    });

    it("should have correct type", () => {
      const result = buildSuccessOperation();
      expect(result.op).toBe("success");
    });
  });

  describe("buildExceptionOperation", () => {
    it("should create an exception operation with message only", () => {
      const result = buildExceptionOperation({
        message: "Product is out of stock",
      });

      expect(result).toEqual({
        op: "exception",
        message: "Product is out of stock",
      });
    });

    it("should create an exception operation with message and class", () => {
      const result = buildExceptionOperation({
        message: "Payment validation failed",
        class: "Magento\\Payment\\Exception\\PaymentException",
      });

      expect(result).toEqual({
        op: "exception",
        message: "Payment validation failed",
        class: "Magento\\Payment\\Exception\\PaymentException",
      });
    });

    it("should create an exception operation without payload", () => {
      const result = buildExceptionOperation();

      expect(result).toEqual({
        op: "exception",
      });
    });

    it("should create an exception operation with empty payload", () => {
      const result = buildExceptionOperation({});

      expect(result).toEqual({
        op: "exception",
      });
    });

    it("should omit undefined message", () => {
      const result = buildExceptionOperation({ message: undefined });

      expect(result).toEqual({
        op: "exception",
      });
      expect(result).not.toHaveProperty("message");
    });

    it("should omit undefined class", () => {
      const result = buildExceptionOperation({
        message: "Error",
        class: undefined,
      });

      expect(result).toEqual({
        op: "exception",
        message: "Error",
      });
      expect(result).not.toHaveProperty("class");
    });
  });

  describe("buildAddOperation", () => {
    it("should create an add operation with path and value", () => {
      const result = buildAddOperation("result", { data: "test" });

      expect(result).toEqual({
        op: "add",
        path: "result",
        value: { data: "test" },
      });
    });

    it("should create an add operation with instance", () => {
      const result = buildAddOperation(
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
      const result = buildAddOperation("result/items", [1, 2, 3]);

      expect(result).toEqual({
        op: "add",
        path: "result/items",
        value: [1, 2, 3],
      });
    });

    it("should handle primitive values", () => {
      const stringResult = buildAddOperation("result/name", "test");
      const numberResult = buildAddOperation("result/count", 42);
      const boolResult = buildAddOperation("result/active", true);

      expect(stringResult.value).toBe("test");
      expect(numberResult.value).toBe(42);
      expect(boolResult.value).toBe(true);
    });

    it("should omit instance when undefined", () => {
      const result = buildAddOperation("result", { data: "test" }, undefined);

      expect(result).toEqual({
        op: "add",
        path: "result",
        value: { data: "test" },
      });
      expect(result).not.toHaveProperty("instance");
    });
  });

  describe("buildReplaceOperation", () => {
    it("should create a replace operation with path and value", () => {
      const result = buildReplaceOperation(
        "result/shipping_methods/flatrate/amount",
        10.5,
      );

      expect(result).toEqual({
        op: "replace",
        path: "result/shipping_methods/flatrate/amount",
        value: 10.5,
      });
    });

    it("should create a replace operation with instance", () => {
      const result = buildReplaceOperation(
        "result/product",
        { sku: "ABC123", price: 99.99 },
        "Magento\\Catalog\\Api\\Data\\ProductInterface",
      );

      expect(result).toEqual({
        op: "replace",
        path: "result/product",
        value: { sku: "ABC123", price: 99.99 },
        instance: "Magento\\Catalog\\Api\\Data\\ProductInterface",
      });
    });

    it("should handle complex nested paths", () => {
      const result = buildReplaceOperation("result/cart/items/0/quantity", 5);

      expect(result).toEqual({
        op: "replace",
        path: "result/cart/items/0/quantity",
        value: 5,
      });
    });

    it("should handle object values", () => {
      const result = buildReplaceOperation("result/config", {
        enabled: true,
        timeout: 30,
      });

      expect(result.value).toEqual({
        enabled: true,
        timeout: 30,
      });
    });

    it("should omit instance when undefined", () => {
      const result = buildReplaceOperation("result/value", 123, undefined);

      expect(result).toEqual({
        op: "replace",
        path: "result/value",
        value: 123,
      });
      expect(result).not.toHaveProperty("instance");
    });
  });

  describe("buildRemoveOperation", () => {
    it("should create a remove operation with path", () => {
      const result = buildRemoveOperation(
        "result/payment_methods/cashondelivery",
      );

      expect(result).toEqual({
        op: "remove",
        path: "result/payment_methods/cashondelivery",
      });
    });

    it("should handle simple paths", () => {
      const result = buildRemoveOperation("result/key");

      expect(result).toEqual({
        op: "remove",
        path: "result/key",
      });
    });

    it("should handle nested paths", () => {
      const result = buildRemoveOperation("result/data/nested/deep/value");

      expect(result).toEqual({
        op: "remove",
        path: "result/data/nested/deep/value",
      });
    });

    it("should handle array index paths", () => {
      const result = buildRemoveOperation("result/items/0");

      expect(result).toEqual({
        op: "remove",
        path: "result/items/0",
      });
    });
  });

  describe("operation type consistency", () => {
    it("should have correct op field for all operations", () => {
      expect(buildSuccessOperation().op).toBe("success");
      expect(buildExceptionOperation().op).toBe("exception");
      expect(buildAddOperation("path", "value").op).toBe("add");
      expect(buildReplaceOperation("path", "value").op).toBe("replace");
      expect(buildRemoveOperation("path").op).toBe("remove");
    });
  });
});
