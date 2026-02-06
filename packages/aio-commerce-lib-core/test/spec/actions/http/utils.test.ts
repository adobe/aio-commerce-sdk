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

import * as v from "valibot";
import { describe, expect, it } from "vitest";

import {
  parseQueryParams,
  parseRequestBody,
  validateSchema,
} from "#actions/rest/utils";

describe("actions/rest/utils", () => {
  describe("parseRequestBody", () => {
    it("should return object body as-is", () => {
      const body = { name: "test", value: 123 };
      expect(parseRequestBody(body)).toEqual(body);
    });

    it("should parse JSON string body", () => {
      const body = '{"name":"test","value":123}';
      expect(parseRequestBody(body)).toEqual({ name: "test", value: 123 });
    });

    it("should parse base64 encoded body", () => {
      const jsonBody = '{"name":"test","value":123}';
      const base64Body = Buffer.from(jsonBody).toString("base64");
      expect(parseRequestBody(base64Body)).toEqual({
        name: "test",
        value: 123,
      });
    });

    it("should extract body from args when __ow_body is not present", () => {
      const args = {
        __ow_method: "post",
        __ow_path: "/users",
        __ow_headers: { "content-type": "application/json" },
        name: "test",
        value: 123,
      };
      expect(parseRequestBody(undefined, args)).toEqual({
        name: "test",
        value: 123,
      });
    });

    it("should filter out __ow_* keys when extracting from args", () => {
      const args = {
        __ow_method: "post",
        __ow_path: "/users",
        __ow_headers: {},
        __ow_body: undefined,
        __ow_query: "foo=bar",
        name: "test",
      };
      expect(parseRequestBody(undefined, args)).toEqual({ name: "test" });
    });

    it("should return empty object when no body and no args", () => {
      expect(parseRequestBody()).toEqual({});
      expect(parseRequestBody(undefined, undefined)).toEqual({});
    });

    it("should return empty object when args is empty", () => {
      expect(parseRequestBody(undefined, {})).toEqual({});
    });

    it("should prefer __ow_body over args", () => {
      const args = { name: "from-args" };
      const body = { name: "from-body" };
      expect(parseRequestBody(body, args)).toEqual({ name: "from-body" });
    });
  });

  describe("parseQueryParams", () => {
    it("should parse query string", () => {
      expect(parseQueryParams("foo=bar&baz=qux")).toEqual({
        foo: "bar",
        baz: "qux",
      });
    });

    it("should handle URL encoded values", () => {
      expect(
        parseQueryParams("name=John%20Doe&email=test%40example.com"),
      ).toEqual({
        name: "John Doe",
        email: "test@example.com",
      });
    });

    it("should return empty object for empty query string", () => {
      expect(parseQueryParams("")).toEqual({});
    });

    it("should extract from fallback params when query string is undefined", () => {
      const params = {
        __ow_method: "get",
        __ow_path: "/users",
        __ow_headers: {},
        foo: "bar",
        baz: "qux",
      };
      expect(parseQueryParams(undefined, params)).toEqual({
        foo: "bar",
        baz: "qux",
      });
    });

    it("should filter OpenWhisk fields from fallback params", () => {
      const params = {
        __ow_method: "get",
        __ow_path: "/users",
        __ow_headers: {},
        __ow_body: "test",
        __ow_query: undefined,
        id: "123",
      };
      expect(parseQueryParams(undefined, params)).toEqual({ id: "123" });
    });

    it("should return empty object when no query string and no fallback", () => {
      expect(parseQueryParams()).toEqual({});
      expect(parseQueryParams(undefined, undefined)).toEqual({});
    });

    it("should prefer query string over fallback params", () => {
      expect(
        parseQueryParams("foo=from-query", { foo: "from-params" }),
      ).toEqual({
        foo: "from-query",
      });
    });
  });

  describe("validateSchema", () => {
    const userSchema = v.object({
      id: v.string(),
      name: v.string(),
      age: v.pipe(v.number(), v.minValue(0)),
    });

    it("should return success with valid data", async () => {
      const input = { id: "123", name: "John", age: 25 };
      const result = await validateSchema(userSchema, input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it("should return failure with invalid data", async () => {
      const input = { id: 123, name: "John", age: 25 };
      const result = await validateSchema(userSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.issues).toBeDefined();
        expect(result.issues.length).toBeGreaterThan(0);
      }
    });

    it("should return failure with missing required fields", async () => {
      const input = { id: "123" };
      const result = await validateSchema(userSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.issues.length).toBeGreaterThan(0);
      }
    });

    it("should return failure with multiple validation errors", async () => {
      const input = { id: 123, name: 456, age: -1 };
      const result = await validateSchema(userSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.issues.length).toBeGreaterThan(1);
      }
    });

    it("should normalize issue paths", async () => {
      const nestedSchema = v.object({
        user: v.object({
          profile: v.object({
            email: v.pipe(v.string(), v.email()),
          }),
        }),
      });

      const input = { user: { profile: { email: "invalid-email" } } };
      const result = await validateSchema(nestedSchema, input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.issues[0]?.path).toBeDefined();
        // Path should be normalized to simple array of strings/numbers
        expect(Array.isArray(result.issues[0]?.path)).toBe(true);
      }
    });

    it("should handle transformation schemas", async () => {
      const transformSchema = v.pipe(
        v.string(),
        v.transform((val) => val.toUpperCase()),
      );

      const result = await validateSchema(transformSchema, "hello");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("HELLO");
      }
    });
  });
});
