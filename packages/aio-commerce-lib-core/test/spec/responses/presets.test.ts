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
  accepted,
  badRequest,
  created,
  forbidden,
  HTTP_ACCEPTED,
  HTTP_BAD_REQUEST,
  HTTP_CREATED,
  HTTP_FORBIDDEN,
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_METHOD_NOT_ALLOWED,
  HTTP_NOT_FOUND,
  HTTP_OK,
  HTTP_UNAUTHORIZED,
  internalServerError,
  methodNotAllowed,
  notFound,
  ok,
  unauthorized,
} from "#responses/presets";

describe("responses/presets", () => {
  describe("HTTP status code constants", () => {
    it("should export correct HTTP status codes", () => {
      expect(HTTP_OK).toBe(200);
      expect(HTTP_CREATED).toBe(201);
      expect(HTTP_ACCEPTED).toBe(202);
      expect(HTTP_BAD_REQUEST).toBe(400);
      expect(HTTP_UNAUTHORIZED).toBe(401);
      expect(HTTP_FORBIDDEN).toBe(403);
      expect(HTTP_NOT_FOUND).toBe(404);
      expect(HTTP_METHOD_NOT_ALLOWED).toBe(405);
      expect(HTTP_INTERNAL_SERVER_ERROR).toBe(500);
    });
  });

  describe("ok (200)", () => {
    it("should create a 200 OK success response", () => {
      const result = ok({ body: { message: "Request successful" } });

      expect(result).toEqual({
        body: { message: "Request successful" },
        statusCode: 200,
        type: "success",
      });
    });

    it("should create response without payload", () => {
      const result = ok();

      expect(result).toEqual({
        statusCode: 200,
        type: "success",
      });
    });

    it("should accept string shorthand", () => {
      const result = ok("Request successful");

      expect(result).toEqual({
        body: { message: "Request successful" },
        statusCode: 200,
        type: "success",
      });
    });
  });

  describe("created (201)", () => {
    it("should create a 201 Created success response", () => {
      const result = created({
        body: { message: "Resource created successfully" },
      });

      expect(result).toEqual({
        body: { message: "Resource created successfully" },
        statusCode: 201,
        type: "success",
      });
    });

    it("should accept string shorthand", () => {
      const result = created("Resource created successfully");

      expect(result).toEqual({
        body: { message: "Resource created successfully" },
        statusCode: 201,
        type: "success",
      });
    });
  });

  describe("accepted (202)", () => {
    it("should create a 202 Accepted success response", () => {
      const result = accepted({
        body: { message: "Request accepted for processing" },
      });

      expect(result).toEqual({
        body: { message: "Request accepted for processing" },
        statusCode: 202,
        type: "success",
      });
    });

    it("should accept string shorthand", () => {
      const result = accepted("Request accepted for processing");

      expect(result).toEqual({
        body: { message: "Request accepted for processing" },
        statusCode: 202,
        type: "success",
      });
    });

    it("should create response without payload", () => {
      const result = accepted();

      expect(result).toEqual({
        statusCode: 202,
        type: "success",
      });
    });
  });

  describe("badRequest (400)", () => {
    it("should create a 400 Bad Request error response", () => {
      const result = badRequest({
        body: { message: "Invalid input provided" },
      });

      expect(result).toEqual({
        error: {
          body: {
            message: "Invalid input provided",
          },
          statusCode: 400,
        },
        type: "error",
      });
    });

    it("should accept string shorthand", () => {
      const result = badRequest("Invalid input provided");

      expect(result).toEqual({
        error: {
          body: {
            message: "Invalid input provided",
          },
          statusCode: 400,
        },
        type: "error",
      });
    });
  });

  describe("unauthorized (401)", () => {
    it("should create a 401 Unauthorized error response", () => {
      const result = unauthorized({
        body: { message: "Authentication required" },
      });

      expect(result).toEqual({
        error: {
          body: {
            message: "Authentication required",
          },
          statusCode: 401,
        },
        type: "error",
      });
    });
  });

  describe("forbidden (403)", () => {
    it("should create a 403 Forbidden error response", () => {
      const result = forbidden({ body: { message: "Access denied" } });

      expect(result).toEqual({
        error: {
          body: {
            message: "Access denied",
          },
          statusCode: 403,
        },
        type: "error",
      });
    });
  });

  describe("notFound (404)", () => {
    it("should create a 404 Not Found error response", () => {
      const result = notFound({ body: { message: "Resource not found" } });

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

    it("should accept string shorthand", () => {
      const result = notFound("Resource not found");

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
  });

  describe("methodNotAllowed (405)", () => {
    it("should create a 405 Method Not Allowed error response", () => {
      const result = methodNotAllowed({
        body: { message: "Method not allowed" },
      });

      expect(result).toEqual({
        error: {
          body: {
            message: "Method not allowed",
          },
          statusCode: 405,
        },
        type: "error",
      });
    });

    it("should accept string shorthand", () => {
      const result = methodNotAllowed("Method not allowed");

      expect(result).toEqual({
        error: {
          body: {
            message: "Method not allowed",
          },
          statusCode: 405,
        },
        type: "error",
      });
    });
  });

  describe("internalServerError (500)", () => {
    it("should create a 500 Internal Server Error response", () => {
      const result = internalServerError({
        body: { message: "Internal server error" },
      });

      expect(result).toEqual({
        error: {
          body: {
            message: "Internal server error",
          },
          statusCode: 500,
        },
        type: "error",
      });
    });

    it("should accept string shorthand", () => {
      const result = internalServerError("Internal server error");

      expect(result).toEqual({
        error: {
          body: {
            message: "Internal server error",
          },
          statusCode: 500,
        },
        type: "error",
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
