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

import { buildErrorResponse, buildSuccessResponse } from "~/responses/helpers";

describe("responses/helpers", () => {
  describe("buildErrorResponse", () => {
    it("should create a basic error response with just a message", () => {
      const result = buildErrorResponse(404, {
        body: { message: "Resource not found" },
      });

      expect(result).toEqual({
        type: "error",
        error: {
          statusCode: 404,
          body: {
            message: "Resource not found",
          },
        },
      });
    });

    it("should create an error response with additional body properties", () => {
      const result = buildErrorResponse(400, {
        body: {
          message: "Invalid request",
          field: "email",
          code: "INVALID_FORMAT",
        },
      });

      expect(result).toEqual({
        type: "error",
        error: {
          statusCode: 400,
          body: {
            field: "email",
            code: "INVALID_FORMAT",
            message: "Invalid request",
          },
        },
      });
    });

    it("should create an error response with custom headers", () => {
      const result = buildErrorResponse(429, {
        body: { message: "Rate limit exceeded" },
        headers: { "Retry-After": "60" },
      });

      expect(result).toEqual({
        type: "error",
        error: {
          headers: { "Retry-After": "60" },
          statusCode: 429,
          body: {
            message: "Rate limit exceeded",
          },
        },
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
        type: "error",
        error: {
          headers: { "X-Request-Id": "abc123" },
          statusCode: 403,
          body: {
            reason: "insufficient_permissions",
            resource: "/api/users",
            message: "Access denied",
          },
        },
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
        type: "success",
        statusCode: 200,
        message: "Operation successful",
      });
    });

    it("should create a success response with additional body properties", () => {
      const result = buildSuccessResponse(201, {
        body: { message: "Resource created", id: "456", created: true },
      });

      expect(result).toEqual({
        type: "success",
        statusCode: 201,
        id: "456",
        created: true,
        message: "Resource created",
      });
    });

    it("should create a success response with custom headers", () => {
      const result = buildSuccessResponse(201, {
        body: { message: "Resource created" },
        headers: { Location: "/api/resources/456" },
      });

      expect(result).toEqual({
        type: "success",
        statusCode: 201,
        headers: { Location: "/api/resources/456" },
        message: "Resource created",
      });
    });

    it("should create a success response with both body and headers", () => {
      const result = buildSuccessResponse(200, {
        body: { message: "Data retrieved", users: [], total: 0 },
        headers: { "X-Total-Count": "0" },
      });

      expect(result).toEqual({
        type: "success",
        statusCode: 200,
        headers: { "X-Total-Count": "0" },
        users: [],
        total: 0,
        message: "Data retrieved",
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
          message: "Success",
          data: {
            nested: {
              value: 123,
            },
          },
          array: [1, 2, 3],
        },
      });

      // Body properties are spread into the response
      expect(result).toMatchObject({
        type: "success",
        statusCode: 200,
        message: "Success",
        data: {
          nested: {
            value: 123,
          },
        },
        array: [1, 2, 3],
      });
    });

    it("should create response without body when body is omitted", () => {
      const result = buildSuccessResponse(204, {});

      expect(result).toEqual({
        type: "success",
        statusCode: 204,
      });
    });

    it("should handle optional payload parameter", () => {
      const result = buildSuccessResponse(204);

      expect(result).toEqual({
        type: "success",
        statusCode: 204,
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
