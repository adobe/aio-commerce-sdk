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
} from "#management/domains/admin-ui/types";

const UNREGISTER_FAILURE_PATTERN =
  /Failed to unregister Admin UI extension.*Service unavailable/;

const OPERATION_PATH = ["admin-ui", "register-extension"];

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
  ): AdminUiDomainPlan {
    return {
      extensionAction,
      operations: [],
      path: OPERATION_PATH,
      possibleCleanupResources,
    };
  }

  test("register: enables the SDK, registers, and resolves the plan's cleanup resource", async () => {
    const context = applyContext();
    const cleanup = [
      {
        identity: {
          extensionName: "test-ns",
          workspaceName: context.appData.workspaceName,
        },
        path: OPERATION_PATH,
      },
    ];
    const result = await applyAdminUi(makePlan("register", cleanup), context);

    expect(context.adminUiClient.enableAdminUiSdk).toHaveBeenCalledOnce();
    expect(context.adminUiClient.registerExtension).toHaveBeenCalledOnce();
    expect(result.snapshotData).toEqual({ extensionId: "ext-123" });
    expect(result.resolvedCleanupResources).toEqual(cleanup);
  });

  test("refresh: enables the SDK (idempotent safeguard) and re-registers, returning the extension id", async () => {
    const context = applyContext();
    const result = await applyAdminUi(makePlan("refresh"), context);

    expect(context.adminUiClient.enableAdminUiSdk).toHaveBeenCalledOnce();
    expect(context.adminUiClient.registerExtension).toHaveBeenCalledOnce();
    expect(result.snapshotData).toEqual({ extensionId: "ext-123" });
    expect(result.resolvedCleanupResources).toEqual([]);
  });

  test("unregister: removes the extension and returns null snapshot data", async () => {
    const context = applyContext();
    const result = await applyAdminUi(makePlan("unregister"), context);

    expect(context.adminUiClient.unregisterExtension).toHaveBeenCalledOnce();
    expect(result.snapshotData).toBeNull();
    expect(result.resolvedCleanupResources).toEqual([
      {
        identity: {
          extensionName: "test-ns",
          workspaceName: context.appData.workspaceName,
        },
        path: OPERATION_PATH,
      },
    ]);
  });

  test("no-op: does nothing when the extension action is null", async () => {
    const context = applyContext();
    const result = await applyAdminUi(makePlan(null), context);

    expect(context.adminUiClient.enableAdminUiSdk).not.toHaveBeenCalled();
    expect(context.adminUiClient.registerExtension).not.toHaveBeenCalled();
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
      {
        identity: {
          extensionName: "test-ns",
          workspaceName: context.appData.workspaceName,
        },
        path: OPERATION_PATH,
      },
    ]);
  });
});
