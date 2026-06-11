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
  configWithAdminUi,
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
          label: "Admin UI",
          description: "Registers the extension with Adobe Commerce Admin UI",
        },
        uninstall: {
          label: "Admin UI",
          description: "Removes the extension from Adobe Commerce Admin UI",
        },
      });
    });

    test("should only run if adminUi is defined", () => {
      expect.assert(adminUiStep.when);

      expect(adminUiStep.when(configWithAdminUi)).toBe(true);

      expect(adminUiStep.when(minimalValidConfig)).toBe(false);
      expect(adminUiStep.when(configWithWebhooks)).toBe(false);
    });

    test("should have meta.uninstall defined", () => {
      expect(adminUiStep.meta.uninstall).toBeDefined();
    });

    test("should have one leaf child: register-extension", () => {
      expect(adminUiStep.children).toHaveLength(1);
      expect(adminUiStep.children[0].name).toBe("register-extension");
      expect(isLeafStep(adminUiStep.children[0])).toBe(true);
    });
  });

  describe("registerExtensionStep uninstall handler", () => {
    const registerExtensionStep = adminUiStep.children[0];

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

    test("should call unregisterExtension with workspaceName and __OW_NAMESPACE", async () => {
      const context = createMockAdminUiContext();

      await registerExtensionStep.uninstall?.(configWithAdminUi, context);

      expect(context.adminUiClient.unregisterExtension).toHaveBeenCalledWith({
        workspaceName: context.appData.workspaceName,
        extensionName: "test-namespace",
      });
    });

    test("should not throw when the uninstall call fails (best-effort)", async () => {
      const context = createMockAdminUiContext({
        unregisterExtensionImpl: () =>
          Promise.reject(new Error("Commerce API error")),
      });

      await expect(
        registerExtensionStep.uninstall?.(configWithAdminUi, context),
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

      await registerExtensionStep.uninstall?.(configWithAdminUi, context);

      expect(logger.warn).toHaveBeenCalled();
    });
  });
});
