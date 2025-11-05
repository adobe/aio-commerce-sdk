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
  badRequest,
  created,
  forbidden,
  HTTP_BAD_REQUEST,
  HTTP_CREATED,
  HTTP_FORBIDDEN,
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_NOT_FOUND,
  HTTP_OK,
  HTTP_UNAUTHORIZED,
  internalServerError,
  notFound,
  ok,
  unauthorized,
} from "~/responses/presets";

describe("responses/presets", () => {
  describe("HTTP status code constants", () => {
    it("should export correct HTTP status codes", () => {
      expect(HTTP_OK).toBe(200);
      expect(HTTP_CREATED).toBe(201);
      expect(HTTP_BAD_REQUEST).toBe(400);
      expect(HTTP_UNAUTHORIZED).toBe(401);
      expect(HTTP_FORBIDDEN).toBe(403);
      expect(HTTP_NOT_FOUND).toBe(404);
      expect(HTTP_INTERNAL_SERVER_ERROR).toBe(500);
    });
  });

  describe("ok (200)", () => {
    it("should create a 200 OK success response", () => {
      const result = ok({ body: { message: "Request successful" } });

      expect(result).toEqual({
        type: "success",
        statusCode: 200,
        message: "Request successful",
      });
    });

    it("should create response without payload", () => {
      const result = ok();

      expect(result).toEqual({
        type: "success",
        statusCode: 200,
      });
    });

    it("should accept string shorthand", () => {
      const result = ok("Request successful");

      expect(result).toEqual({
        type: "success",
        statusCode: 200,
        message: "Request successful",
      });
    });
  });

  describe("created (201)", () => {
    it("should create a 201 Created success response", () => {
      const result = created({
        body: { message: "Resource created successfully" },
      });

      expect(result).toEqual({
        type: "success",
        statusCode: 201,
        message: "Resource created successfully",
      });
    });

    it("should accept string shorthand", () => {
      const result = created("Resource created successfully");

      expect(result).toEqual({
        type: "success",
        statusCode: 201,
        message: "Resource created successfully",
      });
    });
  });

  describe("badRequest (400)", () => {
    it("should create a 400 Bad Request error response", () => {
      const result = badRequest({
        body: { message: "Invalid input provided" },
      });

      expect(result).toEqual({
        type: "error",
        error: {
          statusCode: 400,
          body: {
            message: "Invalid input provided",
          },
        },
      });
    });

    it("should accept string shorthand", () => {
      const result = badRequest("Invalid input provided");

      expect(result).toEqual({
        type: "error",
        error: {
          statusCode: 400,
          body: {
            message: "Invalid input provided",
          },
        },
      });
    });
  });

  describe("unauthorized (401)", () => {
    it("should create a 401 Unauthorized error response", () => {
      const result = unauthorized({
        body: { message: "Authentication required" },
      });

      expect(result).toEqual({
        type: "error",
        error: {
          statusCode: 401,
          body: {
            message: "Authentication required",
          },
        },
      });
    });
  });

  describe("forbidden (403)", () => {
    it("should create a 403 Forbidden error response", () => {
      const result = forbidden({ body: { message: "Access denied" } });

      expect(result).toEqual({
        type: "error",
        error: {
          statusCode: 403,
          body: {
            message: "Access denied",
          },
        },
      });
    });
  });

  describe("notFound (404)", () => {
    it("should create a 404 Not Found error response", () => {
      const result = notFound({ body: { message: "Resource not found" } });

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

    it("should accept string shorthand", () => {
      const result = notFound("Resource not found");

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
  });

  describe("internalServerError (500)", () => {
    it("should create a 500 Internal Server Error response", () => {
      const result = internalServerError({
        body: { message: "Internal server error" },
      });

      expect(result).toEqual({
        type: "error",
        error: {
          statusCode: 500,
          body: {
            message: "Internal server error",
          },
        },
      });
    });

    it("should accept string shorthand", () => {
      const result = internalServerError("Internal server error");

      expect(result).toEqual({
        type: "error",
        error: {
          statusCode: 500,
          body: {
            message: "Internal server error",
          },
        },
      });
    });
  });

  describe("preset functions consistency", () => {
    it("should maintain type consistency with base helper functions", () => {
      const successResponse = ok({ body: { message: "Test" } });
      const errorResponse = badRequest({ body: { message: "Test" } });

      expect(successResponse.type).toBe("success");
      expect(errorResponse.type).toBe("error");
    });
  });
});
