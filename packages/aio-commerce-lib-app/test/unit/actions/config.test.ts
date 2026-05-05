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

    expect(initializeMock).toHaveBeenCalledWith({ schema: configSchema });
    expect(byScopeIdMock).toHaveBeenCalledWith("store-1");
    expect(getConfigurationMock).toHaveBeenCalledWith(
      { scopeId: "store-1" },
      { encryptionKey: "encryption-key" },
    );
    expect(result).toEqual({
      type: "success",
      statusCode: 200,
      body: {
        schema: configSchema,
        values: {
          scopeId: "store-1",
          config: [
            { name: "apiKey", value: "*****", origin: "scope" },
            { name: "mode", value: "live", origin: "scope" },
          ],
        },
      },
    });
  });

  test("returns a 400 error when the scope id query parameter is missing", async () => {
    const handler = configRuntimeAction({ configSchema });

    const result = await handler(createRuntimeActionParams());

    expect(result).toMatchObject({
      type: "error",
      error: {
        statusCode: 400,
        body: {
          message: "Invalid query parameters",
        },
      },
    });
  });

  test("filters masked password values before saving with PUT /", async () => {
    setConfigurationMock.mockResolvedValue({
      scopeId: "store-1",
      config: [
        { name: "apiKey", value: "updated-secret", origin: "scope" },
        { name: "mode", value: "live", origin: "scope" },
      ],
    });

    const handler = configRuntimeAction({ configSchema });

    const result = await handler(
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

    expect(initializeMock).toHaveBeenCalledWith({ schema: configSchema });
    expect(setConfigurationMock).toHaveBeenCalledWith(
      {
        config: [{ name: "mode", value: "live" }],
      },
      { scopeId: "store-1" },
      { encryptionKey: undefined },
    );
    expect(result).toEqual({
      type: "success",
      statusCode: 200,
      headers: {
        "Cache-Control": "no-store",
        Deprecation: "Wed, 15 Apr 2026 00:00:00 GMT",
      },
      body: {
        scopeId: "store-1",
        config: [
          { name: "apiKey", value: "*****", origin: "scope" },
          { name: "mode", value: "live", origin: "scope" },
        ],
      },
    });
  });

  test("forwards partial updates and null unsets with PATCH /", async () => {
    setConfigurationMock.mockResolvedValue({
      scopeId: "store-1",
      config: [
        { name: "apiKey", value: "persisted-secret", origin: "scope" },
        { name: "mode", value: "live", origin: "scope" },
      ],
    });

    const handler = configRuntimeAction({ configSchema });

    const result = await handler(
      createRuntimeActionParams({
        method: "patch",
        body: {
          scopeId: "store-1",
          config: [
            { name: "apiKey", value: null },
            { name: "mode", value: "live" },
          ],
        },
        AIO_COMMERCE_CONFIG_ENCRYPTION_KEY: "encryption-key",
      }),
    );

    expect(setConfigurationMock).toHaveBeenCalledWith(
      {
        config: [
          { name: "apiKey", value: null },
          { name: "mode", value: "live" },
        ],
      },
      { scopeId: "store-1" },
      { encryptionKey: "encryption-key" },
    );
    expect(result).toEqual({
      type: "success",
      statusCode: 200,
      headers: {
        "Cache-Control": "no-store",
      },
      body: {
        scopeId: "store-1",
        config: [
          { name: "apiKey", value: "*****", origin: "scope" },
          { name: "mode", value: "live", origin: "scope" },
        ],
      },
    });
  });
});
