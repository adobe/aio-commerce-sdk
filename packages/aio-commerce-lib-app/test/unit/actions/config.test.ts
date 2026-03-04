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

const {
  byScopeId,
  byCodeAndLevel,
  byCode,
  getConfiguration,
  initialize,
  setConfiguration,
  getConfigurationVersions,
  restoreConfigurationVersion,
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
  setConfiguration: vi.fn(),
  getConfigurationVersions: vi.fn(),
  restoreConfigurationVersion: vi.fn(),
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
      message: "Configuration version restored successfully",
      timestamp: "2026-01-01T00:00:00.000Z",
      scope: { id: "scope-1", code: "store", level: "store_view" },
      restoredVersionId: "ver-2",
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

  it("maps restore version not found to INVALID_REQUEST", async () => {
    restoreConfigurationVersion.mockRejectedValueOnce(
      new Error("VERSION_NOT_FOUND: ver-missing"),
    );

    const main = configRuntimeAction({ configSchema: [] });
    const response = await main({
      __ow_method: "post",
      __ow_path: "/versions/restore",
      __ow_body: JSON.stringify({
        scopeId: "scope-1",
        versionId: "ver-missing",
      }),
    });

    expect(response.type).toBe("error");
    if (response.type === "error") {
      expect(response.error.statusCode).toBe(400);
      const { body } = response.error;
      expect(body).toBeDefined();
      if (body) {
        expect(body.code).toBe("INVALID_REQUEST");
        expect(body.message).toContain("VERSION_NOT_FOUND");
      }
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
});
