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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { applyAdminUi } from "#management/domains/admin-ui/apply";
import { createMockAdminUiContext } from "#test/fixtures/admin-ui";
import { makeHttpError } from "#test/fixtures/http-error";

import type {
  AdminUiDomainPlan,
  AdminUiExtensionAction,
  AdminUiIdentity,
} from "#management/domains/admin-ui/types";

const UNREGISTER_FAILURE_PATTERN =
  /Failed to unregister Admin UI extension.*Service unavailable/;

const REFRESH_FAILURE_PATTERN =
  /Failed to refresh Admin UI extension.*Service unavailable/;

const OPERATION_PATH = ["admin-ui", "register-extension"];

const TEST_IDENTITY: AdminUiIdentity = {
  extensionName: "test-ns",
  workspaceName: "test-workspace-name",
};

describe("applyAdminUi", () => {
  beforeEach(() => {
    vi.stubEnv("__OW_NAMESPACE", "test-ns");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function applyContext(
    overrides: Parameters<typeof createMockAdminUiContext>[0] = {},
  ) {
    return { ...createMockAdminUiContext(overrides), attemptId: "attempt-1" };
  }

  function makePlan(
    extensionAction: AdminUiExtensionAction | null,
    possibleCleanupResources: AdminUiDomainPlan["possibleCleanupResources"] = [],
    baselineExtensionId: string | null = null,
    identity: AdminUiIdentity | null = TEST_IDENTITY,
  ): AdminUiDomainPlan {
    return {
      baselineExtensionId,
      extensionAction,
      identity,
      operations: [],
      path: OPERATION_PATH,
      possibleCleanupResources,
    };
  }

  test("register: enables the SDK, registers, and resolves the plan's cleanup resource", async () => {
    const context = applyContext();
    const cleanup = [{ identity: TEST_IDENTITY, path: OPERATION_PATH }];
    const result = await applyAdminUi(makePlan("register", cleanup), context);

    expect(context.adminUiClient.enableAdminUiSdk).toHaveBeenCalledOnce();
    expect(context.adminUiClient.registerExtension).toHaveBeenCalledOnce();
    expect(result.snapshotData).toEqual({ extensionId: "ext-123" });
    expect(result.resolvedCleanupResources).toEqual(cleanup);
  });

  test("refresh: enables the SDK (idempotent safeguard) and calls the refresh endpoint, carrying the baseline's extensionId forward", async () => {
    const context = applyContext();
    const result = await applyAdminUi(
      makePlan("refresh", [], "ext-123"),
      context,
    );

    expect(context.adminUiClient.enableAdminUiSdk).toHaveBeenCalledOnce();
    expect(context.adminUiClient.refreshExtension).toHaveBeenCalledOnce();
    expect(context.adminUiClient.registerExtension).not.toHaveBeenCalled();
    expect(result.snapshotData).toEqual({ extensionId: "ext-123" });
    expect(result.resolvedCleanupResources).toEqual([]);
  });

  test("refresh: falls back to registering when the refresh endpoint is not found (404)", async () => {
    const httpError = makeHttpError(
      404,
      "Not Found",
      JSON.stringify({ message: "No such entity" }),
    );
    const context = applyContext({
      refreshExtensionImpl: () => Promise.reject(httpError),
    });

    const result = await applyAdminUi(
      makePlan("refresh", [], "ext-stale"),
      context,
    );

    expect(context.adminUiClient.refreshExtension).toHaveBeenCalledOnce();
    expect(context.adminUiClient.registerExtension).toHaveBeenCalledOnce();
    // The fallback register response's extensionId wins over the stale baseline id.
    expect(result.snapshotData).toEqual({ extensionId: "ext-123" });
  });

  test("refresh: aborts (throws) on a non-404 refresh failure without falling back", async () => {
    const httpError = makeHttpError(
      500,
      "Internal Server Error",
      JSON.stringify({ message: "Service unavailable" }),
    );
    const context = applyContext({
      refreshExtensionImpl: () => Promise.reject(httpError),
    });

    await expect(applyAdminUi(makePlan("refresh"), context)).rejects.toThrow(
      REFRESH_FAILURE_PATTERN,
    );
    expect(context.adminUiClient.registerExtension).not.toHaveBeenCalled();
  });

  test("unregister: removes the extension and returns null snapshot data", async () => {
    const context = applyContext();
    const result = await applyAdminUi(makePlan("unregister"), context);

    expect(context.adminUiClient.unregisterExtension).toHaveBeenCalledOnce();
    expect(result.snapshotData).toBeNull();
    expect(result.resolvedCleanupResources).toEqual([
      { identity: TEST_IDENTITY, path: OPERATION_PATH },
    ]);
  });

  test("unregister: throws when the plan has no resolved identity", async () => {
    const context = applyContext();

    await expect(
      applyAdminUi(makePlan("unregister", [], null, null), context),
    ).rejects.toThrow("the plan has no resolved identity");
    expect(context.adminUiClient.unregisterExtension).not.toHaveBeenCalled();
  });

  test("no-op: does nothing when the extension action is null", async () => {
    const context = applyContext();
    const result = await applyAdminUi(makePlan(null), context);

    expect(context.adminUiClient.enableAdminUiSdk).not.toHaveBeenCalled();
    expect(context.adminUiClient.registerExtension).not.toHaveBeenCalled();
    expect(context.adminUiClient.refreshExtension).not.toHaveBeenCalled();
    expect(context.adminUiClient.unregisterExtension).not.toHaveBeenCalled();
    expect(result.snapshotData).toBeNull();
    expect(result.resolvedCleanupResources).toEqual([]);
  });

  test("register: aborts (throws) when registration fails", async () => {
    const httpError = makeHttpError(
      403,
      "Forbidden",
      JSON.stringify({ message: "Insufficient permissions" }),
    );
    const context = applyContext({
      registerExtensionImpl: () => Promise.reject(httpError),
    });

    await expect(applyAdminUi(makePlan("register"), context)).rejects.toThrow();
  });

  test("unregister: aborts (throws) on a non-404 removal failure", async () => {
    const httpError = makeHttpError(
      500,
      "Internal Server Error",
      JSON.stringify({ message: "Service unavailable" }),
    );
    const context = applyContext({
      unregisterExtensionImpl: () => Promise.reject(httpError),
    });

    await expect(applyAdminUi(makePlan("unregister"), context)).rejects.toThrow(
      UNREGISTER_FAILURE_PATTERN,
    );
  });

  test("unregister: treats a 404 removal as complete", async () => {
    const httpError = makeHttpError(
      404,
      "Not Found",
      JSON.stringify({ message: "No such entity" }),
    );
    const context = applyContext({
      unregisterExtensionImpl: () => Promise.reject(httpError),
    });

    const result = await applyAdminUi(makePlan("unregister"), context);

    expect(context.adminUiClient.unregisterExtension).toHaveBeenCalledOnce();
    expect(result.snapshotData).toBeNull();
    expect(result.resolvedCleanupResources).toEqual([
      { identity: TEST_IDENTITY, path: OPERATION_PATH },
    ]);
  });
});
