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
import { createCustomInstallationStep } from "#management/domains/custom-installation/branch";
import {
  configWithCustomInstallationSteps,
  minimalValidConfig,
} from "#test/fixtures/config";
import { createMockInstallationContext } from "#test/fixtures/installation";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

describe("createCustomInstallationStep", () => {
  test("is not configured for a config with no custom steps and no history", () => {
    const step = createCustomInstallationStep(minimalValidConfig);
    expect(step.isConfigured(minimalValidConfig)).toBe(false);
  });

  test("is configured when there is executed-step history, even with no current steps", () => {
    const step = createCustomInstallationStep(minimalValidConfig, [
      { name: "Old Step", script: "./old-step.js" },
    ]);

    expect(step.isConfigured(minimalValidConfig)).toBe(true);
  });

  test("builds a single uninstall-only leaf for a removed step when there is history", () => {
    const step = createCustomInstallationStep(
      configWithCustomInstallationSteps,
      [{ name: "Old Step", script: "./old-step.js" }],
    );

    // No reconciliation leaf and no separate per-script leaves here: with history present,
    // the full-uninstall tree is built entirely from that history (see below).
    expect(step.children.map((child) => child.name)).toEqual(["oldStep"]);
  });

  test("tears down every step newest-first, mirroring migration rollback order", () => {
    // A and B ran at install; C was added in a later upgrade. A was since removed from the
    // config. Uninstalling everything should run in the reverse of that run order: C, B, A.
    const step = createCustomInstallationStep(
      configWithCustomInstallationSteps,
      [
        { name: "A", script: "./a.js" },
        { name: "Demo Success", script: "./demo-success.js" },
        { name: "Demo Error", script: "./demo-error.js" },
      ],
    );

    expect(step.children.map((child) => child.name)).toEqual([
      "demoError",
      "demoSuccess",
      "a",
    ]);
  });

  describe("reconciliation step", () => {
    function getReconciliationStep(
      config: CommerceAppConfigOutputModel = configWithCustomInstallationSteps,
    ) {
      // The reconciliation leaf is only added to the upgrade tree.
      const step = createCustomInstallationStep(config, [], true);
      const reconciliation = step.children.find(
        (child) => child.name === "reconciliation",
      );

      expect.assert(reconciliation && isLeafStep(reconciliation));
      return reconciliation;
    }

    test("is left out of the tree unless reconciliation is requested", () => {
      const step = createCustomInstallationStep(
        configWithCustomInstallationSteps,
      );
      const names = step.children.map((child) => child.name);
      expect(names).not.toContain("reconciliation");
    });

    test("has plan and apply capabilities for the upgrade path", () => {
      const reconciliation = getReconciliationStep();
      expect(reconciliation.plan).toBeDefined();
      expect(reconciliation.apply).toBeDefined();
    });

    test("records the configured steps' identities when its install runs", () => {
      const reconciliation = getReconciliationStep();

      const result = reconciliation.install(
        configWithCustomInstallationSteps,
        createMockInstallationContext(),
      );

      expect(result).toEqual({
        executedSteps: [
          { name: "Demo Success", script: "./demo-success.js" },
          { name: "Demo Error", script: "./demo-error.js" },
        ],
      });
    });

    test("records no executed steps for a config without custom installation steps", () => {
      const reconciliation = getReconciliationStep(minimalValidConfig);

      const result = reconciliation.install(
        minimalValidConfig,
        createMockInstallationContext(),
      );
      expect(result).toEqual({ executedSteps: [] });
    });
  });
});

describe("customInstallationStepBase (via createCustomInstallationStep)", () => {
  test("returns a branch step", () => {
    const step = createCustomInstallationStep(
      configWithCustomInstallationSteps,
    );
    expect(isBranchStep(step)).toBe(true);
  });
});
