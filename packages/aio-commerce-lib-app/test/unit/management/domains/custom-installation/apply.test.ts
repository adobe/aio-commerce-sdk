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

import { describe, expect, test, vi } from "vitest";

import { applyCustomInstallationSteps } from "#management/domains/custom-installation/apply";
import {
  configWithCustomInstallationSteps,
  minimalValidConfig,
} from "#test/fixtures/config";
import { createMockInstallationContext } from "#test/fixtures/installation";

import type { ApplyContext } from "#management/common/workflow/resource";
import type { CustomInstallationDomainPlan } from "#management/domains/custom-installation/types";

const path = ["installation", "customInstallationSteps", "reconciliation"];
const SCRIPT_NOT_FOUND_PATTERN = /not found in customScripts context/;

/** Builds an `ApplyContext` with the given custom scripts loaded. */
function buildApplyContext(
  customScripts: Record<string, unknown>,
  targetConfig: ApplyContext["targetConfig"] = null,
): ApplyContext {
  return {
    ...createMockInstallationContext({ customScripts }),
    attemptId: "attempt-1",
    baseline: null,
    targetConfig,
  };
}

describe("applyCustomInstallationSteps", () => {
  test("runs install for a newly added step and persists its identity", async () => {
    const installFn = vi.fn().mockResolvedValue({ status: "success" });
    const scriptModule = { install: installFn };

    const plan: CustomInstallationDomainPlan = {
      baselineExecutedSteps: [],
      operations: [
        {
          after: { name: "Demo Success", script: "./demo-success.js" },
          id: "add:Demo Success",
          kind: "add",
          label: "Run",
        },
      ],
      path,
      targetConfig: configWithCustomInstallationSteps,
    };

    const context = buildApplyContext(
      { "./demo-success.js": scriptModule },
      configWithCustomInstallationSteps,
    );

    const result = await applyCustomInstallationSteps(plan, context);

    expect(installFn).toHaveBeenCalledWith(
      configWithCustomInstallationSteps,
      context,
    );
    expect(result.snapshotData?.executedSteps).toEqual([
      {
        data: { status: "success" },
        name: "Demo Success",
        script: "./demo-success.js",
      },
    ]);
  });

  test("records the install handler's return value in the snapshot data", async () => {
    const plan: CustomInstallationDomainPlan = {
      baselineExecutedSteps: [],
      operations: [
        {
          after: { name: "Demo Success", script: "./demo-success.js" },
          id: "add:Demo Success",
          kind: "add",
          label: "Run",
        },
      ],
      path,
      targetConfig: configWithCustomInstallationSteps,
    };
    const context = buildApplyContext(
      { "./demo-success.js": { install: () => ({ token: "abc" }) } },
      configWithCustomInstallationSteps,
    );

    const result = await applyCustomInstallationSteps(plan, context);

    expect(result.snapshotData?.executedSteps).toEqual([
      {
        data: { token: "abc" },
        name: "Demo Success",
        script: "./demo-success.js",
      },
    ]);
  });

  test("throws when a newly added step's script cannot be resolved", async () => {
    const plan: CustomInstallationDomainPlan = {
      baselineExecutedSteps: [],
      operations: [
        {
          after: { name: "Demo Success", script: "./demo-success.js" },
          id: "add:Demo Success",
          kind: "add",
          label: "Run",
        },
      ],
      path,
      targetConfig: configWithCustomInstallationSteps,
    };

    const context = buildApplyContext({}, configWithCustomInstallationSteps);

    await expect(applyCustomInstallationSteps(plan, context)).rejects.toThrow(
      SCRIPT_NOT_FOUND_PATTERN,
    );
  });

  test("does not re-run an unmodified retained step", async () => {
    const install = vi.fn().mockResolvedValue({ status: "success" });
    const scriptModule = { install };

    const plan: CustomInstallationDomainPlan = {
      baselineExecutedSteps: [
        { name: "Demo Success", script: "./demo-success.js" },
        { name: "Demo Error", script: "./demo-error.js" },
      ],
      operations: [],
      path,
      targetConfig: configWithCustomInstallationSteps,
    };

    const context = buildApplyContext(
      {
        "./demo-error.js": scriptModule,
        "./demo-success.js": scriptModule,
      },
      configWithCustomInstallationSteps,
    );

    const result = await applyCustomInstallationSteps(plan, context);

    expect(install).not.toHaveBeenCalled();
    expect(context.logger.warn).not.toHaveBeenCalled();
    expect(result.snapshotData?.executedSteps).toEqual(
      plan.baselineExecutedSteps,
    );
  });

  test("warns when a retained step's script path changed while its name stayed the same", async () => {
    const install = vi.fn().mockResolvedValue({ status: "success" });
    const scriptModule = { install };

    const targetConfig = structuredClone(configWithCustomInstallationSteps);
    targetConfig.installation.customInstallationSteps[0].script =
      "./demo-success-v2.js";

    const plan: CustomInstallationDomainPlan = {
      baselineExecutedSteps: [
        { name: "Demo Success", script: "./demo-success.js" },
      ],
      operations: [],
      path,
      targetConfig,
    };

    const context = buildApplyContext(
      { "./demo-success-v2.js": scriptModule },
      targetConfig,
    );

    await applyCustomInstallationSteps(plan, context);

    expect(context.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("now points to a different script"),
    );
  });

  test("carries a removed step's identity forward without running its uninstall", async () => {
    const plan: CustomInstallationDomainPlan = {
      baselineExecutedSteps: [{ name: "Old Step", script: "./old-step.js" }],
      operations: [
        {
          before: { name: "Old Step", script: "./old-step.js" },
          id: "remove:Old Step",
          kind: "remove",
          label: "Removed",
        },
      ],
      path,
      targetConfig: minimalValidConfig,
    };

    const context = buildApplyContext({}, minimalValidConfig);
    const result = await applyCustomInstallationSteps(plan, context);

    expect(result.snapshotData?.executedSteps).toEqual(
      plan.baselineExecutedSteps,
    );
  });

  test("uninstalls every recorded step, newest first, when there is no target config", async () => {
    const order: string[] = [];
    const first = {
      install: vi.fn(),
      uninstall: vi.fn(() => {
        order.push("first");
      }),
    };
    const second = {
      install: vi.fn(),
      uninstall: vi.fn(() => {
        order.push("second");
      }),
    };

    const plan: CustomInstallationDomainPlan = {
      baselineExecutedSteps: [
        { name: "First Step", script: "./first.js" },
        { name: "Second Step", script: "./second.js" },
      ],
      operations: [
        {
          before: { name: "First Step", script: "./first.js" },
          id: "remove:First Step",
          kind: "remove",
          label: "Removed",
        },
        {
          before: { name: "Second Step", script: "./second.js" },
          id: "remove:Second Step",
          kind: "remove",
          label: "Removed",
        },
      ],
      path,
      targetConfig: null,
    };

    const context = {
      ...buildApplyContext({ "./first.js": first, "./second.js": second }),
      baseline: { config: minimalValidConfig, data: null },
    };

    const result = await applyCustomInstallationSteps(plan, context);

    expect(order).toEqual(["second", "first"]);
    expect(result.snapshotData?.executedSteps).toEqual([]);
  });

  test("throws when uninstalling without a baseline configuration", async () => {
    const plan: CustomInstallationDomainPlan = {
      baselineExecutedSteps: [{ name: "Old Step", script: "./old-step.js" }],
      operations: [],
      path,
      targetConfig: null,
    };

    await expect(
      applyCustomInstallationSteps(plan, buildApplyContext({}, null)),
    ).rejects.toThrow("without a baseline configuration");
  });

  test("skips a recorded step whose script is no longer loadable", async () => {
    const plan: CustomInstallationDomainPlan = {
      baselineExecutedSteps: [{ name: "Old Step", script: "./old-step.js" }],
      operations: [],
      path,
      targetConfig: null,
    };

    const context = {
      ...buildApplyContext({}),
      baseline: { config: minimalValidConfig, data: null },
    };

    const result = await applyCustomInstallationSteps(plan, context);
    expect(result.snapshotData?.executedSteps).toEqual([]);
  });
});
