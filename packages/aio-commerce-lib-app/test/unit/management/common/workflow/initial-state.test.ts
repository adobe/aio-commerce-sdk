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
import { createRootInstallationStep } from "#management/installation/root";
import { configWithEventingAndWebhooks } from "#test/fixtures/config";
import { createMockLifecyclePlan } from "#test/fixtures/lifecycle";

import type { ResourceChange } from "#management/common/workflow/resource";
import type { StepStatus } from "#management/common/workflow/types";

const WEBHOOKS = ["installation", "webhooks", "subscriptions"];
const COMMERCE = ["installation", "eventing", "commerce"];
const EXTERNAL = ["installation", "eventing", "external"];

const change: ResourceChange = {
  itemRef: { key: "k" },
  key: "k",
  kind: "add",
};

const operation = {
  after: {},
  id: "op",
  itemRefs: [],
  kind: "add",
  label: "Op",
  reason: "change",
} as const;

function build(
  domains: {
    path: string[];
    operations?: unknown[];
    changes?: ResourceChange[];
  }[],
) {
  const plan = createMockLifecyclePlan({
    domains: domains.map(({ path, operations, changes }) => ({
      changes,
      operations: (operations ?? []) as never,
      path,
    })),
    target: {
      appVersion: configWithEventingAndWebhooks.metadata.version,
      config: configWithEventingAndWebhooks,
    },
  });

  return createInitialPlanExecutionState({
    plan,
    rootStep: createRootInstallationStep(configWithEventingAndWebhooks),
    targetConfig: configWithEventingAndWebhooks,
  }).step;
}

/** The status of every node as `path: status`. */
function flatten(step: StepStatus): string[] {
  return [
    `${step.path.join("/")}: ${step.status}`,
    ...step.children.flatMap(flatten),
  ];
}

describe("createInitialPlanExecutionState with config changes", () => {
  test("adds a leaf with changes and no operations as succeeded, with its branches", () => {
    const root = build([{ changes: [change], path: WEBHOOKS }]);

    expect(flatten(root)).toEqual([
      "installation: pending",
      "installation/webhooks: succeeded",
      "installation/webhooks/subscriptions: succeeded",
    ]);
    const leaf = root.children[0]?.children[0];
    expect(leaf).not.toHaveProperty("startedAt");
    expect(leaf).not.toHaveProperty("completedAt");
  });

  test("keeps a leaf with operations pending, and its branch", () => {
    const root = build([
      { changes: [change], operations: [operation], path: WEBHOOKS },
    ]);

    expect(flatten(root)).toEqual([
      "installation: pending",
      "installation/webhooks: pending",
      "installation/webhooks/subscriptions: pending",
    ]);
  });

  test("leaves a branch pending when one child is pending and the other succeeded", () => {
    const root = build([
      { changes: [change], path: COMMERCE },
      { operations: [operation], path: EXTERNAL },
    ]);

    expect(flatten(root)).toEqual([
      "installation: pending",
      "installation/eventing: pending",
      "installation/eventing/commerce: succeeded",
      "installation/eventing/external: pending",
    ]);
  });

  test("marks a branch succeeded when every child is, and keeps the root step order", () => {
    const root = build([
      { changes: [change], path: WEBHOOKS },
      { changes: [change], path: EXTERNAL },
      { changes: [change], path: COMMERCE },
    ]);

    expect(root.children.map((child) => child.name)).toEqual([
      "eventing",
      "webhooks",
    ]);
    expect(flatten(root)).toEqual([
      "installation: pending",
      "installation/eventing: succeeded",
      "installation/eventing/commerce: succeeded",
      "installation/eventing/external: succeeded",
      "installation/webhooks: succeeded",
      "installation/webhooks/subscriptions: succeeded",
    ]);
  });

  test("never marks the root succeeded, so the executor still runs it", () => {
    expect(build([{ changes: [change], path: WEBHOOKS }]).status).toBe(
      "pending",
    );
  });

  test("leaves out a leaf with neither operations nor changes", () => {
    expect(flatten(build([{ changes: [], path: WEBHOOKS }]))).toEqual([
      "installation: pending",
    ]);
    expect(flatten(build([{ path: WEBHOOKS }]))).toEqual([
      "installation: pending",
    ]);
  });

  test("only adds nodes for steps of the root step", () => {
    const root = build([
      { changes: [change], path: ["installation", "unknown"] },
    ]);

    expect(root.children).toEqual([]);
  });
});
