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

import {
  enableAdminUiSdk,
  refreshExtension,
  registerExtension,
  unregisterExtension,
  unregisterExtensionForUpgrade,
} from "#management/domains/admin-ui/helpers";
import { createMockAdminUiContext } from "#test/fixtures/admin-ui";
import { makeHttpError } from "#test/fixtures/http-error";
import { createMockLogger } from "#test/fixtures/installation";

const REGISTER_EXTENSION_COMBINED_PATTERN =
  /Failed to register Admin UI extension.*Insufficient permissions/;

const ENABLE_SDK_COMBINED_PATTERN =
  /Failed to enable Admin UI SDK.*Insufficient permissions/;

const REFRESH_EXTENSION_COMBINED_PATTERN =
  /Failed to refresh Admin UI extension.*Insufficient permissions/;

const UNREGISTER_FAILURE_PATTERN =
  /Failed to unregister Admin UI extension.*Service unavailable/;

describe("enableAdminUiSdk", () => {
  test("calls the client and logs success when it resolves", async () => {
    const logger = createMockLogger();
    const context = createMockAdminUiContext({
      enableAdminUiSdkImpl: () => Promise.resolve(true),
      logger,
    });

    await expect(enableAdminUiSdk(context)).resolves.toBeUndefined();

    expect(context.adminUiClient.enableAdminUiSdk).toHaveBeenCalledOnce();
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("enabled successfully"),
    );
  });

  test("throws enriched error when the client call fails", async () => {
    const httpError = makeHttpError(
      403,
      "Forbidden",
      JSON.stringify({ message: "Insufficient permissions" }),
    );
    const context = createMockAdminUiContext({
      enableAdminUiSdkImpl: () => Promise.reject(httpError),
    });

    await expect(enableAdminUiSdk(context)).rejects.toThrow(
      ENABLE_SDK_COMBINED_PATTERN,
    );
  });
});

describe("registerExtension", () => {
  beforeEach(() => {
    vi.stubEnv("__OW_NAMESPACE", "test-ns");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("logs success with extensionId when registerExtension call resolves", async () => {
    const logger = createMockLogger();
    const context = createMockAdminUiContext({
      logger,
      registerExtensionImpl: () => Promise.resolve({ extensionId: "ext-123" }),
    });

    await expect(registerExtension(context)).resolves.toEqual({
      extensionId: "ext-123",
    });

    expect(context.adminUiClient.registerExtension).toHaveBeenCalledWith({
      extensionName: "test-ns",
      extensionTitle: context.appData.projectTitle,
      extensionWorkspace: context.appData.workspaceName,
    });
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("registered successfully: ext-123"),
    );
  });

  test("throws enriched error when registerExtension call fails", async () => {
    const httpError = makeHttpError(
      403,
      "Forbidden",
      JSON.stringify({ message: "Insufficient permissions" }),
    );
    const context = createMockAdminUiContext({
      registerExtensionImpl: () => Promise.reject(httpError),
    });

    await expect(registerExtension(context)).rejects.toThrow(
      REGISTER_EXTENSION_COMBINED_PATTERN,
    );
  });

  test("logs error before throwing", async () => {
    const logger = createMockLogger();
    const httpError = makeHttpError(
      403,
      "Forbidden",
      JSON.stringify({ message: "Insufficient permissions" }),
    );
    const context = createMockAdminUiContext({
      logger,
      registerExtensionImpl: () => Promise.reject(httpError),
    });

    await expect(registerExtension(context)).rejects.toThrow();

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringMatching(REGISTER_EXTENSION_COMBINED_PATTERN),
    );
  });
});

describe("refreshExtension", () => {
  beforeEach(() => {
    vi.stubEnv("__OW_NAMESPACE", "test-ns");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("throws when __OW_NAMESPACE is not set", async () => {
    vi.unstubAllEnvs();
    const context = createMockAdminUiContext({});

    await expect(refreshExtension(context)).rejects.toThrow("__OW_NAMESPACE");
    expect(context.adminUiClient.refreshExtension).not.toHaveBeenCalled();
  });

  test("calls the refresh endpoint and returns a null extensionId on success", async () => {
    const logger = createMockLogger();
    const context = { ...createMockAdminUiContext({}), logger };

    await expect(refreshExtension(context)).resolves.toEqual({
      extensionId: null,
    });

    expect(context.adminUiClient.refreshExtension).toHaveBeenCalledWith({
      extensionName: "test-ns",
      workspaceName: context.appData.workspaceName,
    });
    expect(context.adminUiClient.registerExtension).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("refreshed successfully"),
    );
  });

  test("falls back to registerExtension on a 404 (endpoint unavailable or extension not found)", async () => {
    const logger = createMockLogger();
    const httpError = makeHttpError(
      404,
      "Not Found",
      JSON.stringify({ message: "No such entity" }),
    );
    const context = {
      ...createMockAdminUiContext({
        refreshExtensionImpl: () => Promise.reject(httpError),
      }),
      logger,
    };

    await expect(refreshExtension(context)).resolves.toEqual({
      extensionId: "ext-123",
    });

    expect(context.adminUiClient.registerExtension).toHaveBeenCalledOnce();
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("falling back to re-registering"),
    );
  });

  test("throws enriched error on a non-404 failure, without falling back", async () => {
    const httpError = makeHttpError(
      403,
      "Forbidden",
      JSON.stringify({ message: "Insufficient permissions" }),
    );
    const context = createMockAdminUiContext({
      refreshExtensionImpl: () => Promise.reject(httpError),
    });

    await expect(refreshExtension(context)).rejects.toThrow(
      REFRESH_EXTENSION_COMBINED_PATTERN,
    );
    expect(context.adminUiClient.registerExtension).not.toHaveBeenCalled();
  });
});

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

describe("unregisterExtensionForUpgrade", () => {
  beforeEach(() => {
    vi.stubEnv("__OW_NAMESPACE", "test-ns");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("throws when __OW_NAMESPACE is not set", async () => {
    vi.unstubAllEnvs();
    const context = createMockAdminUiContext({});

    await expect(unregisterExtensionForUpgrade(context)).rejects.toThrow(
      "__OW_NAMESPACE",
    );
    expect(context.adminUiClient.unregisterExtension).not.toHaveBeenCalled();
  });

  test("unregisters and logs success when the client resolves", async () => {
    const logger = createMockLogger();
    const context = { ...createMockAdminUiContext({}), logger };

    await expect(
      unregisterExtensionForUpgrade(context),
    ).resolves.toBeUndefined();

    expect(context.adminUiClient.unregisterExtension).toHaveBeenCalledWith({
      extensionName: "test-ns",
      workspaceName: context.appData.workspaceName,
    });
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("unregistered successfully"),
    );
  });

  test("treats a 404 as already removed and resolves", async () => {
    const logger = createMockLogger();
    const httpError = makeHttpError(
      404,
      "Not Found",
      JSON.stringify({ message: "No such entity" }),
    );
    const context = {
      ...createMockAdminUiContext({
        unregisterExtensionImpl: () => Promise.reject(httpError),
      }),
      logger,
    };

    await expect(
      unregisterExtensionForUpgrade(context),
    ).resolves.toBeUndefined();

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("already absent"),
    );
  });

  test("throws an enriched error on a non-404 failure", async () => {
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

    await expect(unregisterExtensionForUpgrade(context)).rejects.toThrow(
      UNREGISTER_FAILURE_PATTERN,
    );
    expect(logger.error).toHaveBeenCalledOnce();
  });
});
