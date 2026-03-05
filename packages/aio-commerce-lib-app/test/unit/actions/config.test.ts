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

import { beforeEach, describe, expect, it, vi } from "vitest";

import { configRuntimeAction } from "#actions/config";

import type { BusinessConfigSchema } from "@adobe/aio-commerce-lib-config";

const {
  byScopeId,
  byCodeAndLevel,
  byCode,
  getConfiguration,
  initialize,
  restoreConfigurationVersion,
  setConfiguration,
  getConfigurationVersions,
} = vi.hoisted(() => ({
  byScopeId: vi.fn((scopeId: string) => ({
    by: { _tag: "scopeId", scopeId },
  })),
  byCodeAndLevel: vi.fn((code: string, level: string) => ({
    by: { _tag: "codeAndLevel", code, level },
  })),
  byCode: vi.fn((code: string) => ({
    by: { _tag: "code", code },
  })),
  getConfiguration: vi.fn(),
  initialize: vi.fn(),
  restoreConfigurationVersion: vi.fn(),
  setConfiguration: vi.fn(),
  getConfigurationVersions: vi.fn(),
}));

vi.mock("@adobe/aio-commerce-lib-config", () => ({
  byCode,
  byCodeAndLevel,
  byScopeId,
  getConfiguration,
  getConfigurationVersions,
  initialize,
  restoreConfigurationVersion,
  setConfiguration,
}));

vi.mock("#config/index", () => ({
  validateCommerceAppConfigDomain: vi.fn((schema: unknown) => schema),
}));

describe("config runtime action audit routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    setConfiguration.mockResolvedValue({
      message: "Configuration values updated successfully",
      timestamp: "2026-01-01T00:00:00.000Z",
      scope: { id: "scope-1", code: "store", level: "store_view" },
      config: [{ name: "foo", value: "bar" }],
    });
    getConfiguration.mockResolvedValue({
      scope: { id: "scope-1", code: "store", level: "store_view" },
      config: [{ name: "foo", value: "bar", origin: { code: "store" } }],
    });
    getConfigurationVersions.mockResolvedValue({
      scope: { id: "scope-1", code: "store", level: "store_view" },
      versions: [],
      pagination: { total: 0, limit: 50, offset: 0 },
    });
    restoreConfigurationVersion.mockResolvedValue({
      message: "Configuration restored successfully",
      timestamp: "2026-01-01T00:00:00.000Z",
      scope: { id: "scope-1", code: "store", level: "store_view" },
      restoredFromVersionId: "v-1",
      config: [{ name: "foo", value: "bar" }],
      removed: [],
    });
  });

  it("returns AUDIT_DISABLED for GET /versions when audit is disabled", async () => {
    const main = configRuntimeAction({ configSchema: [] });
    const response = await main({
      __ow_method: "get",
      __ow_path: "/versions",
      __ow_query: "scopeId=scope-1",
      AIO_COMMERCE_CONFIG_AUDIT_ENABLED: "false",
    });

    expect(response.type).toBe("error");
    if (response.type === "error") {
      expect(response.error.statusCode).toBe(400);
      const { body } = response.error;
      expect(body).toBeDefined();
      if (body) {
        expect(body.code).toBe("AUDIT_DISABLED");
      }
    }
    expect(getConfigurationVersions).not.toHaveBeenCalled();
  });

  it("lists versions from GET /versions with code-only selector", async () => {
    getConfigurationVersions.mockResolvedValueOnce({
      scope: { id: "scope-1", code: "store", level: "store_view" },
      versions: [
        {
          id: "v-1",
          timestamp: "2026-01-01T00:00:00.000Z",
          scope: { id: "scope-1", code: "store", level: "store_view" },
          reason: "set",
          change: {
            added: ["apiKey", "featureFlag"],
            updated: [],
            removed: [],
          },
          config: [
            { name: "apiKey", value: "secret-1" },
            { name: "featureFlag", value: "on" },
          ],
        },
      ],
      pagination: { total: 1, limit: 20, offset: 5 },
    });

    const main = configRuntimeAction({ configSchema: [] });
    const response = await main({
      __ow_method: "get",
      __ow_path: "/versions",
      __ow_query: "code=store&limit=20&offset=5",
    });

    expect(response.type).toBe("success");
    if (response.type === "success") {
      expect(response.statusCode).toBe(200);
      expect(response.headers?.["Cache-Control"]).toBe("no-store");
    }

    expect(byCode).toHaveBeenCalledWith("store");
    expect(getConfigurationVersions).toHaveBeenCalledWith(
      { by: { _tag: "code", code: "store" } },
      { limit: 20, offset: 5 },
      { auditEnabled: true },
    );
  });

  it("masks password values and keeps non-password values in versions response", async () => {
    getConfigurationVersions.mockResolvedValueOnce({
      scope: { id: "scope-1", code: "store", level: "store_view" },
      versions: [
        {
          id: "v-2",
          timestamp: "2026-01-01T00:00:00.000Z",
          scope: { id: "scope-1", code: "store", level: "store_view" },
          reason: "set",
          change: {
            added: ["apiKey", "featureFlag"],
            updated: [],
            removed: [],
          },
          config: [
            { name: "apiKey", value: "secret-1" },
            { name: "featureFlag", value: "on" },
          ],
          changes: [
            { name: "apiKey", after: "secret-1" },
            { name: "featureFlag", after: "on" },
          ],
        },
      ],
      pagination: { total: 1, limit: 50, offset: 0 },
    });

    const configSchema = [
      { name: "apiKey", type: "password" },
      { name: "featureFlag", type: "text" },
    ] as unknown as BusinessConfigSchema;
    const main = configRuntimeAction({ configSchema });
    const response = await main({
      __ow_method: "get",
      __ow_path: "/versions",
      __ow_query: "scopeId=scope-1",
    });

    expect(response.type).toBe("success");
    if (response.type === "success") {
      const body = response.body as
        | {
            versions?: Array<{
              config?: Array<{ name: string; value: unknown }>;
              changes?: Array<{
                name: string;
                before?: unknown;
                after?: unknown;
              }>;
            }>;
          }
        | undefined;
      expect(body?.versions?.[0]?.config).toEqual([
        { name: "apiKey", value: "*****" },
        { name: "featureFlag", value: "on" },
      ]);
      expect(body?.versions?.[0]?.changes).toEqual([
        { name: "apiKey", after: "*****" },
        { name: "featureFlag", after: "on" },
      ]);
    }
  });

  it("passes auditEnabled into POST / setConfiguration options", async () => {
    const main = configRuntimeAction({ configSchema: [] });
    const response = await main({
      __ow_method: "post",
      __ow_path: "/",
      __ow_body: JSON.stringify({
        scopeId: "scope-1",
        config: [{ name: "foo", value: "bar" }],
      }),
      AIO_COMMERCE_CONFIG_AUDIT_ENABLED: "false",
    });

    expect(response.type).toBe("success");
    expect(byScopeId).toHaveBeenCalledWith("scope-1");
    expect(setConfiguration).toHaveBeenCalledWith(
      { config: [{ name: "foo", value: "bar" }] },
      { by: { _tag: "scopeId", scopeId: "scope-1" } },
      {
        encryptionKey: undefined,
        auditEnabled: false,
      },
    );
  });

  it("restores changed fields from POST /versions/restore and supports fields", async () => {
    restoreConfigurationVersion.mockResolvedValueOnce({
      message: "Configuration restored successfully",
      timestamp: "2026-01-01T00:00:00.000Z",
      scope: { id: "scope-1", code: "store", level: "store_view" },
      restoredFromVersionId: "v-1",
      config: [
        { name: "apiKey", value: "secret-1" },
        { name: "featureFlag", value: "on" },
      ],
      removed: ["legacyKey"],
    });

    const configSchema = [
      { name: "apiKey", type: "password" },
      { name: "featureFlag", type: "text" },
    ] as unknown as BusinessConfigSchema;
    const main = configRuntimeAction({ configSchema });
    const response = await main({
      __ow_method: "post",
      __ow_path: "/versions/restore",
      __ow_body: JSON.stringify({
        code: "store",
        level: "store_view",
        versionId: "v-1",
        fields: ["apiKey", "featureFlag", "legacyKey"],
      }),
    });

    expect(response.type).toBe("success");
    if (response.type === "success") {
      expect(response.headers?.["Cache-Control"]).toBe("no-store");
      const body = response.body as
        | {
            config?: Array<{ name: string; value: string }>;
            removed?: string[];
            restoredFromVersionId?: string;
          }
        | undefined;
      expect(body?.config).toEqual([
        { name: "apiKey", value: "*****" },
        { name: "featureFlag", value: "on" },
      ]);
      expect(body?.removed).toEqual(["legacyKey"]);
      expect(body?.restoredFromVersionId).toBe("v-1");
    }

    expect(byCodeAndLevel).toHaveBeenCalledWith("store", "store_view");
    expect(restoreConfigurationVersion).toHaveBeenCalledWith(
      { by: { _tag: "codeAndLevel", code: "store", level: "store_view" } },
      {
        versionId: "v-1",
        expectedLatestVersionId: undefined,
        fields: ["apiKey", "featureFlag", "legacyKey"],
      },
      { encryptionKey: undefined, auditEnabled: true },
    );
  });

  it("returns VERSION_NOT_FOUND for POST /versions/restore", async () => {
    restoreConfigurationVersion.mockRejectedValueOnce(
      new Error("VERSION_NOT_FOUND: missing"),
    );

    const main = configRuntimeAction({ configSchema: [] });
    const response = await main({
      __ow_method: "post",
      __ow_path: "/versions/restore",
      __ow_body: JSON.stringify({
        scopeId: "scope-1",
        versionId: "v-missing",
      }),
    });

    expect(response.type).toBe("error");
    if (response.type === "error") {
      expect(response.error.statusCode).toBe(400);
      const { body } = response.error;
      expect(body?.code).toBe("VERSION_NOT_FOUND");
    }
  });
});
