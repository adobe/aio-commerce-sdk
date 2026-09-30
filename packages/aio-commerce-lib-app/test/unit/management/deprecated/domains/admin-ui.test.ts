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

import { unregisterExtension } from "#management/deprecated/domains/admin-ui";
import { adminUiStep } from "#management/domains/admin-ui/branch";
import { createMockAdminUiContext } from "#test/fixtures/admin-ui";
import { configWithFullAdminUiV2 } from "#test/fixtures/config";
import { makeHttpError } from "#test/fixtures/http-error";
import { createMockLogger } from "#test/fixtures/installation";

describe("unregisterExtension", () => {
  beforeEach(() => {
    vi.stubEnv("__OW_NAMESPACE", "test-ns");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("warns and returns without calling the client when __OW_NAMESPACE is not set", async () => {
    vi.unstubAllEnvs();
    const logger = createMockLogger();
    const context = { ...createMockAdminUiContext({}), logger };

    await expect(unregisterExtension(context)).resolves.toBeUndefined();

    expect(context.adminUiClient.unregisterExtension).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Continuing uninstall."),
    );
  });

  test("warns with enriched error message when unregisterExtension call fails", async () => {
    const logger = createMockLogger();
    const httpError = makeHttpError(
      500,
      "Internal Server Error",
      JSON.stringify({ message: "Service unavailable" }),
    );
    const context = {
      ...createMockAdminUiContext({
        unregisterExtensionImpl: () => Promise.reject(httpError),
      }),
      logger,
    };

    await unregisterExtension(context);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("test-ns"),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Service unavailable"),
    );
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("Continuing uninstall."),
    );
  });
});

describe("enableAdminUiSdkStep handlers", () => {
  const [enableAdminUiSdkStep] = adminUiStep.children;

  test("should have an install handler but no uninstall handler", () => {
    expect(enableAdminUiSdkStep.install).toBeDefined();
    expect(enableAdminUiSdkStep.uninstall).toBeUndefined();
  });

  test("should call enableAdminUiSdk on install", async () => {
    const context = createMockAdminUiContext();

    await enableAdminUiSdkStep.install(configWithFullAdminUiV2, context);
    expect(context.adminUiClient.enableAdminUiSdk).toHaveBeenCalledOnce();
  });
});

describe("registerExtensionStep handlers", () => {
  const [, registerExtensionStep] = adminUiStep.children;

  beforeEach(() => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("should have install and uninstall handlers defined", () => {
    expect(registerExtensionStep.install).toBeDefined();
    expect(registerExtensionStep.uninstall).toBeDefined();
  });

  test("should have meta.uninstall defined", () => {
    expect(registerExtensionStep.meta.uninstall).toBeDefined();
  });

  test("should call registerExtension with extensionName, title, and workspace", async () => {
    const context = createMockAdminUiContext();

    await registerExtensionStep.install(configWithFullAdminUiV2, context);
    expect(context.adminUiClient.registerExtension).toHaveBeenCalledWith({
      extensionName: "test-namespace",
      extensionTitle: context.appData.projectTitle,
      extensionWorkspace: context.appData.workspaceName,
    });
  });

  test("should call unregisterExtension with workspaceName and __OW_NAMESPACE", async () => {
    const context = createMockAdminUiContext();
    await registerExtensionStep.uninstall?.(configWithFullAdminUiV2, context);

    expect(context.adminUiClient.unregisterExtension).toHaveBeenCalledWith({
      extensionName: "test-namespace",
      workspaceName: context.appData.workspaceName,
    });
  });

  test("should not throw when the uninstall call fails (best-effort)", async () => {
    const context = createMockAdminUiContext({
      unregisterExtensionImpl: () =>
        Promise.reject(new Error("Commerce API error")),
    });

    await expect(
      registerExtensionStep.uninstall?.(configWithFullAdminUiV2, context),
    ).resolves.toBeUndefined();
  });

  test("should log a warning when the uninstall call fails", async () => {
    const logger = createMockLogger();
    const context = {
      ...createMockAdminUiContext({
        unregisterExtensionImpl: () =>
          Promise.reject(new Error("Commerce API error")),
      }),
      logger,
    };

    await registerExtensionStep.uninstall?.(configWithFullAdminUiV2, context);
    expect(logger.warn).toHaveBeenCalled();
  });
});
