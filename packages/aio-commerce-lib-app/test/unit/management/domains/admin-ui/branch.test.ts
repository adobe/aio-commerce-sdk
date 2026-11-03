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

import { describe, expect, test } from "vitest";

import { isBranchStep, isLeafStep } from "#management/common/workflow/step";
import { adminUiStep } from "#management/domains/admin-ui/branch";
import {
  configWithFullAdminUiV2,
  configWithWebhooks,
  minimalValidConfig,
} from "#test/fixtures/config";

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
        upgrade: {
          description:
            "Reconciles the extension's Admin UI components with Adobe Commerce",
          label: "Admin UI",
        },
      });
    });

    test("should only run if adminUi is defined", () => {
      expect.assert(adminUiStep.isConfigured);

      expect(adminUiStep.isConfigured(configWithFullAdminUiV2)).toBe(true);
      expect(adminUiStep.isConfigured(minimalValidConfig)).toBe(false);
      expect(adminUiStep.isConfigured(configWithWebhooks)).toBe(false);
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
});
