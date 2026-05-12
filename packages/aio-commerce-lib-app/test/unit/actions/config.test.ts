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

import { describe, expect, test, vi } from "vitest";

import { configRuntimeAction } from "#actions/config";
import {
  schemaWithDynamicListOptions,
  schemaWithStaticListOptions,
} from "#test/fixtures/business-config";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";

vi.mock("@adobe/aio-commerce-lib-config", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@adobe/aio-commerce-lib-config")>();

  return {
    ...actual,
    byScopeId: vi.fn((scopeId: string) => ({
      by: { _tag: "scopeId", scopeId },
    })),
    getConfiguration: vi.fn(async () => ({
      scope: { id: "scope-1", code: "global", level: "global" },
      config: [],
    })),
    initialize: vi.fn(async ({ params, schema }) => ({
      configSchema: params
        ? await actual.resolveBusinessConfigSchema(schema, params)
        : schema,
    })),
    setConfiguration: vi.fn(async () => ({
      message: "Configuration values updated successfully",
      scope: { id: "scope-1", code: "global", level: "global" },
      config: [{ name: "currency", value: "USD" }],
    })),
  };
});

vi.mock("@aio-commerce-sdk/common-utils/actions", async () => {
  const [actual, fixtures] = await Promise.all([
    vi.importActual<typeof import("@aio-commerce-sdk/common-utils/actions")>(
      "@aio-commerce-sdk/common-utils/actions",
    ),
    vi.importActual<typeof import("#test/fixtures/installation")>(
      "#test/fixtures/installation",
    ),
  ]);

  return {
    ...actual,
    logger: vi.fn(() => () => ({
      logger: fixtures.createMockLogger(),
    })),
  };
});

describe("configRuntimeAction", () => {
  describe("GET /", () => {
    const mockParams = {
      __ow_method: "get",
      __ow_path: "/",
      __ow_headers: {},
      __ow_query: "scopeId=scope-1",
    } satisfies RuntimeActionParams;

    test("returns resolved schema with dynamic options", async () => {
      const result = await configRuntimeAction({
        configSchema: schemaWithDynamicListOptions,
      })(mockParams);

      expect(result).toMatchObject({
        type: "success",
        statusCode: 200,
        body: {
          schema: [{ options: [{ label: "Braintree", value: "braintree" }] }],
        },
      });
    });

    test("returns schema as-is when all list options are static", async () => {
      const result = await configRuntimeAction({
        configSchema: schemaWithStaticListOptions,
      })(mockParams);

      expect(result).toMatchObject({
        type: "success",
        statusCode: 200,
        body: {
          schema: [{ options: [{ label: "Braintree", value: "braintree" }] }],
        },
      });
    });
  });

  describe("PUT /", () => {
    test("resolves schema and delegates to setConfiguration", async () => {
      const params = {
        __ow_method: "put",
        __ow_path: "/",
        __ow_headers: {},
        __ow_body: JSON.stringify({
          scopeId: "scope-1",
          config: [{ name: "currency", value: "EUR" }],
        }),
      } satisfies RuntimeActionParams;

      const result = await configRuntimeAction({
        configSchema: schemaWithStaticListOptions,
      })(params);

      expect(result).toMatchObject({
        type: "success",
        statusCode: 200,
        body: {
          message: "Configuration values updated successfully",
          scope: { id: "scope-1" },
        },
      });
    });
  });

  describe("PATCH /", () => {
    test("resolves schema and delegates to setConfiguration", async () => {
      const params = {
        __ow_method: "patch",
        __ow_path: "/",
        __ow_headers: {},
        __ow_body: JSON.stringify({
          scopeId: "scope-1",
          config: [{ name: "currency", value: null }],
        }),
      } satisfies RuntimeActionParams;

      const result = await configRuntimeAction({
        configSchema: schemaWithStaticListOptions,
      })(params);

      expect(result).toMatchObject({
        type: "success",
        statusCode: 200,
        body: {
          message: "Configuration values updated successfully",
          scope: { id: "scope-1" },
        },
      });
    });
  });
});
