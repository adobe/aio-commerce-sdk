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

import { adminUiStep } from "#management/installation/admin-ui/branch";
import {
  isBranchStep,
  isLeafStep,
} from "#management/installation/workflow/step";
import { createMockAdminUiContext } from "#test/fixtures/admin-ui";
import {
  configWithFullAdminUiV2,
  configWithWebhooks,
  minimalValidConfig,
} from "#test/fixtures/config";
import { createMockLogger } from "#test/fixtures/installation";

describe("admin-ui installation module", () => {
  describe("adminUiStep branch step", () => {
    test("should be a branch step with correct name and meta", () => {
      expect(isBranchStep(adminUiStep)).toBe(true);
      expect(adminUiStep.name).toBe("admin-ui");
      expect(adminUiStep.meta).toEqual({
        install: {
          description: "Registers the extension with Adobe Commerce Admin UI",
          label: "Admin UI",
        },
        uninstall: {
          description: "Removes the extension from Adobe Commerce Admin UI",
          label: "Admin UI",
        },
      });
    });

    test("should only run if adminUi is defined", () => {
      expect.assert(adminUiStep.when);

      expect(adminUiStep.when(configWithFullAdminUiV2)).toBe(true);
      expect(adminUiStep.when(minimalValidConfig)).toBe(false);
      expect(adminUiStep.when(configWithWebhooks)).toBe(false);
    });

    test("should have meta.uninstall defined", () => {
      expect(adminUiStep.meta.uninstall).toBeDefined();
    });

    test("should have two leaf children: enable-admin-ui-sdk then register-extension", () => {
      expect(adminUiStep.children).toHaveLength(2);
      expect(adminUiStep.children[0].name).toBe("enable-admin-ui-sdk");
      expect(adminUiStep.children[1].name).toBe("register-extension");
      expect(isLeafStep(adminUiStep.children[0])).toBe(true);
      expect(isLeafStep(adminUiStep.children[1])).toBe(true);
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
});
