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

import { configRuntimeAction } from "#actions/config";

import type { BusinessConfigSchema } from "@adobe/aio-commerce-lib-config";
import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";

const { mockInitialize, mockGetConfiguration, mockSetConfiguration } =
  vi.hoisted(() => ({
    mockInitialize: vi.fn(),
    mockGetConfiguration: vi.fn(),
    mockSetConfiguration: vi.fn(),
  }));

vi.mock("@adobe/aio-commerce-lib-config", async () => {
  const actual = await vi.importActual<
    typeof import("@adobe/aio-commerce-lib-config")
  >("@adobe/aio-commerce-lib-config");

  return {
    ...actual,
    initialize: mockInitialize,
    getConfiguration: mockGetConfiguration,
    setConfiguration: mockSetConfiguration,
  };
});

const schema = [
  { name: "shared", type: "text", label: "Shared" },
  { name: "paasOnly", type: "text", label: "PaaS", env: ["paas"] },
  { name: "saasOnly", type: "text", label: "SaaS", env: ["saas"] },
] satisfies BusinessConfigSchema;

describe("configRuntimeAction (GET /)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetConfiguration.mockResolvedValue({
      scope: { id: "scope-1", code: "global", level: "global" },
      config: [
        {
          name: "shared",
          value: "value",
          origin: { id: "scope-1", code: "global", level: "global" },
        },
      ],
    });
  });

  test("returns full schema when commerceEnv is omitted", async () => {
    const handler = configRuntimeAction({ configSchema: schema });

    const result = await handler({
      __ow_method: "get",
      __ow_path: "/",
      __ow_query: "scopeId=scope-1",
      __ow_headers: {},
      LOG_LEVEL: "debug",
    } as unknown as RuntimeActionParams);

    expect(result).toMatchObject({
      type: "success",
      statusCode: 200,
    });

    if (result.type !== "success") {
      throw new Error("Expected a successful response");
    }

    if (!result.body) {
      throw new Error("Expected response body");
    }

    const responseSchema = result.body.schema as BusinessConfigSchema;

    expect(responseSchema.map((field) => field.name)).toEqual([
      "shared",
      "paasOnly",
      "saasOnly",
    ]);

    expect(mockInitialize).toHaveBeenCalledWith({
      schema: expect.arrayContaining([
        expect.objectContaining({ name: "shared" }),
        expect.objectContaining({ name: "paasOnly" }),
        expect.objectContaining({ name: "saasOnly" }),
      ]),
    });
  });

  test("filters schema by commerceEnv=paas", async () => {
    const handler = configRuntimeAction({ configSchema: schema });

    const result = await handler({
      __ow_method: "get",
      __ow_path: "/",
      __ow_query: "scopeId=scope-1&commerceEnv=paas",
      __ow_headers: {},
      LOG_LEVEL: "debug",
    } as unknown as RuntimeActionParams);

    expect(result).toMatchObject({
      type: "success",
      statusCode: 200,
    });

    if (result.type !== "success") {
      throw new Error("Expected a successful response");
    }

    if (!result.body) {
      throw new Error("Expected response body");
    }

    const responseSchema = result.body.schema as BusinessConfigSchema;

    expect(responseSchema.map((field) => field.name)).toEqual([
      "shared",
      "paasOnly",
    ]);

    expect(mockInitialize).toHaveBeenCalledWith({
      schema: expect.arrayContaining([
        expect.objectContaining({ name: "shared" }),
        expect.objectContaining({ name: "paasOnly" }),
      ]),
    });
  });

  test("returns 400 when commerceEnv is invalid", async () => {
    const handler = configRuntimeAction({ configSchema: schema });

    const result = await handler({
      __ow_method: "get",
      __ow_path: "/",
      __ow_query: "scopeId=scope-1&commerceEnv=production",
      __ow_headers: {},
      LOG_LEVEL: "debug",
    } as unknown as RuntimeActionParams);

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

  test("filters schema by commerceEnv=saas", async () => {
    const handler = configRuntimeAction({ configSchema: schema });

    const result = await handler({
      __ow_method: "get",
      __ow_path: "/",
      __ow_query: "scopeId=scope-1&commerceEnv=saas",
      __ow_headers: {},
      LOG_LEVEL: "debug",
    } as unknown as RuntimeActionParams);

    expect(result).toMatchObject({
      type: "success",
      statusCode: 200,
    });

    if (result.type !== "success") {
      throw new Error("Expected a successful response");
    }

    if (!result.body) {
      throw new Error("Expected response body");
    }

    const responseSchema = result.body.schema as BusinessConfigSchema;

    expect(responseSchema.map((field) => field.name)).toEqual([
      "shared",
      "saasOnly",
    ]);
  });
});
