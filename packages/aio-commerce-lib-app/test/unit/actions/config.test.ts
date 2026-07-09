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

import { beforeEach, describe, expect, test, vi } from "vitest";

const {
  byScopeIdMock,
  getConfigurationMock,
  initializeMock,
  setConfigurationMock,
} = vi.hoisted(() => ({
  byScopeIdMock: vi.fn((scopeId: string) => ({ scopeId })),
  getConfigurationMock: vi.fn(),
  initializeMock: vi.fn(),
  setConfigurationMock: vi.fn(),
}));

vi.mock("@adobe/aio-commerce-lib-config", async () => {
  const actual = await vi.importActual<
    typeof import("@adobe/aio-commerce-lib-config")
  >("@adobe/aio-commerce-lib-config");

  return {
    ...actual,
    byScopeId: byScopeIdMock,
    getConfiguration: getConfigurationMock,
    initialize: initializeMock,
    setConfiguration: setConfigurationMock,
  };
});

import { resolveBusinessConfigSchema } from "@adobe/aio-commerce-lib-config";

import { configRuntimeAction } from "#actions/config/index";
import { createRuntimeActionParams } from "#test/fixtures/actions";

import type { BusinessConfigSchema } from "@adobe/aio-commerce-lib-config";
import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";

const configSchema = [
  {
    default: "",
    description: "Commerce API key",
    label: "API Key",
    name: "apiKey",
    type: "password",
  },
  {
    default: "sandbox",
    description: "App mode",
    label: "Mode",
    name: "mode",
    type: "text",
  },
] satisfies BusinessConfigSchema;

const envScopedSchema = [
  { label: "Shared", name: "shared", type: "text" },
  { env: ["paas"], label: "PaaS", name: "paasOnly", type: "text" },
  { env: ["saas"], label: "SaaS", name: "saasOnly", type: "text" },
] satisfies BusinessConfigSchema;

describe("configRuntimeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    byScopeIdMock.mockImplementation((scopeId: string) => ({ scopeId }));
    initializeMock.mockImplementation(
      async ({
        schema,
        params,
      }: {
        schema: BusinessConfigSchema;
        params?: RuntimeActionParams;
      }) => ({
        configSchema: params
          ? await resolveBusinessConfigSchema(schema, params)
          : schema,
      }),
    );
  });

  describe("GET /", () => {
    test("masks password values when retrieving configuration", async () => {
      getConfigurationMock.mockResolvedValue({
        config: [
          { name: "apiKey", origin: "scope", value: "super-secret" },
          { name: "mode", origin: "scope", value: "live" },
        ],
        scopeId: "store-1",
      });

      const handler = configRuntimeAction({ configSchema });

      const result = await handler(
        createRuntimeActionParams({
          AIO_COMMERCE_CONFIG_ENCRYPTION_KEY: "encryption-key",
          query: "scopeId=store-1",
        }),
      );

      expect(result).toMatchObject({
        body: {
          values: {
            config: expect.arrayContaining([
              { name: "apiKey", origin: "scope", value: "*****" },
            ]),
          },
        },
      });
    });

    test("returns a 400 error when the scope id query parameter is missing", async () => {
      const handler = configRuntimeAction({ configSchema });

      const result = await handler(createRuntimeActionParams());

      expect(result).toMatchObject({
        error: { statusCode: 400 },
        type: "error",
      });
    });

    test("returns full schema when commerceEnv is omitted", async () => {
      getConfigurationMock.mockResolvedValue({
        config: [],
        scopeId: "store-1",
      });

      const handler = configRuntimeAction({ configSchema: envScopedSchema });

      const result = await handler(
        createRuntimeActionParams({ query: "scopeId=store-1" }),
      );

      expect(result).toMatchObject({ statusCode: 200, type: "success" });
      expect.assert(result.type === "success");
      expect.assert(result.body);

      const responseSchema = result.body.schema as BusinessConfigSchema;
      expect(responseSchema.map((field) => field.name)).toEqual([
        "shared",
        "paasOnly",
        "saasOnly",
      ]);

      expect(initializeMock).toHaveBeenCalledWith({
        params: expect.anything(),
        schema: expect.arrayContaining([
          expect.objectContaining({ name: "shared" }),
          expect.objectContaining({ name: "paasOnly" }),
          expect.objectContaining({ name: "saasOnly" }),
        ]),
      });
    });

    test("filters schema by commerceEnv=paas", async () => {
      getConfigurationMock.mockResolvedValue({
        config: [],
        scopeId: "store-1",
      });

      const handler = configRuntimeAction({ configSchema: envScopedSchema });

      const result = await handler(
        createRuntimeActionParams({
          query: "scopeId=store-1&commerceEnv=paas",
        }),
      );

      expect(result).toMatchObject({ statusCode: 200, type: "success" });
      expect.assert(result.type === "success");
      expect.assert(result.body);

      const responseSchema = result.body.schema as BusinessConfigSchema;
      expect(responseSchema.map((field) => field.name)).toEqual([
        "shared",
        "paasOnly",
      ]);

      expect(initializeMock).toHaveBeenCalledWith({
        params: expect.anything(),
        schema: expect.arrayContaining([
          expect.objectContaining({ name: "shared" }),
          expect.objectContaining({ name: "paasOnly" }),
        ]),
      });
    });

    test("filters schema by commerceEnv=saas", async () => {
      getConfigurationMock.mockResolvedValue({
        config: [],
        scopeId: "store-1",
      });

      const handler = configRuntimeAction({ configSchema: envScopedSchema });

      const result = await handler(
        createRuntimeActionParams({
          query: "scopeId=store-1&commerceEnv=saas",
        }),
      );

      expect(result).toMatchObject({ statusCode: 200, type: "success" });
      expect.assert(result.type === "success");
      expect.assert(result.body);

      const responseSchema = result.body.schema as BusinessConfigSchema;
      expect(responseSchema.map((field) => field.name)).toEqual([
        "shared",
        "saasOnly",
      ]);
    });

    test("returns 400 when commerceEnv is invalid", async () => {
      const handler = configRuntimeAction({ configSchema: envScopedSchema });

      const result = await handler(
        createRuntimeActionParams({
          query: "scopeId=store-1&commerceEnv=production",
        }),
      );

      expect(result).toMatchObject({
        error: { statusCode: 400 },
        type: "error",
      });
    });

    test("resolves dynamicList options before responding", async () => {
      getConfigurationMock.mockResolvedValue({
        config: [],
        scopeId: "store-1",
      });

      const dynamicSchema = [
        {
          default: (opts) => opts[0].value,
          label: "Payment Method",
          name: "paymentMethod",
          options: () => [
            { label: "Braintree", value: "braintree" },
            { label: "PayPal", value: "paypal" },
          ],
          selectionMode: "single",
          type: "dynamicList",
        },
      ] satisfies BusinessConfigSchema;

      const handler = configRuntimeAction({ configSchema: dynamicSchema });

      const result = await handler(
        createRuntimeActionParams({ query: "scopeId=store-1" }),
      );

      expect(result).toMatchObject({ statusCode: 200, type: "success" });
      expect.assert(result.type === "success");
      expect.assert(result.body);

      const responseSchema = result.body.schema as BusinessConfigSchema;
      expect(responseSchema[0]).toMatchObject({
        default: "braintree",
        name: "paymentMethod",
        options: [
          { label: "Braintree", value: "braintree" },
          { label: "PayPal", value: "paypal" },
        ],
        selectionMode: "single",
        type: "list",
      });

      // The handler passes the unresolved schema to initialize; resolution
      // happens inside initialize itself.
      expect(initializeMock).toHaveBeenCalledWith({
        params: expect.anything(),
        schema: expect.arrayContaining([
          expect.objectContaining({
            name: "paymentMethod",
            type: "dynamicList",
          }),
        ]),
      });
    });
  });

  describe("PUT /", () => {
    test("filters masked password values before saving", async () => {
      setConfigurationMock.mockResolvedValue({
        config: [],
        scopeId: "store-1",
      });

      const handler = configRuntimeAction({ configSchema });

      await handler(
        createRuntimeActionParams({
          body: {
            config: [
              { name: "apiKey", value: "*****" },
              { name: "mode", value: "live" },
            ],
            scopeId: "store-1",
          },
          method: "put",
        }),
      );

      expect(setConfigurationMock).toHaveBeenCalledWith(
        { config: [{ name: "mode", value: "live" }] },
        expect.any(Object),
        expect.any(Object),
      );
    });

    test("sets Cache-Control: no-store on the response", async () => {
      setConfigurationMock.mockResolvedValue({
        config: [],
        scopeId: "store-1",
      });

      const handler = configRuntimeAction({ configSchema });

      const result = await handler(
        createRuntimeActionParams({
          body: {
            config: [{ name: "mode", value: "live" }],
            scopeId: "store-1",
          },
          method: "put",
        }),
      );

      expect(result).toMatchObject({
        headers: { "Cache-Control": "no-store" },
      });
    });

    test("rejects null values", async () => {
      const handler = configRuntimeAction({ configSchema });

      const result = await handler(
        createRuntimeActionParams({
          body: {
            config: [{ name: "apiKey", value: null }],
            scopeId: "store-1",
          },
          method: "put",
        }),
      );

      expect(setConfigurationMock).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        error: { statusCode: 400 },
        type: "error",
      });
    });
  });

  describe("PATCH /", () => {
    test("accepts null values as unsets", async () => {
      setConfigurationMock.mockResolvedValue({
        config: [],
        scopeId: "store-1",
      });

      const handler = configRuntimeAction({ configSchema });

      await handler(
        createRuntimeActionParams({
          body: {
            config: [{ name: "apiKey", value: null }],
            scopeId: "store-1",
          },
          method: "patch",
        }),
      );

      expect(setConfigurationMock).toHaveBeenCalledWith(
        { config: [{ name: "apiKey", value: null }] },
        expect.any(Object),
        expect.any(Object),
      );
    });

    test("sets Cache-Control: no-store on the response", async () => {
      setConfigurationMock.mockResolvedValue({
        config: [],
        scopeId: "store-1",
      });

      const handler = configRuntimeAction({ configSchema });

      const result = await handler(
        createRuntimeActionParams({
          body: {
            config: [{ name: "mode", value: "live" }],
            scopeId: "store-1",
          },
          method: "patch",
        }),
      );

      expect(result).toMatchObject({
        headers: { "Cache-Control": "no-store" },
      });
    });
  });
});
