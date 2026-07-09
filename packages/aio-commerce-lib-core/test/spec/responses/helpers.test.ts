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

import { buildErrorResponse, buildSuccessResponse } from "#responses/helpers";

describe("responses/helpers", () => {
  describe("buildErrorResponse", () => {
    it("should create a basic error response with just a message", () => {
      const result = buildErrorResponse(404, {
        body: { message: "Resource not found" },
      });

      expect(result).toEqual({
        error: {
          body: {
            message: "Resource not found",
          },
          statusCode: 404,
        },
        type: "error",
      });
    });

    it("should create an error response with additional body properties", () => {
      const result = buildErrorResponse(400, {
        body: {
          code: "INVALID_FORMAT",
          field: "email",
          message: "Invalid request",
        },
      });

      expect(result).toEqual({
        error: {
          body: {
            code: "INVALID_FORMAT",
            field: "email",
            message: "Invalid request",
          },
          statusCode: 400,
        },
        type: "error",
      });
    });

    it("should create an error response with custom headers", () => {
      const result = buildErrorResponse(429, {
        body: { message: "Rate limit exceeded" },
        headers: { "Retry-After": "60" },
      });

      expect(result).toEqual({
        error: {
          body: {
            message: "Rate limit exceeded",
          },
          headers: { "Retry-After": "60" },
          statusCode: 429,
        },
        type: "error",
      });
    });

    it("should create an error response with both body and headers", () => {
      const result = buildErrorResponse(403, {
        body: {
          message: "Access denied",
          reason: "insufficient_permissions",
          resource: "/api/users",
        },
        headers: { "X-Request-Id": "abc123" },
      });

      expect(result).toEqual({
        error: {
          body: {
            message: "Access denied",
            reason: "insufficient_permissions",
            resource: "/api/users",
          },
          headers: { "X-Request-Id": "abc123" },
          statusCode: 403,
        },
        type: "error",
      });
    });

    it("should properly type the response as ErrorResponse", () => {
      const result = buildErrorResponse(400, {
        body: { message: "Bad request" },
      });

      expect(result.type).toBe("error");
      expect("error" in result).toBe(true);
    });

    it("should not include headers key when headers are not provided", () => {
      const result = buildErrorResponse(404, {
        body: { message: "Not found" },
      });

      expect(result.error).not.toHaveProperty("headers");
    });
  });

  describe("buildSuccessResponse", () => {
    it("should create a basic success response with body", () => {
      const result = buildSuccessResponse(200, {
        body: { message: "Operation successful" },
      });

      expect(result).toEqual({
        body: { message: "Operation successful" },
        statusCode: 200,
        type: "success",
      });
    });

    it("should create a success response with additional body properties", () => {
      const result = buildSuccessResponse(201, {
        body: { created: true, id: "456", message: "Resource created" },
      });

      expect(result).toEqual({
        body: { created: true, id: "456", message: "Resource created" },
        statusCode: 201,
        type: "success",
      });
    });

    it("should create a success response with custom headers", () => {
      const result = buildSuccessResponse(201, {
        body: { message: "Resource created" },
        headers: { Location: "/api/resources/456" },
      });

      expect(result).toEqual({
        body: { message: "Resource created" },
        headers: { Location: "/api/resources/456" },
        statusCode: 201,
        type: "success",
      });
    });

    it("should create a success response with both body and headers", () => {
      const result = buildSuccessResponse(200, {
        body: { message: "Data retrieved", total: 0, users: [] },
        headers: { "X-Total-Count": "0" },
      });

      expect(result).toEqual({
        body: { message: "Data retrieved", total: 0, users: [] },
        headers: { "X-Total-Count": "0" },
        statusCode: 200,
        type: "success",
      });
    });

    it("should properly type the response as SuccessResponse", () => {
      const result = buildSuccessResponse(200, {
        body: { message: "Success" },
      });

      expect(result.type).toBe("success");
      expect("statusCode" in result).toBe(true);
    });

    it("should not include headers key when headers are not provided", () => {
      const result = buildSuccessResponse(200, {
        body: { message: "Success" },
      });

      expect(result).not.toHaveProperty("headers");
    });

    it("should handle complex body data structures", () => {
      const result = buildSuccessResponse(200, {
        body: {
          array: [1, 2, 3],
          data: {
            nested: {
              value: 123,
            },
          },
          message: "Success",
        },
      });

      // Body properties are nested under body property
      expect(result).toMatchObject({
        body: {
          array: [1, 2, 3],
          data: {
            nested: {
              value: 123,
            },
          },
          message: "Success",
        },
        statusCode: 200,
        type: "success",
      });
    });

    it("should create response without body when body is omitted", () => {
      const result = buildSuccessResponse(204, {});

      expect(result).toEqual({
        statusCode: 204,
        type: "success",
      });
    });

    it("should handle optional payload parameter", () => {
      const result = buildSuccessResponse(204);

      expect(result).toEqual({
        statusCode: 204,
        type: "success",
      });
    });
  });

  describe("type discrimination", () => {
    it("should allow type discrimination between success and error responses", () => {
      const success = buildSuccessResponse(200, { body: { message: "OK" } });
      const error = buildErrorResponse(400, {
        body: { message: "Bad request" },
      });

      if (success.type === "success") {
        expect(success.statusCode).toBe(200);
      }

      if (error.type === "error") {
        expect(error.error.statusCode).toBe(400);
      }
    });
  });
});
