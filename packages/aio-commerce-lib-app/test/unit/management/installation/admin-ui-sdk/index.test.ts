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

import { adminUiSdkStep } from "#management/installation/admin-ui-sdk/branch";
import {
  isBranchStep,
  isLeafStep,
} from "#management/installation/workflow/step";
import {
  configWithAdminUiSdk,
  configWithWebhooks,
  minimalValidConfig,
} from "#test/fixtures/config";
import {
  createMockInstallationContext,
  createMockLogger,
} from "#test/fixtures/installation";

import type { AdminUiSdkExecutionContext } from "#management/installation/admin-ui-sdk/utils";

/** Creates a mock AdminUiSdkExecutionContext with a spy Commerce client. */
function createMockAdminUiSdkContext(
  deleteImpl?: () => Promise<unknown>,
): AdminUiSdkExecutionContext {
  const mockInstallation = createMockInstallationContext();

  return {
    ...mockInstallation,
    commerceClient: {
      delete: vi
        .fn()
        .mockImplementation(deleteImpl ?? (() => Promise.resolve())),
    } as unknown as AdminUiSdkExecutionContext["commerceClient"],
  };
}

describe("admin-ui-sdk installation module", () => {
  describe("adminUiSdkStep branch step", () => {
    test("should be a branch step with correct name and meta", () => {
      expect(isBranchStep(adminUiSdkStep)).toBe(true);
      expect(adminUiSdkStep.name).toBe("admin-ui-sdk");
      expect(adminUiSdkStep.meta).toEqual({
        install: {
          label: "Admin UI SDK",
          description:
            "Registers the extension with Adobe Commerce Admin UI SDK",
        },
        uninstall: {
          label: "Admin UI SDK",
          description: "Removes the extension from Adobe Commerce Admin UI SDK",
        },
      });
    });

    test("should only run if adminUiSdk is defined", () => {
      expect.assert(adminUiSdkStep.when);

      expect(adminUiSdkStep.when(configWithAdminUiSdk)).toBe(true);

      expect(adminUiSdkStep.when(minimalValidConfig)).toBe(false);
      expect(adminUiSdkStep.when(configWithWebhooks)).toBe(false);
    });

    test("should have meta.uninstall defined", () => {
      expect(adminUiSdkStep.meta.uninstall).toBeDefined();
    });

    test("should have one leaf child: register-extension", () => {
      expect(adminUiSdkStep.children).toHaveLength(1);
      expect(adminUiSdkStep.children[0].name).toBe("register-extension");
      expect(isLeafStep(adminUiSdkStep.children[0])).toBe(true);
    });
  });

  describe("registerExtensionStep uninstall handler", () => {
    const registerExtensionStep = adminUiSdkStep.children[0];

    beforeEach(() => {
      vi.stubEnv("__OW_NAMESPACE", "test-namespace");
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    test("should have an uninstall handler defined", () => {
      expect(registerExtensionStep.uninstall).toBeDefined();
    });

    test("should have meta.uninstall defined", () => {
      expect(registerExtensionStep.meta.uninstall).toBeDefined();
    });

    test("should call DELETE for the extension using workspaceName and __OW_NAMESPACE", async () => {
      const context = createMockAdminUiSdkContext();

      await registerExtensionStep.uninstall?.(configWithAdminUiSdk, context);

      expect(context.commerceClient.delete).toHaveBeenCalledWith(
        `adminuisdk/extension/${context.appData.workspaceName}/test-namespace`,
      );
    });

    test("should not throw when the DELETE call fails (best-effort)", async () => {
      const context = createMockAdminUiSdkContext(() =>
        Promise.reject(new Error("Commerce API error")),
      );

      await expect(
        registerExtensionStep.uninstall?.(configWithAdminUiSdk, context),
      ).resolves.toBeUndefined();
    });

    test("should log a warning when the DELETE call fails", async () => {
      const logger = createMockLogger();
      const context = {
        ...createMockAdminUiSdkContext(() =>
          Promise.reject(new Error("Commerce API error")),
        ),
        logger,
      };

      await registerExtensionStep.uninstall?.(configWithAdminUiSdk, context);

      expect(logger.warn).toHaveBeenCalled();
    });
  });
});
