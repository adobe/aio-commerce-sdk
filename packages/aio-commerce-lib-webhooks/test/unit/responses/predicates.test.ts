/*
 * Copyright 2026 Adobe. All rights reserved.
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
  isWebhookSuccessful,
  ok,
  removeOperation,
  replaceOperation,
  successOperation,
} from "#responses/index";

describe("responses/predicates", () => {
  describe("isWebhookSuccessful", () => {
    it("returns false when statusCode is not 200", () => {
      expect(isWebhookSuccessful({ statusCode: 500 })).toBe(false);
      expect(isWebhookSuccessful({ statusCode: 400 })).toBe(false);
    });

    it("returns true when there is no body", () => {
      expect(isWebhookSuccessful({ statusCode: 200 })).toBe(true);
    });

    it("returns true when the body has no op field", () => {
      expect(isWebhookSuccessful({ body: {}, statusCode: 200 })).toBe(true);
    });

    it("returns false when the body op is exception", () => {
      const result = ok(exceptionOperation("Product is out of stock"));
      expect(isWebhookSuccessful(result)).toBe(false);
    });

    it("returns true for a success operation", () => {
      const result = ok(successOperation());
      expect(isWebhookSuccessful(result)).toBe(true);
    });

    it("returns true for add/replace/remove operations", () => {
      expect(isWebhookSuccessful(ok(addOperation("result", "value")))).toBe(
        true,
      );
      expect(
        isWebhookSuccessful(ok(replaceOperation("result/price", 10))),
      ).toBe(true);
      expect(
        isWebhookSuccessful(ok(removeOperation("result/deprecated"))),
      ).toBe(true);
    });

    it("returns true for an array of operations", () => {
      const result = ok([
        addOperation("result/new_field", "value"),
        replaceOperation("result/existing_field", "updated"),
        removeOperation("result/old_field"),
      ]);

      expect(isWebhookSuccessful(result)).toBe(true);
    });

    it("returns false for non-object input", () => {
      expect(isWebhookSuccessful(null)).toBe(false);
      expect(isWebhookSuccessful(undefined)).toBe(false);
      expect(isWebhookSuccessful("success")).toBe(false);
      expect(isWebhookSuccessful(200)).toBe(false);
    });
  });
});
