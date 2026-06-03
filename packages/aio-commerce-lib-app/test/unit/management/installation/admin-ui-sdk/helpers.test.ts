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
  registerExtension,
  unregisterExtension,
} from "#management/installation/admin-ui-sdk/helpers";
import { createMockAdminUiSdkContext } from "#test/fixtures/admin-ui-sdk";
import { makeHttpError } from "#test/fixtures/http-error";
import { createMockLogger } from "#test/fixtures/installation";

const REGISTER_EXTENSION_COMBINED_PATTERN =
  /Failed to register Admin UI SDK extension.*Insufficient permissions/;

describe("registerExtension", () => {
  beforeEach(() => {
    vi.stubEnv("__OW_NAMESPACE", "test-ns");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("logs success with extensionId when registerExtension call resolves", async () => {
    const logger = createMockLogger();
    const context = {
      ...createMockAdminUiSdkContext({
        registerExtensionImpl: () =>
          Promise.resolve({ extensionId: "ext-123" }),
      }),
      logger,
    };

    await expect(registerExtension(context)).resolves.toBeUndefined();

    expect(context.adminUiSdkClient.registerExtension).toHaveBeenCalledWith({
      extensionName: "test-ns",
      extensionTitle: context.appData.projectTitle,
      extensionUrl: "https://test-ns.adobeio-static.net/index.html",
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
    const context = createMockAdminUiSdkContext({
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
    const context = {
      ...createMockAdminUiSdkContext({
        registerExtensionImpl: () => Promise.reject(httpError),
      }),
      logger,
    };

    await expect(registerExtension(context)).rejects.toThrow();

    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringMatching(REGISTER_EXTENSION_COMBINED_PATTERN),
    );
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
    const context = { ...createMockAdminUiSdkContext({}), logger };

    await expect(unregisterExtension(context)).resolves.toBeUndefined();

    expect(context.adminUiSdkClient.unregisterExtension).not.toHaveBeenCalled();
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
      ...createMockAdminUiSdkContext({
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
