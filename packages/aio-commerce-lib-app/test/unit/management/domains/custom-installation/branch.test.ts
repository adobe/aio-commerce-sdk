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

import { isBranchStep } from "#management/common/workflow/step";
import { applyCustomScript } from "#management/domains/custom-installation/apply";
import { createCustomInstallationStep } from "#management/domains/custom-installation/branch";
import {
  configWithCustomInstallationSteps,
  minimalValidConfig,
} from "#test/fixtures/config";
import { createMockInstallationContext } from "#test/fixtures/installation";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { CustomInstallationStepIdentity } from "#management/domains/custom-installation/types";

describe("createCustomInstallationStep", () => {
  test("is not configured for a config with no custom steps and no history", () => {
    const step = createCustomInstallationStep(minimalValidConfig);
    expect(step.isConfigured(minimalValidConfig)).toBe(false);
  });

  test("is not configured when no run history is stored and the config has no custom steps", () => {
    const step = createCustomInstallationStep(minimalValidConfig, null);
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

  test("puts the steps that ran first, newest first, then the configured steps that have not run, in the lifecycle tree", () => {
    const step = createCustomInstallationStep(
      configWithCustomInstallationSteps,
      [
        { name: "Old Step", script: "./old-step.js" },
        { name: "Demo Error", script: "./demo-error.js" },
      ],
      true,
    );

    expect(step.children.map((child) => child.name)).toEqual([
      "demoError",
      "oldStep",
      "demoSuccess",
    ]);
  });

  test("describes a step that ran but is no longer configured", () => {
    const step = createCustomInstallationStep(
      configWithCustomInstallationSteps,
      [{ name: "Old Step", script: "./old-step.js" }],
      true,
    );

    expect(step.children.at(0)?.meta.install).toEqual({
      description:
        "Previously executed custom installation step, no longer present in the configuration.",
      label: "Old Step",
    });
  });

  test.each(["install", "uninstall", "upgrade"] as const)(
    "labels a step with its name and description on %s",
    (operation) => {
      const step = createCustomInstallationStep(
        configWithCustomInstallationSteps,
        [],
        true,
      );

      expect(step.children.at(0)?.meta[operation]).toEqual({
        description: "Success script",
        label: "Demo Success",
      });
    },
  );

  describe("lifecycle leaves", () => {
    const config = configWithCustomInstallationSteps;
    const ran = { name: "Demo Success", script: "./demo-success.js" };

    /** Plans the child with the given name of the lifecycle tree. */
    function planChild(
      executedSteps: readonly CustomInstallationStepIdentity[] | null,
      name: string,
      configs: {
        baseline: CommerceAppConfigOutputModel | null;
        target: CommerceAppConfigOutputModel | null;
      },
    ) {
      const step = createCustomInstallationStep(config, executedSteps, true);
      const child = step.children.find((candidate) => candidate.name === name);
      expect.assert(child?.plan, `Expected a lifecycle leaf named ${name}`);

      return child.plan(
        {
          baseline: configs.baseline
            ? { config: configs.baseline, data: null }
            : null,
          path: ["installation", "customInstallationSteps", name],
          targetConfig: configs.target,
        },
        createMockInstallationContext(),
      );
    }

    test("apply only their own step", () => {
      const step = createCustomInstallationStep(config, [ran], true);
      expect(step.children.map((child) => child.apply)).toEqual([
        applyCustomScript,
        applyCustomScript,
      ]);
    });

    test("plan an `add` for a configured step that has not run", async () => {
      const result = await planChild([ran], "demoError", {
        baseline: config,
        target: config,
      });

      expect(result).toMatchObject({
        plan: { operations: [{ id: "add:Demo Error", kind: "add" }] },
      });
    });

    test("plan nothing for a step that ran", async () => {
      const result = await planChild([ran], "demoSuccess", {
        baseline: config,
        target: config,
      });

      expect(result).toMatchObject({ plan: { operations: [] } });
    });

    test("plan a `remove` for a configured step on uninstall when no run history is stored", async () => {
      const result = await planChild(null, "demoSuccess", {
        baseline: config,
        target: null,
      });

      expect(result).toMatchObject({
        plan: { operations: [{ before: ran, kind: "remove" }] },
      });
    });

    test("plan nothing for a configured step that never ran on uninstall", async () => {
      const result = await planChild([], "demoSuccess", {
        baseline: config,
        target: null,
      });

      expect(result).toMatchObject({ plan: { operations: [] } });
    });

    test("warn about a step that ran but is no longer configured on uninstall", async () => {
      const result = await planChild(
        [{ name: "Old Step", script: "./old-step.js" }],
        "oldStep",
        { baseline: config, target: null },
      );

      expect(result).toMatchObject({
        issues: [{ code: "CUSTOM_INSTALLATION_STEP_REMOVED" }],
        plan: { operations: [] },
      });
    });

    test("are left out of the deprecated trees", () => {
      const step = createCustomInstallationStep(config, [ran]);
      expect(step.children.map((child) => child.plan)).toEqual([undefined]);
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
