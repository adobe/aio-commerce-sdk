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

import { planCustomInstallationSteps } from "#management/domains/custom-installation/plan";
import {
  configWithCustomInstallationSteps,
  minimalValidConfig,
} from "#test/fixtures/config";
import { createMockInstallationContext } from "#test/fixtures/installation";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { PlanningInput } from "#management/common/workflow/resource";
import type { CustomInstallationSnapshotData } from "#management/domains/custom-installation/types";

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
        kind: "add",
        label: 'Run custom installation step "Demo Success"',
      },
      {
        after: { name: "Demo Error", script: "./demo-error.js" },
        id: "add:Demo Error",
        kind: "add",
        label: 'Run custom installation step "Demo Error"',
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
        kind: "remove",
        label:
          'Custom installation step "Demo Success" no longer in the configuration',
      },
      {
        before: { name: "Demo Error", script: "./demo-error.js" },
        id: "remove:Demo Error",
        kind: "remove",
        label:
          'Custom installation step "Demo Error" no longer in the configuration',
      },
    ]);
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
        kind: "add",
        label: 'Run custom installation step "Demo Error"',
      },
    ]);
  });
});
