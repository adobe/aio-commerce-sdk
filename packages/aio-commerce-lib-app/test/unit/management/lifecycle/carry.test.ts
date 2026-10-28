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

import { carryCompletedSteps } from "#management/lifecycle/carry";
import {
  createMockLifecycleAttempt,
  createMockLifecyclePlan,
} from "#test/fixtures/lifecycle";
import {
  createMockBranchStep,
  createMockLifecycleLeaf,
  createMockLifecycleRoot,
  createMockStepStatus,
} from "#test/fixtures/workflow";

import type { CarriedDomainOperations } from "#management/common/orchestration";
import type { ExecutionStatus } from "#management/common/workflow/types";

const operation = (id: string) => ({
  after: { secret: "x" },
  id,
  itemRefs: [],
  kind: "add" as const,
  label: id,
  reason: "change" as const,
});

const preview = (id: string) => ({
  id,
  itemRefs: [],
  kind: "add",
  label: id,
  reason: "change",
});

const leafDef = (name: string) => createMockLifecycleLeaf({ name });
const rootStep = createMockLifecycleRoot([
  leafDef("a"),
  createMockBranchStep({
    children: [leafDef("x"), leafDef("y")],
    meta: {
      install: { label: "Group" },
      uninstall: { label: "Group" },
      upgrade: { label: "Group" },
    },
    name: "group",
  }),
  leafDef("z"),
]);

function leaf(path: string[], status: ExecutionStatus = "pending") {
  const name = path.at(-1) as string;
  return createMockStepStatus({
    id: `id-${path.join("/")}`,
    name,
    path,
    startedAt: "2026-01-01T00:00:00.000Z",
    status,
  });
}

function tree(...children: ReturnType<typeof createMockStepStatus>[]) {
  return createMockStepStatus({ children, name: "root", path: ["root"] });
}

function group(...children: ReturnType<typeof createMockStepStatus>[]) {
  return createMockStepStatus({
    children,
    id: "id-group",
    name: "group",
    path: ["root", "group"],
  });
}

function failedAttempt(
  progress: ReturnType<typeof tree>,
  extra: {
    operations?: string[][];
    carried?: CarriedDomainOperations[];
    operation?: "install" | "upgrade" | "uninstall";
    status?: "failed" | "in-progress" | "succeeded";
  } = {},
) {
  return createMockLifecycleAttempt({
    carriedOperations: extra.carried,
    operation: extra.operation ?? "upgrade",
    plan: createMockLifecyclePlan({
      domains: (extra.operations ?? []).map((path) => ({
        operations: [operation(`op-${path.join("/")}`)],
        path,
      })),
    }),
    progress,
    status: extra.status ?? "failed",
  });
}

function run(
  previousAttempt: ReturnType<typeof failedAttempt> | null,
  progress: ReturnType<typeof tree>,
  op: "install" | "upgrade" | "uninstall" = "upgrade",
) {
  return carryCompletedSteps({
    operation: op,
    previousAttempt,
    progress,
    rootStep,
  });
}

const names = (step: ReturnType<typeof tree>) =>
  step.children.map((child) => child.name);

describe("carryCompletedSteps", () => {
  test("carries an absent succeeded leaf, copied from the previous node", () => {
    const previousLeaf = leaf(["root", "a"], "succeeded");
    previousLeaf.completedAt = "2026-01-01T00:00:01.000Z";
    const previous = failedAttempt(tree(previousLeaf), {
      operations: [["root", "a"]],
    });

    const result = run(previous, tree(leaf(["root", "z"])));

    expect(result.progress.children).toEqual([
      previousLeaf,
      leaf(["root", "z"]),
    ]);
    expect(result.operations).toEqual([
      { operations: [preview("op-root/a")], path: ["root", "a"] },
    ]);
  });

  test("adds the absent branch of a carried leaf as pending", () => {
    const previousGroup = group(leaf(["root", "group", "x"], "succeeded"));
    previousGroup.status = "failed";
    previousGroup.startedAt = "2026-01-01T00:00:00.000Z";
    const previous = failedAttempt(tree(previousGroup), {
      operations: [["root", "group", "x"]],
    });

    const result = run(previous, tree(leaf(["root", "z"])));
    const [carried] = result.progress.children;

    expect(names(result.progress)).toEqual(["group", "z"]);
    expect(carried).toMatchObject({
      id: "id-group",
      path: ["root", "group"],
      status: "pending",
    });
    expect(carried?.startedAt).toBeUndefined();
    expect(carried?.children[0]).toMatchObject({
      name: "x",
      status: "succeeded",
    });
  });

  test("carries a leaf into a branch the new tree has, keeping definition order", () => {
    const previous = failedAttempt(
      tree(group(leaf(["root", "group", "x"], "succeeded"))),
    );
    const fresh = tree(
      group(leaf(["root", "group", "y"])),
      leaf(["root", "z"]),
    );

    const result = run(previous, fresh);

    expect(names(result.progress)).toEqual(["group", "z"]);
    expect(names(result.progress.children[0] as typeof fresh)).toEqual([
      "x",
      "y",
    ]);
    expect(result.progress.children[0]?.id).toBe("id-group");
  });

  test("never carries a leaf the new tree has, even when it is pending", () => {
    const previous = failedAttempt(tree(leaf(["root", "a"], "succeeded")), {
      operations: [["root", "a"]],
    });
    const fresh = tree(leaf(["root", "a"]));

    const result = run(previous, fresh);

    expect(result.progress).toBe(fresh);
    expect(result.operations).toBeUndefined();
  });

  test.each([
    ["a succeeded attempt", { status: "succeeded" as const }],
    ["an in-progress attempt", { status: "in-progress" as const }],
    ["another operation", { operation: "install" as const }],
  ])("does not carry from %s", (_name, extra) => {
    const previous = failedAttempt(
      tree(leaf(["root", "a"], "succeeded")),
      extra,
    );
    const fresh = tree(leaf(["root", "z"]));

    expect(run(previous, fresh).progress).toBe(fresh);
  });

  test("does not carry without a previous attempt", () => {
    const fresh = tree(leaf(["root", "z"]));
    expect(run(null, fresh).progress).toBe(fresh);
  });

  test.each(["failed", "in-progress", "pending"] as const)(
    "does not carry a %s leaf",
    (status) => {
      const previous = failedAttempt(tree(leaf(["root", "a"], status)));
      const fresh = tree(leaf(["root", "z"]));

      expect(run(previous, fresh).progress).toBe(fresh);
    },
  );

  test("skips a leaf missing in the root step definition", () => {
    const previous = failedAttempt(
      tree(
        leaf(["root", "gone"], "succeeded"),
        group(leaf(["root", "group", "gone"], "succeeded")),
      ),
    );
    const fresh = tree(leaf(["root", "z"]));

    expect(run(previous, fresh).progress).toBe(fresh);
  });

  test("carries again over a chain, with the operations the previous attempt carried", () => {
    const carried = [
      { operations: [preview("kept")], path: ["root", "a"] },
    ] as CarriedDomainOperations[];

    const previous = failedAttempt(
      tree(leaf(["root", "a"], "succeeded"), leaf(["root", "z"], "failed")),
      { carried, operations: [["root", "z"]] },
    );

    const result = run(previous, tree(leaf(["root", "z"])));

    expect(names(result.progress)).toEqual(["a", "z"]);
    expect(result.operations).toEqual(carried);
  });

  test("omits the operations of a carried leaf that had none", () => {
    const previous = failedAttempt(tree(leaf(["root", "a"], "succeeded")));
    const result = run(previous, tree(leaf(["root", "z"])));

    expect(names(result.progress)).toEqual(["a", "z"]);
    expect(result.operations).toBeUndefined();
  });
});
