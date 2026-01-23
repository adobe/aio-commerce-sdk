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

import { allNonEmpty, nonEmpty } from "#params/helpers";

describe("params/helpers", () => {
  describe("nonEmpty", () => {
    it("should return true for non-empty strings", () => {
      expect(nonEmpty("test", "value")).toBe(true);
      expect(nonEmpty("test", "hello world")).toBe(true);
    });

    it("should return false for empty strings", () => {
      expect(nonEmpty("test", "")).toBe(false);
      expect(nonEmpty("test", "   ")).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(nonEmpty("test", undefined)).toBe(false);
    });

    it("should return false for null", () => {
      expect(nonEmpty("test", null)).toBe(false);
    });

    it("should return false for aio app dev placeholder format", () => {
      expect(nonEmpty("MY_PARAM", "$MY_PARAM")).toBe(false);
    });

    it("should return true for values that look like placeholders but don't match", () => {
      expect(nonEmpty("MY_PARAM", "$OTHER_PARAM")).toBe(true);
      expect(nonEmpty("MY_PARAM", "$ MY_PARAM")).toBe(true);
    });

    it("should handle numbers", () => {
      expect(nonEmpty("test", 123)).toBe(true);
      expect(nonEmpty("test", 0)).toBe(true);
    });

    it("should handle booleans", () => {
      expect(nonEmpty("test", true)).toBe(true);
      expect(nonEmpty("test", false)).toBe(true);
    });

    it("should handle arrays and objects by converting to string", () => {
      expect(nonEmpty("test", [])).toBe(false); // "[]" -> trim -> ""
      expect(nonEmpty("test", [1, 2, 3])).toBe(true);
      expect(nonEmpty("test", {})).toBe(true); // "[object Object]"
    });
  });

  describe("allNonEmpty", () => {
    it("should return true when all required params are non-empty", () => {
      const params = {
        param1: "value1",
        param2: "value2",
        param3: "value3",
      };

      expect(allNonEmpty(params, ["param1", "param2", "param3"])).toBe(true);
    });

    it("should return false when any required param is missing", () => {
      const params = {
        param1: "value1",
        param3: "value3",
      };

      expect(allNonEmpty(params, ["param1", "param2", "param3"])).toBe(false);
    });

    it("should return false when any required param is empty", () => {
      const params = {
        param1: "value1",
        param2: "",
        param3: "value3",
      };

      expect(allNonEmpty(params, ["param1", "param2", "param3"])).toBe(false);
    });

    it("should return false when any required param is undefined", () => {
      const params = {
        param1: "value1",
        param2: undefined,
        param3: "value3",
      };

      expect(allNonEmpty(params, ["param1", "param2", "param3"])).toBe(false);
    });

    it("should return false when any required param is null", () => {
      const params = {
        param1: "value1",
        param2: null,
        param3: "value3",
      };

      expect(allNonEmpty(params, ["param1", "param2", "param3"])).toBe(false);
    });

    it("should return true for empty required array", () => {
      const params = {
        param1: "value1",
      };

      expect(allNonEmpty(params, [])).toBe(true);
    });

    it("should handle aio app dev placeholder format", () => {
      const params = {
        MY_PARAM: "$MY_PARAM",
        OTHER_PARAM: "value",
      };

      expect(allNonEmpty(params, ["MY_PARAM", "OTHER_PARAM"])).toBe(false);
    });

    it("should ignore extra params not in required list", () => {
      const params = {
        param1: "value1",
        param2: "value2",
        extra1: "",
        extra2: undefined,
      };

      expect(allNonEmpty(params, ["param1", "param2"])).toBe(true);
    });
  });
});
