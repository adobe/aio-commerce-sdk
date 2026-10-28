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

import { applyCustomScript } from "#management/domains/custom-installation/apply";
import { configWithCustomInstallationSteps } from "#test/fixtures/config";
import { createMockInstallationContext } from "#test/fixtures/installation";

import type { ApplyContext } from "#management/common/workflow/resource";
import type { CustomScriptDomainPlan } from "#management/domains/custom-installation/types";

const path = ["installation", "customInstallationSteps", "demoSuccess"];
const SCRIPT_NOT_FOUND_PATTERN = /not found in customScripts context/;
const step = { name: "Demo Success", script: "./demo-success.js" };

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

/** Builds the plan of a step that runs its `install`. */
function addPlan(): CustomScriptDomainPlan {
  return {
    baselineConfig: null,
    operations: [
      {
        after: step,
        id: "add:Demo Success",
        itemRefs: [],
        kind: "add",
        label: "Run",
        reason: "change",
      },
    ],
    path,
  };
}

/** Builds the plan of a step that runs its `uninstall`. */
function removePlan(
  baselineConfig: CustomScriptDomainPlan["baselineConfig"] = configWithCustomInstallationSteps,
): CustomScriptDomainPlan {
  return {
    baselineConfig,
    operations: [
      {
        before: step,
        id: "remove:Demo Success",
        itemRefs: [],
        kind: "remove",
        label: "Remove",
        reason: "change",
      },
    ],
    path,
  };
}

describe("applyCustomScript", () => {
  test("runs the install of an added step and records it", async () => {
    const install = vi.fn().mockResolvedValue({ status: "success" });
    const context = buildApplyContext(
      { "./demo-success.js": { install } },
      configWithCustomInstallationSteps,
    );

    const result = await applyCustomScript(addPlan(), context);

    expect(install).toHaveBeenCalledWith(
      configWithCustomInstallationSteps,
      context,
    );
    expect(result).toEqual({ snapshotData: step });
  });

  test("throws when an added step's script cannot be resolved", async () => {
    const context = buildApplyContext({}, configWithCustomInstallationSteps);

    await expect(applyCustomScript(addPlan(), context)).rejects.toThrow(
      SCRIPT_NOT_FOUND_PATTERN,
    );
  });

  test("runs the uninstall of a removed step with the baseline config and records `null`", async () => {
    const uninstall = vi.fn();
    const context = buildApplyContext({
      "./demo-success.js": { install: vi.fn(), uninstall },
    });

    const result = await applyCustomScript(removePlan(), context);

    expect(uninstall).toHaveBeenCalledWith(
      configWithCustomInstallationSteps,
      context,
    );
    expect(result).toEqual({ snapshotData: null });
  });

  test("keeps the record of a removed step whose script is not deployed", async () => {
    const context = buildApplyContext({});

    const result = await applyCustomScript(removePlan(), context);

    expect(context.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('"./demo-success.js" is not deployed'),
    );
    expect(result).toEqual({ snapshotData: step });
  });

  test("keeps the record of a removed step whose script exports no uninstall", async () => {
    const context = buildApplyContext({ "./demo-success.js": vi.fn() });

    const result = await applyCustomScript(removePlan(), context);

    expect(context.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("exports no uninstall function"),
    );
    expect(result).toEqual({ snapshotData: step });
  });

  test("keeps the record of a removed step when the plan has no baseline config", async () => {
    const uninstall = vi.fn();
    const context = buildApplyContext({
      "./demo-success.js": { install: vi.fn(), uninstall },
    });

    const result = await applyCustomScript(removePlan(null), context);

    expect(uninstall).not.toHaveBeenCalled();
    expect(result).toEqual({ snapshotData: step });
  });

  test("fails when an uninstall fails", async () => {
    const context = buildApplyContext({
      "./demo-success.js": {
        install: vi.fn(),
        uninstall: vi.fn().mockRejectedValue(new Error("boom")),
      },
    });

    await expect(applyCustomScript(removePlan(), context)).rejects.toThrow(
      "boom",
    );
  });

  test("throws when the plan has nothing to apply", async () => {
    const context = buildApplyContext({}, configWithCustomInstallationSteps);

    await expect(
      applyCustomScript({ ...addPlan(), operations: [] }, context),
    ).rejects.toThrow('"demoSuccess" has nothing to apply');
  });
});
