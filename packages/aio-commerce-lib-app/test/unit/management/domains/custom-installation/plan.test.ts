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

import {
  planCustomInstallationSteps,
  planCustomScript,
} from "#management/domains/custom-installation/plan";
import {
  configWithCustomInstallationSteps,
  createMockConfig,
  minimalValidConfig,
} from "#test/fixtures/config";
import { createMockInstallationContext } from "#test/fixtures/installation";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { PlanningInput } from "#management/common/workflow/resource";
import type {
  CustomInstallationSnapshotData,
  CustomInstallationStepIdentity,
} from "#management/domains/custom-installation/types";

const path = ["installation", "customInstallationSteps", "reconciliation"];

describe("planCustomInstallationSteps", () => {
  test("plans an `add` for every step when there is no baseline", async () => {
    const input: PlanningInput<
      CommerceAppConfigOutputModel,
      CustomInstallationSnapshotData
    > = {
      baseline: null,
      path,
      targetConfig: configWithCustomInstallationSteps,
    };

    const result = await planCustomInstallationSteps(
      input,
      createMockInstallationContext(),
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([
      {
        after: { name: "Demo Success", script: "./demo-success.js" },
        id: "add:Demo Success",
        itemRefs: [
          {
            config: {
              description: "Success script",
              name: "Demo Success",
              script: "./demo-success.js",
            },
            key: "Demo Success",
          },
        ],
        kind: "add",
        label: 'Run custom installation step "Demo Success"',
        reason: "change",
      },
      {
        after: { name: "Demo Error", script: "./demo-error.js" },
        id: "add:Demo Error",
        itemRefs: [
          {
            config: {
              description: "Error script",
              name: "Demo Error",
              script: "./demo-error.js",
            },
            key: "Demo Error",
          },
        ],
        kind: "add",
        label: 'Run custom installation step "Demo Error"',
        reason: "change",
      },
    ]);
    expect(result.plan.baselineExecutedSteps).toEqual([]);
  });

  test("plans no operations for a step present in both baseline and target", async () => {
    const input: PlanningInput<
      CommerceAppConfigOutputModel,
      CustomInstallationSnapshotData
    > = {
      baseline: {
        config: configWithCustomInstallationSteps,
        data: {
          executedSteps: [
            { name: "Demo Success", script: "./demo-success.js" },
            { name: "Demo Error", script: "./demo-error.js" },
          ],
        },
      },
      path,
      targetConfig: configWithCustomInstallationSteps,
    };

    const result = await planCustomInstallationSteps(
      input,
      createMockInstallationContext(),
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([]);
  });

  test("plans a `remove` for a step no longer in the target config", async () => {
    const input: PlanningInput<
      CommerceAppConfigOutputModel,
      CustomInstallationSnapshotData
    > = {
      baseline: {
        config: configWithCustomInstallationSteps,
        data: {
          executedSteps: [
            { name: "Demo Success", script: "./demo-success.js" },
            { name: "Demo Error", script: "./demo-error.js" },
          ],
        },
      },
      path,
      targetConfig: minimalValidConfig,
    };

    const result = await planCustomInstallationSteps(
      input,
      createMockInstallationContext(),
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([
      {
        before: { name: "Demo Success", script: "./demo-success.js" },
        id: "remove:Demo Success",
        itemRefs: [
          {
            config: {
              description: "Success script",
              name: "Demo Success",
              script: "./demo-success.js",
            },
            key: "Demo Success",
          },
        ],
        kind: "remove",
        label: 'Remove custom installation step "Demo Success"',
        reason: "change",
      },
      {
        before: { name: "Demo Error", script: "./demo-error.js" },
        id: "remove:Demo Error",
        itemRefs: [
          {
            config: {
              description: "Error script",
              name: "Demo Error",
              script: "./demo-error.js",
            },
            key: "Demo Error",
          },
        ],
        kind: "remove",
        label: 'Remove custom installation step "Demo Error"',
        reason: "change",
      },
    ]);
  });

  test("plans the uninstall of every step that ran when there is no target config", async () => {
    const result = await planCustomInstallationSteps(
      {
        baseline: { config: configWithCustomInstallationSteps, data: null },
        path,
        targetConfig: null,
      } as unknown as PlanningInput<
        CommerceAppConfigOutputModel,
        CustomInstallationSnapshotData
      >,
      createMockInstallationContext(),
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.baselineConfig).toBe(configWithCustomInstallationSteps);
    expect(result.plan.operations.map((op) => op.id)).toEqual(
      configWithCustomInstallationSteps.installation.customInstallationSteps.map(
        (step) => `remove:${step.name}`,
      ),
    );
  });

  test("seeds baseline history from config when the snapshot predates the reconciliation leaf", async () => {
    const input: PlanningInput<
      CommerceAppConfigOutputModel,
      CustomInstallationSnapshotData
    > = {
      baseline: {
        config: configWithCustomInstallationSteps,
        // A pre-reconciliation snapshot has no executed-step history at this path.
        data: undefined as unknown as CustomInstallationSnapshotData,
      },
      path,
      targetConfig: configWithCustomInstallationSteps,
    };

    const result = await planCustomInstallationSteps(
      input,
      createMockInstallationContext(),
    );

    expect.assert(result.kind === "planned");
    // Already-installed steps must be treated as retained, never re-added.
    expect(result.plan.operations).toEqual([]);
    expect(result.plan.baselineExecutedSteps).toEqual([
      { name: "Demo Success", script: "./demo-success.js" },
      { name: "Demo Error", script: "./demo-error.js" },
    ]);
  });

  test("plans an `add` for a new step alongside a retained one", async () => {
    const input: PlanningInput<
      CommerceAppConfigOutputModel,
      CustomInstallationSnapshotData
    > = {
      baseline: {
        config: configWithCustomInstallationSteps,
        data: {
          executedSteps: [
            { name: "Demo Success", script: "./demo-success.js" },
          ],
        },
      },
      path,
      targetConfig: configWithCustomInstallationSteps,
    };

    const result = await planCustomInstallationSteps(
      input,
      createMockInstallationContext(),
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([
      {
        after: { name: "Demo Error", script: "./demo-error.js" },
        id: "add:Demo Error",
        itemRefs: [
          {
            config: {
              description: "Error script",
              name: "Demo Error",
              script: "./demo-error.js",
            },
            key: "Demo Error",
          },
        ],
        kind: "add",
        label: 'Run custom installation step "Demo Error"',
        reason: "change",
      },
    ]);
  });
});

describe("planCustomScript", () => {
  const scriptPath = ["installation", "customInstallationSteps", "demoSuccess"];
  const declared = {
    description: "Success script",
    name: "Demo Success",
    script: "./demo-success.js",
  };

  const executed = { name: "Demo Success", script: "./demo-success.js" };
  const removed = { name: "Old Step", script: "./old-step.js" };
  const configWithOldStep = createMockConfig({
    installation: {
      customInstallationSteps: [{ ...removed, description: "Old step" }],
    },
  });

  const removedIssue = {
    blocking: false,
    code: "CUSTOM_INSTALLATION_STEP_REMOVED",
    domain: "customInstallationSteps",
    message:
      'Custom installation step "Old Step" is no longer in the configuration, so nothing will run for it. If its script had an uninstall, it can\'t run, because the script is no longer deployed.',
    severity: "warning",
  };

  /** Plans a step's leaf against the given baseline and target configs. */
  function plan(
    step: {
      declared: typeof declared | null;
      executed: CustomInstallationStepIdentity | null | undefined;
    },
    configs: {
      baseline: CommerceAppConfigOutputModel | null;
      target: CommerceAppConfigOutputModel | null;
    },
    context = createMockInstallationContext(),
  ) {
    return planCustomScript(
      step.declared,
      step.executed,
      {
        baseline: configs.baseline
          ? { config: configs.baseline, data: executed }
          : null,
        path: scriptPath,
        targetConfig: configs.target,
      },
      context,
    );
  }

  test("plans an `add` for a declared step that has not run", async () => {
    const result = await plan(
      { declared, executed: null },
      { baseline: null, target: configWithCustomInstallationSteps },
    );

    expect(result).toEqual({
      issues: [],
      kind: "planned",
      plan: {
        baselineConfig: null,
        operations: [
          {
            after: executed,
            id: "add:Demo Success",
            itemRefs: [{ config: declared, key: "Demo Success" }],
            kind: "add",
            label: 'Run custom installation step "Demo Success"',
            reason: "change",
          },
        ],
        path: scriptPath,
      },
    });
  });

  test("plans an `add` for a declared step when no run history is stored", async () => {
    const result = await plan(
      { declared, executed: undefined },
      { baseline: null, target: configWithCustomInstallationSteps },
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations.map((op) => op.kind)).toEqual(["add"]);
  });

  test("plans nothing for a declared step that already ran", async () => {
    const context = createMockInstallationContext();
    const result = await plan(
      { declared, executed },
      {
        baseline: configWithCustomInstallationSteps,
        target: configWithCustomInstallationSteps,
      },
      context,
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([]);
    expect(result.issues).toEqual([]);
    expect(context.logger.warn).not.toHaveBeenCalled();
  });

  test("logs a warning when a step that ran now points to a different script", async () => {
    const context = createMockInstallationContext();
    const result = await plan(
      { declared, executed: { ...executed, script: "./old-path.js" } },
      {
        baseline: configWithCustomInstallationSteps,
        target: configWithCustomInstallationSteps,
      },
      context,
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([]);
    expect(context.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("now points to a different script"),
    );
  });

  test("warns about a step the upgrade removes without planning it", async () => {
    const result = await plan(
      { declared: null, executed: removed },
      {
        baseline: configWithOldStep,
        target: configWithCustomInstallationSteps,
      },
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([]);
    expect(result.issues).toEqual([removedIssue]);
  });

  test("does not warn about a step an earlier upgrade removed", async () => {
    const result = await plan(
      { declared: null, executed: removed },
      {
        baseline: configWithCustomInstallationSteps,
        target: configWithCustomInstallationSteps,
      },
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([]);
    expect(result.issues).toEqual([]);
  });

  test("plans a `remove` for a declared step that ran when uninstalling", async () => {
    const result = await plan(
      { declared, executed },
      { baseline: configWithCustomInstallationSteps, target: null },
    );

    expect(result).toEqual({
      issues: [],
      kind: "planned",
      plan: {
        baselineConfig: configWithCustomInstallationSteps,
        operations: [
          {
            before: executed,
            id: "remove:Demo Success",
            itemRefs: [{ config: declared, key: "Demo Success" }],
            kind: "remove",
            label: 'Remove custom installation step "Demo Success"',
            reason: "change",
          },
        ],
        path: scriptPath,
      },
    });
  });

  test("plans a `remove` for a declared step when uninstalling without a stored run history", async () => {
    const result = await plan(
      { declared, executed: undefined },
      { baseline: configWithCustomInstallationSteps, target: null },
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toMatchObject([
      { before: executed, kind: "remove" },
    ]);
  });

  test("plans nothing for a declared step that never ran when uninstalling", async () => {
    const result = await plan(
      { declared, executed: null },
      { baseline: configWithCustomInstallationSteps, target: null },
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([]);
    expect(result.issues).toEqual([]);
  });

  test("warns about a step that ran but is no longer deployed when uninstalling", async () => {
    const result = await plan(
      { declared: null, executed: removed },
      { baseline: configWithCustomInstallationSteps, target: null },
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([]);
    expect(result.issues).toEqual([removedIssue]);
  });
});
