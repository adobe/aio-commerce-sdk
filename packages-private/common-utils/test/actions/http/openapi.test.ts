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

import { ok } from "@adobe/aio-commerce-lib-core/responses";
import * as v from "valibot";
import { describe, expect, it } from "vitest";

import { generateOpenAPISpec } from "#actions/http/openapi/spec";
import { HttpActionRouter } from "#actions/http/router";

const COMPONENT_REF_RE = /^#\/components\/schemas\//;

describe("actions/http/openapi", () => {
  it("should generate operation metadata and explicit response descriptions", () => {
    const router = new HttpActionRouter();
    router.get("/users/:id", {
      metadata: {
        description: "Returns a user by id.",
        operationId: "getUser",
        responses: {
          200: {
            description: "User found.",
            schema: v.pipe(
              v.object({ id: v.string() }),
              v.metadata({ description: "Schema fallback description." }),
            ),
          },
        },
        security: [{ imsOAuth: ["read:user"] }],
        summary: "Get user",
        tags: ["Users"],
      },

      params: v.object({ id: v.string() }),
      handler: () => ok(),
    });

    const spec = generateOpenAPISpec(
      { prefix: "/api", router },
      { title: "Test API", version: "1.0.0" },
    );

    expect(spec.paths["/api/users/{id}"]?.get).toMatchObject({
      description: "Returns a user by id.",
      operationId: "getUser",
      responses: {
        "200": {
          content: {
            "application/json": {
              schema: {
                properties: { id: { type: "string" } },
                type: "object",
              },
            },
          },
          description: "User found.",
        },
      },

      security: [{ imsOAuth: ["read:user"] }],
      summary: "Get user",
      tags: ["Users"],
    });
  });

  it("should allow route metadata to override operation security", () => {
    const router = new HttpActionRouter();
    router.post("/admin", {
      metadata: {
        responses: { 200: { description: "Admin action completed." } },
        security: [{ imsOAuth: ["admin:write"] }],
      },
      handler: () => ok(),
    });

    const spec = generateOpenAPISpec(
      { router },
      { title: "Test API", version: "1.0.0" },
      { security: [{ imsOAuth: [] }] },
    );

    expect(spec.security).toEqual([{ imsOAuth: [] }]);
    expect(spec.paths["/admin"]?.post?.security).toEqual([
      { imsOAuth: ["admin:write"] },
    ]);
  });

  it("should add only operation-level router managed responses", () => {
    const router = new HttpActionRouter();
    router.get("/health", {
      metadata: {
        responses: { 200: { description: "Service is healthy." } },
      },
      handler: () => ok(),
    });
    router.post("/users/:id", {
      body: v.object({ name: v.string() }),
      metadata: {
        responses: { 201: { description: "User created." } },
      },
      params: v.object({ id: v.string() }),
      handler: () => ok(),
    });

    const spec = generateOpenAPISpec(
      { router },
      { title: "Test API", version: "1.0.0" },
    );

    expect(Object.keys(spec.paths["/health"]?.get?.responses ?? {})).toEqual([
      "200",
      "500",
    ]);
    expect(
      Object.keys(spec.paths["/users/{id}"]?.post?.responses ?? {}),
    ).toEqual(["201", "400", "500"]);
  });

  it("should omit internal routes from the generated spec", () => {
    const router = new HttpActionRouter();
    router.get("/public", {
      metadata: {
        responses: { 200: { description: "Public route returned." } },
      },
      handler: () => ok(),
    });
    router.get("/internal", {
      metadata: { internal: true },
      handler: () => ok(),
    });

    const spec = generateOpenAPISpec(
      { router },
      {
        title: "Test API",
        version: "1.0.0",
      },
    );

    expect(spec.paths["/public"]).toBeDefined();
    expect(spec.paths["/internal"]).toBeUndefined();
  });

  it("should preserve explicit Redocly-friendly document metadata", () => {
    const router = new HttpActionRouter();
    router.get("/", {
      metadata: {
        operationId: "listUsers",
        responses: { 200: { description: "Users listed." } },
        summary: "List users",
      },
      handler: () => ok(),
    });

    const spec = generateOpenAPISpec(
      { prefix: "/users", router },
      {
        license: { name: "Apache-2.0" },
        title: "Test API",
        version: "1.0.0",
      },
      {
        security: [{ imsOAuth: [] }],
        securitySchemes: {
          imsOAuth: {
            flows: {
              clientCredentials: {
                scopes: {
                  openid: "Authenticate with Adobe IMS.",
                },
                tokenUrl: "https://ims-na1.adobelogin.com/ims/token/v3",
              },
            },
            type: "oauth2",
          },
        },
        servers: [{ url: "/" }],
      },
    );

    expect(spec.paths["/users"]?.get).toMatchObject({
      operationId: "listUsers",
      summary: "List users",
    });

    expect(spec.paths["/users/"]).toBeUndefined();
    expect(spec.servers).toEqual([{ url: "/" }]);
    expect(spec.security).toEqual([{ imsOAuth: [] }]);
    expect(spec.components?.securitySchemes).toEqual({
      imsOAuth: {
        flows: {
          clientCredentials: {
            scopes: {
              openid: "Authenticate with Adobe IMS.",
            },
            tokenUrl: "https://ims-na1.adobelogin.com/ims/token/v3",
          },
        },
        type: "oauth2",
      },
    });
  });

  it("should not invent operation metadata", () => {
    const router = new HttpActionRouter();
    router.get("/implicit", {
      metadata: {
        responses: { 200: { description: "Implicit operation returned." } },
      },
      handler: () => ok(),
    });

    const spec = generateOpenAPISpec(
      { router },
      {
        title: "Test API",
        version: "1.0.0",
      },
    );

    expect(spec.paths["/implicit"]?.get).not.toHaveProperty("operationId");
    expect(spec.paths["/implicit"]?.get).not.toHaveProperty("summary");
  });

  it("should throw unsupported schema conversions in strict mode", () => {
    const router = new HttpActionRouter();
    router.post("/checked", {
      body: v.pipe(
        v.string(),
        v.check((value) => value.length > 0),
      ),
      handler: () => ok(),
    });

    expect(() =>
      generateOpenAPISpec(
        { router },
        {
          title: "Test API",
          version: "1.0.0",
        },
        { schemaErrorMode: "throw" },
      ),
    ).toThrow("Failed to convert Valibot schema to JSON Schema");
  });

  it("should omit unsupported schemas in default mode without dropping operations", () => {
    const router = new HttpActionRouter();
    router.post("/checked", {
      body: v.pipe(
        v.string(),
        v.check((value) => value.length > 0),
      ),
      metadata: {
        responses: {
          200: {
            description: "Checked.",
            schema: v.pipe(
              v.string(),
              v.check((value) => value.length > 0),
            ),
          },
        },
      },
      handler: () => ok(),
    });

    const spec = generateOpenAPISpec(
      { router },
      {
        title: "Test API",
        version: "1.0.0",
      },
    );

    const operation = spec.paths["/checked"]?.post;
    const successResponse = operation?.responses?.["200"];

    expect(operation).toBeDefined();
    expect(operation).not.toHaveProperty("requestBody");
    expect(successResponse).toEqual({ description: "Checked." });
  });

  it("should hoist JSON Schema definitions from embedded route schemas", () => {
    const router = new HttpActionRouter();
    const TreeSchema: v.GenericSchema = v.pipe(
      v.object({
        children: v.optional(v.array(v.lazy(() => TreeSchema))),
        name: v.string(),
      }),
      v.title("Tree Node"),
    );

    router.post("/trees", {
      body: TreeSchema,
      metadata: {
        responses: {
          200: { schema: TreeSchema },
        },
      },

      handler: () => ok(),
    });

    const spec = generateOpenAPISpec(
      { router },
      {
        title: "Test API",
        version: "1.0.0",
      },
    );

    const operation = spec.paths["/trees"]?.post;
    const requestBody = operation?.requestBody;
    const successResponse = operation?.responses?.["200"];

    const bodySchema =
      requestBody && !("$ref" in requestBody)
        ? requestBody.content["application/json"]?.schema
        : undefined;

    const responseSchema =
      successResponse && !("$ref" in successResponse)
        ? successResponse.content?.["application/json"]?.schema
        : undefined;

    expect(bodySchema).toBeDefined();
    expect(responseSchema).toBeDefined();
    expect(bodySchema).not.toHaveProperty("$schema");
    expect(bodySchema).not.toHaveProperty("$defs");
    expect(bodySchema).toMatchObject({
      properties: {
        children: {
          items: { $ref: expect.stringMatching(COMPONENT_REF_RE) },
        },
      },
    });

    expect(responseSchema).not.toHaveProperty("$defs");
    expect(spec.components?.schemas).toBeDefined();
  });

  it("should omit untitled recursive schemas in default mode", () => {
    const router = new HttpActionRouter();
    const TreeSchema: v.GenericSchema = v.object({
      children: v.optional(v.array(v.lazy(() => TreeSchema))),
      name: v.string(),
    });

    router.post("/trees", {
      body: TreeSchema,
      metadata: {
        responses: {
          200: { schema: TreeSchema },
        },
      },
      handler: () => ok(),
    });

    const spec = generateOpenAPISpec(
      { router },
      {
        title: "Test API",
        version: "1.0.0",
      },
    );

    const operation = spec.paths["/trees"]?.post;

    expect(operation).toBeDefined();
    expect(operation).not.toHaveProperty("requestBody");
    expect(operation?.responses?.["200"]).toEqual({
      description:
        "The request was successful and the response body contains the representation requested.",
    });
    expect(spec.components?.schemas).toBeUndefined();
  });

  it("should throw for untitled recursive schemas in strict mode", () => {
    const router = new HttpActionRouter();
    const TreeSchema: v.GenericSchema = v.object({
      children: v.optional(v.array(v.lazy(() => TreeSchema))),
      name: v.string(),
    });

    router.post("/trees", {
      body: TreeSchema,
      metadata: {
        responses: { 200: { description: "Tree saved." } },
      },
      handler: () => ok(),
    });

    expect(() =>
      generateOpenAPISpec(
        { router },
        {
          title: "Test API",
          version: "1.0.0",
        },
        { schemaErrorMode: "throw" },
      ),
    ).toThrow("Failed to convert Valibot schema to JSON Schema");
  });

  it("should use schema titles for component names", () => {
    const router = new HttpActionRouter();
    const TreeSchema: v.GenericSchema = v.pipe(
      v.object({
        children: v.optional(v.array(v.lazy(() => TreeSchema))),
        name: v.string(),
      }),
      v.title("Tree Node"),
    );

    router.post("/trees", {
      body: TreeSchema,
      metadata: {
        responses: { 200: { description: "Tree saved." } },
      },
      handler: () => ok(),
    });

    const spec = generateOpenAPISpec(
      { router },
      {
        title: "Test API",
        version: "1.0.0",
      },
    );

    expect(spec.components?.schemas).toHaveProperty("TreeNode");
    expect(JSON.stringify(spec.paths["/trees"])).toContain(
      "#/components/schemas/TreeNode",
    );
  });

  it("should throw for duplicate schema titles with different shapes in strict mode", () => {
    const router = new HttpActionRouter();
    const RequestSchema: v.GenericSchema = v.pipe(
      v.object({
        child: v.lazy(() => RequestSchema),
        value: v.string(),
      }),
      v.title("Duplicate"),
    );

    const ResponseSchema: v.GenericSchema = v.pipe(
      v.object({
        child: v.lazy(() => ResponseSchema),
        value: v.number(),
      }),
      v.title("Duplicate"),
    );

    router.post("/duplicates", {
      body: RequestSchema,
      metadata: {
        responses: {
          200: { schema: ResponseSchema },
        },
      },
      handler: () => ok(),
    });

    expect(() =>
      generateOpenAPISpec(
        { router },
        {
          title: "Test API",
          version: "1.0.0",
        },
        { schemaErrorMode: "throw" },
      ),
    ).toThrow("Failed to convert Valibot schema to JSON Schema");
  });
});
