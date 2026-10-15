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

import { createInitialPlanExecutionState } from "#management/common/workflow/execute";
import { isBranchStep, isLeafStep } from "#management/common/workflow/step";
import { adminUiStep } from "#management/domains/admin-ui/branch";
import { eventingStep } from "#management/domains/events/branch";
import { webhooksStep } from "#management/domains/webhooks/branch";
import { createRootInstallationStep } from "#management/installation/root";
import {
  configWithCustomInstallationSteps,
  configWithWebhooks,
  minimalValidConfig,
} from "#test/fixtures/config";
import { createMockLifecyclePlan } from "#test/fixtures/lifecycle";

import type { AnyStep } from "#management/common/workflow/step";

describe("createRootInstallationStep", () => {
  test("should create installation step with default children", () => {
    const result = createRootInstallationStep(minimalValidConfig);

    expect(result.type).toBe("branch");
    expect(result.name).toBe("installation");

    expect(result.children.length).toBe(4);
    expect(result.children[0]).toBe(eventingStep);
    expect(result.children[1]).toBe(webhooksStep);
    expect(result.children[2]).toBe(adminUiStep);
    expect(result.children[3].name).toBe("customInstallationSteps");
  });

  test("should create custom installation step with dynamic children when config has custom steps", () => {
    const result = createRootInstallationStep(
      configWithCustomInstallationSteps,
    );

    expect(result.children.length).toBe(4);
    const [, , , customInstallationStep] = result.children;
    expect(customInstallationStep.name).toBe("customInstallationSteps");
    expect(customInstallationStep.type).toBe("branch");

    expect.assert(isBranchStep(customInstallationStep));
    expect(customInstallationStep.children.length).toBe(2);
    expect(customInstallationStep.children[0].name).toBe("demoSuccess");
    expect(customInstallationStep.children[0].meta.install.label).toBe(
      "Demo Success",
    );
    expect(customInstallationStep.children[0].type).toBe("leaf");
    expect(
      customInstallationStep.children.map((child) => child.name),
    ).not.toContain("reconciliation");
  });

  test("includes the reconciliation leaf when built for an upgrade", () => {
    const result = createRootInstallationStep(
      configWithCustomInstallationSteps,
      {
        forUpgrade: true,
      },
    );

    const [, , , customInstallationStep] = result.children;
    expect.assert(isBranchStep(customInstallationStep));
    expect(customInstallationStep.children.map((child) => child.name)).toEqual([
      "demoSuccess",
      "demoError",
      "reconciliation",
    ]);
  });

  test.each(["install", "uninstall", "upgrade"] as const)(
    "defines %s metadata on every step the lifecycle can plan",
    (operation) => {
      const rootStep = createRootInstallationStep(
        configWithCustomInstallationSteps,
        { forUpgrade: true },
      );

      const missing: string[] = [];
      const visit = (step: AnyStep, path: string[]) => {
        // Leaves without a planner never get planned operations, so they never run.
        const isPlannable =
          isBranchStep(step) || (isLeafStep(step) && step.plan !== undefined);
        if (isPlannable && !step.meta[operation]) {
          missing.push([...path, step.name].join("/"));
        }

        if (isBranchStep(step)) {
          for (const child of step.children) {
            visit(child, [...path, step.name]);
          }
        }
      };

      visit(rootStep, []);
      expect(missing).toEqual([]);
    },
  );

  test("creates upgrade progress for a planned webhook operation", () => {
    const rootStep = createRootInstallationStep(configWithWebhooks);
    const plan = createMockLifecyclePlan({
      domains: [
        {
          operations: [
            {
              after: {},
              id: "webhook-add",
              kind: "add",
              label: "Add webhook",
              reason: "change",
            },
          ],
          path: ["installation", "webhooks", "subscriptions"],
        },
      ],
      target: {
        appVersion: configWithWebhooks.metadata.version,
        config: configWithWebhooks,
      },
    });

    const state = createInitialPlanExecutionState({
      plan,
      rootStep,
      targetConfig: configWithWebhooks,
    });

    const [webhooksStatus] = state.step.children;
    expect.assert(webhooksStatus, "Expected webhook upgrade progress");
    expect(webhooksStatus.meta).toEqual(webhooksStep.meta.upgrade);
    expect(webhooksStatus.children.at(0)?.meta).toEqual(
      webhooksStep.children.at(0)?.meta.upgrade,
    );
  });
});
