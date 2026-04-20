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
  uninstallExtension,
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

  test("resolves with extension ID on success", async () => {
    const context = createMockAdminUiSdkContext();

    const result = await registerExtension(context);

    expect(result).toEqual({ extensionId: "ext-123" });
  });

  test("throws enriched error when POST fails", async () => {
    const httpError = makeHttpError(
      403,
      "Forbidden",
      JSON.stringify({ message: "Insufficient permissions" }),
    );
    const context = createMockAdminUiSdkContext({
      postImpl: () => Promise.reject(httpError),
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
        postImpl: () => Promise.reject(httpError),
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

describe("uninstallExtension", () => {
  beforeEach(() => {
    vi.stubEnv("__OW_NAMESPACE", "test-ns");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("calls DELETE with correct endpoint", async () => {
    const context = createMockAdminUiSdkContext();

    await uninstallExtension(context);

    expect(context.commerceClient.delete).toHaveBeenCalledWith(
      `adminuisdk/extension/${context.appData.workspaceName}/test-ns`,
    );
  });

  test("resolves without throwing when DELETE fails (best-effort)", async () => {
    const context = createMockAdminUiSdkContext({
      deleteImpl: () => Promise.reject(new Error("DELETE failed")),
    });

    await expect(uninstallExtension(context)).resolves.toBeUndefined();
  });

  test("warns with enriched error message when DELETE fails", async () => {
    const logger = createMockLogger();
    const httpError = makeHttpError(
      500,
      "Internal Server Error",
      JSON.stringify({ message: "Service unavailable" }),
    );
    const context = {
      ...createMockAdminUiSdkContext({
        deleteImpl: () => Promise.reject(httpError),
      }),
      logger,
    };

    await uninstallExtension(context);

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
