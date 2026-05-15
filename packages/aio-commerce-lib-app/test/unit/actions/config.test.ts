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

import { configRuntimeAction } from "#actions/config";
import { createRuntimeActionParams } from "#test/fixtures/actions";

import type { BusinessConfigSchema } from "@adobe/aio-commerce-lib-config";

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

describe("configRuntimeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    byScopeIdMock.mockImplementation((scopeId: string) => ({ scopeId }));
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
