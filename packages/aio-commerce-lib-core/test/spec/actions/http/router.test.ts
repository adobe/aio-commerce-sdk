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

import { minLength, object, optional, pipe, string } from "valibot";
import { describe, expect, it } from "vitest";

import { HttpActionRouter } from "#actions/http/router";
import { ok } from "#responses/presets";

import type { RuntimeActionParams } from "#params/types";

describe("actions/http/router", () => {
  describe("route matching", () => {
    it("should match GET /users/:id and extract params", async () => {
      const router = new HttpActionRouter();

      router.get("/users/:id", {
        handler: (req, ctx) =>
          ok({ body: { id: req.params.id, context: !!ctx } }),
      });

      const handler = router.handler();
      const result = await handler({
        __ow_method: "get",
        __ow_path: "/users/123",
      } as RuntimeActionParams);

      expect(result).toMatchObject({
        type: "success",
        statusCode: 200,
        body: { id: "123", context: true },
      });
    });

    it("should match path without leading slash", async () => {
      const router = new HttpActionRouter();

      router.get("/products/:sku", {
        handler: (req) => ok({ body: { sku: req.params.sku } }),
      });

      const handler = router.handler();
      const result = await handler({
        __ow_method: "get",
        __ow_path: "products/ABC-123",
      } as RuntimeActionParams);

      expect(result).toMatchObject({
        type: "success",
        statusCode: 200,
        body: { sku: "ABC-123" },
      });
    });

    it("should match multiple params", async () => {
      const router = new HttpActionRouter();

      router.get("/orgs/:orgId/users/:userId", {
        handler: (req) =>
          ok({ body: { orgId: req.params.orgId, userId: req.params.userId } }),
      });

      const handler = router.handler();
      const result = await handler({
        __ow_method: "get",
        __ow_path: "/orgs/org-1/users/user-2",
      } as RuntimeActionParams);

      expect(result).toMatchObject({
        type: "success",
        statusCode: 200,
        body: { orgId: "org-1", userId: "user-2" },
      });
    });
  });

  describe("route not found (404)", () => {
    it("should return 404 when no route matches the path", async () => {
      const router = new HttpActionRouter();

      router.get("/users", {
        handler: () => ok({ body: { users: [] } }),
      });

      const handler = router.handler();
      const result = await handler({
        __ow_method: "get",
        __ow_path: "/products",
      } as RuntimeActionParams);

      expect(result).toMatchObject({
        type: "error",
        error: {
          statusCode: 404,
          body: { message: "No route matches /products" },
        },
      });
    });
  });

  describe("method not allowed (405)", () => {
    it("should return 405 when path matches but method does not", async () => {
      const router = new HttpActionRouter();

      router.get("/users", {
        handler: () => ok({ body: { users: [] } }),
      });

      const handler = router.handler();
      const result = await handler({
        __ow_method: "post",
        __ow_path: "/users",
      } as RuntimeActionParams);

      expect(result).toMatchObject({
        type: "error",
        error: {
          statusCode: 405,
          body: { message: "Method POST not allowed" },
        },
      });
    });

    it("should return 405 with correct method when multiple routes exist", async () => {
      const router = new HttpActionRouter();

      router.get("/items/:id", {
        handler: () => ok({ body: {} }),
      });
      router.put("/items/:id", {
        handler: () => ok({ body: {} }),
      });

      const handler = router.handler();
      const result = await handler({
        __ow_method: "delete",
        __ow_path: "/items/123",
      } as RuntimeActionParams);

      expect(result).toMatchObject({
        type: "error",
        error: {
          statusCode: 405,
          body: { message: "Method DELETE not allowed" },
        },
      });
    });
  });

  describe("schema validation", () => {
    it("should validate params schema and return 400 on failure", async () => {
      const router = new HttpActionRouter();

      router.get("/users/:id", {
        params: object({ id: pipe(string(), minLength(5)) }),
        handler: (req) => ok({ body: { id: req.params.id } }),
      });

      const handler = router.handler();
      const result = await handler({
        __ow_method: "get",
        __ow_path: "/users/abc",
      } as RuntimeActionParams);

      expect(result).toMatchObject({
        type: "error",
        error: {
          statusCode: 400,
          body: { message: "Invalid route parameters" },
        },
      });
    });

    it("should validate body schema and return 400 on failure", async () => {
      const router = new HttpActionRouter();

      router.post("/users", {
        body: object({ name: string(), email: string() }),
        handler: (req) => ok({ body: req.body }),
      });

      const handler = router.handler();
      const result = await handler({
        __ow_method: "post",
        __ow_path: "/users",
        __ow_body: JSON.stringify({ name: "John" }),
      } as RuntimeActionParams);

      expect(result).toMatchObject({
        type: "error",
        error: {
          statusCode: 400,
          body: { message: "Invalid request body" },
        },
      });
    });

    it("should validate query schema and return 400 on failure", async () => {
      const router = new HttpActionRouter();

      router.get("/search", {
        query: object({ q: pipe(string(), minLength(1)) }),
        handler: (req) => ok({ body: { query: req.query.q } }),
      });

      const handler = router.handler();
      const result = await handler({
        __ow_method: "get",
        __ow_path: "/search",
        __ow_query: "q=",
      } as RuntimeActionParams);

      expect(result).toMatchObject({
        type: "error",
        error: {
          statusCode: 400,
          body: { message: "Invalid query parameters" },
        },
      });
    });

    it("should pass valid data through schema validation", async () => {
      const router = new HttpActionRouter();

      router.post("/users/:id", {
        params: object({ id: string() }),
        body: object({ name: string() }),
        query: object({ format: optional(string()) }),
        handler: (req) =>
          ok({
            body: {
              id: req.params.id,
              name: req.body.name,
              format: req.query.format,
            },
          }),
      });

      const handler = router.handler();
      const result = await handler({
        __ow_method: "post",
        __ow_path: "/users/u123",
        __ow_body: JSON.stringify({ name: "Alice" }),
        __ow_query: "format=json",
      } as RuntimeActionParams);

      expect(result).toMatchObject({
        type: "success",
        statusCode: 200,
        body: { id: "u123", name: "Alice", format: "json" },
      });
    });
  });

  describe("context builders with .use()", () => {
    it("should add context via .use() builder", async () => {
      const router = new HttpActionRouter();

      router.use(() => ({
        requestId: "req-123",
        timestamp: 1_234_567_890,
      }));

      router.get("/info", {
        handler: (_req, ctx) => {
          const context = ctx as unknown as {
            requestId: string;
            timestamp: number;
          };
          return ok({
            body: {
              requestId: context.requestId,
              timestamp: context.timestamp,
            },
          });
        },
      });

      const handler = router.handler();
      const result = await handler({
        __ow_method: "get",
        __ow_path: "/info",
      } as RuntimeActionParams);

      expect(result).toMatchObject({
        type: "success",
        statusCode: 200,
        body: { requestId: "req-123", timestamp: 1_234_567_890 },
      });
    });

    it("should merge multiple context builders in order", async () => {
      const router = new HttpActionRouter();

      router.use(() => ({ first: "one" }));
      router.use(() => ({ second: "two" }));
      router.use(() => ({ third: "three" }));

      router.get("/ctx", {
        handler: (_req, ctx) => {
          const c = ctx as unknown as {
            first: string;
            second: string;
            third: string;
          };
          return ok({
            body: { first: c.first, second: c.second, third: c.third },
          });
        },
      });

      const handler = router.handler();
      const result = await handler({
        __ow_method: "get",
        __ow_path: "/ctx",
      } as RuntimeActionParams);

      expect(result).toMatchObject({
        type: "success",
        statusCode: 200,
        body: { first: "one", second: "two", third: "three" },
      });
    });

    it("should support async context builders", async () => {
      const router = new HttpActionRouter();

      router.use(async () => {
        await Promise.resolve();
        return { asyncValue: "loaded" };
      });

      router.get("/async", {
        handler: (_req, ctx) => {
          const c = ctx as unknown as { asyncValue: string };
          return ok({ body: { value: c.asyncValue } });
        },
      });

      const handler = router.handler();
      const result = await handler({
        __ow_method: "get",
        __ow_path: "/async",
      } as RuntimeActionParams);

      expect(result).toMatchObject({
        type: "success",
        statusCode: 200,
        body: { value: "loaded" },
      });
    });

    it("should provide raw params in base context", async () => {
      const router = new HttpActionRouter();

      router.use((base) => ({
        hasRaw: !!base.rawParams,
        method: base.rawParams.__ow_method,
      }));

      router.get("/raw", {
        handler: (_req, ctx) => {
          const c = ctx as unknown as { hasRaw: boolean; method: string };
          return ok({ body: { hasRaw: c.hasRaw, method: c.method } });
        },
      });

      const handler = router.handler();
      const result = await handler({
        __ow_method: "get",
        __ow_path: "/raw",
      } as RuntimeActionParams);

      expect(result).toMatchObject({
        type: "success",
        statusCode: 200,
        body: { hasRaw: true, method: "get" },
      });
    });
  });

  describe("handler receives (req, ctx) as separate parameters", () => {
    it("should pass req and ctx as separate parameters to handler", async () => {
      const router = new HttpActionRouter();
      let receivedReq: unknown;
      let receivedCtx: unknown;

      router.get("/test/:id", {
        handler: (req, ctx) => {
          receivedReq = req;
          receivedCtx = ctx;
          return ok({ body: {} });
        },
      });

      const handler = router.handler();
      await handler({
        __ow_method: "get",
        __ow_path: "/test/456",
        __ow_headers: { "content-type": "application/json" },
      } as RuntimeActionParams);

      expect(receivedReq).toMatchObject({
        params: { id: "456" },
        method: "GET",
        path: "/test/456",
        headers: { "content-type": "application/json" },
      });

      expect(receivedCtx).toMatchObject({
        rawParams: expect.objectContaining({
          __ow_method: "get",
          __ow_path: "/test/456",
        }),
      });
    });
  });

  describe("HTTP method handlers", () => {
    it.each([
      ["get", "GET"],
      ["post", "POST"],
      ["put", "PUT"],
      ["patch", "PATCH"],
      ["delete", "DELETE"],
    ])("should handle .%s() method", async (method, uppercase) => {
      const router = new HttpActionRouter();
      const routerAny = router as unknown as Record<string, CallableFunction>;

      routerAny[method]("/resource", {
        handler: (req: { method: string }) =>
          ok({ body: { method: req.method } }),
      });

      const handler = router.handler();
      const result = await handler({
        __ow_method: method,
        __ow_path: "/resource",
      } as RuntimeActionParams);

      expect(result).toMatchObject({
        type: "success",
        statusCode: 200,
        body: { method: uppercase },
      });
    });
  });
});
