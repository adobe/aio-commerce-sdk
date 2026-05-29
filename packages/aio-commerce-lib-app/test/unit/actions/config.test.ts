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
    name: "apiKey",
    label: "API Key",
    description: "Commerce API key",
    type: "password",
    default: "",
  },
  {
    name: "mode",
    label: "Mode",
    description: "App mode",
    type: "text",
    default: "sandbox",
  },
] satisfies BusinessConfigSchema;

const envScopedSchema = [
  { name: "shared", type: "text", label: "Shared" },
  { name: "paasOnly", type: "text", label: "PaaS", env: ["paas"] },
  { name: "saasOnly", type: "text", label: "SaaS", env: ["saas"] },
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
        scopeId: "store-1",
        config: [
          { name: "apiKey", value: "super-secret", origin: "scope" },
          { name: "mode", value: "live", origin: "scope" },
        ],
      });

      const handler = configRuntimeAction({ configSchema });

      const result = await handler(
        createRuntimeActionParams({
          query: "scopeId=store-1",
          AIO_COMMERCE_CONFIG_ENCRYPTION_KEY: "encryption-key",
        }),
      );

      expect(result).toMatchObject({
        body: {
          values: {
            config: expect.arrayContaining([
              { name: "apiKey", value: "*****", origin: "scope" },
            ]),
          },
        },
      });
    });

    test("returns a 400 error when the scope id query parameter is missing", async () => {
      const handler = configRuntimeAction({ configSchema });

      const result = await handler(createRuntimeActionParams());

      expect(result).toMatchObject({
        type: "error",
        error: { statusCode: 400 },
      });
    });

    test("returns full schema when commerceEnv is omitted", async () => {
      getConfigurationMock.mockResolvedValue({
        scopeId: "store-1",
        config: [],
      });

      const handler = configRuntimeAction({ configSchema: envScopedSchema });

      const result = await handler(
        createRuntimeActionParams({ query: "scopeId=store-1" }),
      );

      expect(result).toMatchObject({ type: "success", statusCode: 200 });
      expect.assert(result.type === "success");
      expect.assert(result.body);

      const responseSchema = result.body.schema as BusinessConfigSchema;
      expect(responseSchema.map((field) => field.name)).toEqual([
        "shared",
        "paasOnly",
        "saasOnly",
      ]);

      expect(initializeMock).toHaveBeenCalledWith({
        schema: expect.arrayContaining([
          expect.objectContaining({ name: "shared" }),
          expect.objectContaining({ name: "paasOnly" }),
          expect.objectContaining({ name: "saasOnly" }),
        ]),
        params: expect.anything(),
      });
    });

    test("filters schema by commerceEnv=paas", async () => {
      getConfigurationMock.mockResolvedValue({
        scopeId: "store-1",
        config: [],
      });

      const handler = configRuntimeAction({ configSchema: envScopedSchema });

      const result = await handler(
        createRuntimeActionParams({
          query: "scopeId=store-1&commerceEnv=paas",
        }),
      );

      expect(result).toMatchObject({ type: "success", statusCode: 200 });
      expect.assert(result.type === "success");
      expect.assert(result.body);

      const responseSchema = result.body.schema as BusinessConfigSchema;
      expect(responseSchema.map((field) => field.name)).toEqual([
        "shared",
        "paasOnly",
      ]);

      expect(initializeMock).toHaveBeenCalledWith({
        schema: expect.arrayContaining([
          expect.objectContaining({ name: "shared" }),
          expect.objectContaining({ name: "paasOnly" }),
        ]),
        params: expect.anything(),
      });
    });

    test("filters schema by commerceEnv=saas", async () => {
      getConfigurationMock.mockResolvedValue({
        scopeId: "store-1",
        config: [],
      });

      const handler = configRuntimeAction({ configSchema: envScopedSchema });

      const result = await handler(
        createRuntimeActionParams({
          query: "scopeId=store-1&commerceEnv=saas",
        }),
      );

      expect(result).toMatchObject({ type: "success", statusCode: 200 });
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
        type: "error",
        error: { statusCode: 400 },
      });
    });

    test("resolves dynamicList options before responding", async () => {
      getConfigurationMock.mockResolvedValue({
        scopeId: "store-1",
        config: [],
      });

      const dynamicSchema = [
        {
          name: "paymentMethod",
          label: "Payment Method",
          type: "dynamicList",
          selectionMode: "single",
          options: () => [
            { label: "Braintree", value: "braintree" },
            { label: "PayPal", value: "paypal" },
          ],
          default: (opts) => opts[0].value,
        },
      ] satisfies BusinessConfigSchema;

      const handler = configRuntimeAction({ configSchema: dynamicSchema });

      const result = await handler(
        createRuntimeActionParams({ query: "scopeId=store-1" }),
      );

      expect(result).toMatchObject({ type: "success", statusCode: 200 });
      expect.assert(result.type === "success");
      expect.assert(result.body);

      const responseSchema = result.body.schema as BusinessConfigSchema;
      expect(responseSchema[0]).toMatchObject({
        name: "paymentMethod",
        type: "list",
        selectionMode: "single",
        default: "braintree",
        options: [
          { label: "Braintree", value: "braintree" },
          { label: "PayPal", value: "paypal" },
        ],
      });

      // The handler passes the unresolved schema to initialize; resolution
      // happens inside initialize itself.
      expect(initializeMock).toHaveBeenCalledWith({
        schema: expect.arrayContaining([
          expect.objectContaining({
            type: "dynamicList",
            name: "paymentMethod",
          }),
        ]),
        params: expect.anything(),
      });
    });
  });

  describe("PUT /", () => {
    test("filters masked password values before saving", async () => {
      setConfigurationMock.mockResolvedValue({
        scopeId: "store-1",
        config: [],
      });

      const handler = configRuntimeAction({ configSchema });

      await handler(
        createRuntimeActionParams({
          method: "put",
          body: {
            scopeId: "store-1",
            config: [
              { name: "apiKey", value: "*****" },
              { name: "mode", value: "live" },
            ],
          },
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
        scopeId: "store-1",
        config: [],
      });

      const handler = configRuntimeAction({ configSchema });

      const result = await handler(
        createRuntimeActionParams({
          method: "put",
          body: {
            scopeId: "store-1",
            config: [{ name: "mode", value: "live" }],
          },
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
          method: "put",
          body: {
            scopeId: "store-1",
            config: [{ name: "apiKey", value: null }],
          },
        }),
      );

      expect(setConfigurationMock).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        type: "error",
        error: { statusCode: 400 },
      });
    });
  });

  describe("PATCH /", () => {
    test("accepts null values as unsets", async () => {
      setConfigurationMock.mockResolvedValue({
        scopeId: "store-1",
        config: [],
      });

      const handler = configRuntimeAction({ configSchema });

      await handler(
        createRuntimeActionParams({
          method: "patch",
          body: {
            scopeId: "store-1",
            config: [{ name: "apiKey", value: null }],
          },
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
        scopeId: "store-1",
        config: [],
      });

      const handler = configRuntimeAction({ configSchema });

      const result = await handler(
        createRuntimeActionParams({
          method: "patch",
          body: {
            scopeId: "store-1",
            config: [{ name: "mode", value: "live" }],
          },
        }),
      );

      expect(result).toMatchObject({
        headers: { "Cache-Control": "no-store" },
      });
    });
  });
});
