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

import {
  createInitialPlanExecutionState,
  executePlannedWorkflow,
} from "#management/common/workflow/execute";
import { createMockInstallationContextWithScripts } from "#test/fixtures/installation";
import { createMockLifecyclePlan } from "#test/fixtures/lifecycle";
import {
  createMockLifecycleLeaf,
  createMockLifecycleRoot,
} from "#test/fixtures/workflow";

import type { WorkflowHooks } from "#management/common/workflow/hooks";
import type { LeafStep } from "#management/common/workflow/step";

type Apply = NonNullable<LeafStep["apply"]>;

const STAGES = [["a", "b", "c"], ["d"]];

/** Resolves after the given delay, so other branches can make progress meanwhile. */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executes a plan with one operation for each root child `a`, `b`, `c` and `d`, in the given
 * stages. By default `a`, `b` and `c` run concurrently and `d` after them.
 */
async function execute(
  applies: Partial<Record<string, Apply>>,
  hooks?: WorkflowHooks,
  rootStages: string[][] = STAGES,
) {
  const names = ["a", "b", "c", "d"];
  const rootStep = createMockLifecycleRoot(
    names.map((name) =>
      createMockLifecycleLeaf({
        apply: vi.fn(
          applies[name] ?? (async () => ({ snapshotData: { name } })),
        ),
        name,
      }),
    ),
  );

  const plan = createMockLifecyclePlan({
    domains: names.map((name) => ({
      operations: [
        {
          after: { id: name },
          id: `add-${name}`,
          itemRefs: [],
          kind: "add",
          label: `Add ${name}`,
          reason: "change",
        },
      ],
      path: ["root", name],
    })),
  });

  const lifecycleContext = createMockInstallationContextWithScripts();
  const { state } = await executePlannedWorkflow({
    attemptId: "attempt-1",
    baseline: null,
    hooks,
    initialState: createInitialPlanExecutionState({
      plan,
      rootStep,
      targetConfig: plan.target?.config,
    }),
    lifecycleContext,
    plan,
    rootStages,
    rootStep,
  });

  const statuses = Object.fromEntries(
    state.step.children.map((child) => [child.name, child.status]),
  );

  return { logger: lifecycleContext.logger, state, statuses };
}

describe("executePlannedWorkflow with concurrent root children", () => {
  test("runs the listed children at the same time and the next child after them", async () => {
    let running = 0;
    let maxRunning = 0;
    let finished = 0;
    const overlap: Apply = async () => {
      running += 1;
      maxRunning = Math.max(maxRunning, running);
      await delay(10);
      running -= 1;
      finished += 1;
      return { snapshotData: null };
    };

    let finishedBeforeD = 0;
    const { state } = await execute({
      a: overlap,
      b: overlap,
      c: overlap,
      d: async () => {
        finishedBeforeD = finished;
        return { snapshotData: null };
      },
    });

    expect(state.status).toBe("succeeded");
    expect(maxRunning).toBe(3);
    expect(finishedBeforeD).toBe(3);
  });

  test("reports the first failed branch in declared order, after every branch of its stage finishes", async () => {
    const { state, statuses } = await execute({
      a: async () => {
        await delay(10);
        throw new Error("a failed last");
      },
      b: () => Promise.reject(new Error("b failed first")),
    });

    expect.assert(state.status === "failed");
    expect(state.error).toMatchObject({
      message: "a failed last",
      path: ["root", "a"],
    });
    expect(statuses).toEqual({
      a: "failed",
      b: "failed",
      c: "succeeded",
      d: "pending",
    });
    expect(state.data).toEqual({ root: { c: { name: "c" } } });
  });

  test.each([
    ["misses a child", [["a", "b", "c"]]],
    [
      "lists a child twice",
      [
        ["a", "b", "c"],
        ["c", "d"],
      ],
    ],
    ["changes the declared order", [["d"], ["a", "b", "c"]]],
  ])(
    "fails without applying anything when the stages %s",
    async (_, stages) => {
      const apply = vi.fn(async () => ({ snapshotData: null }));
      const { state } = await execute(
        { a: apply, b: apply, c: apply, d: apply },
        undefined,
        stages,
      );

      expect.assert(state.status === "failed");
      expect(state.error.message).toContain("must list the children");
      expect(apply).not.toHaveBeenCalled();
    },
  );

  test("fails a step whose start cannot be recorded, without applying it", async () => {
    const applyB = vi.fn(async () => ({ snapshotData: { name: "b" } }));
    const { state, statuses } = await execute(
      { b: applyB },
      {
        onStepStart: (event) => {
          if (event.stepName === "b") {
            throw new Error("save failed");
          }
        },
      },
    );

    expect.assert(state.status === "failed");
    expect(state.error).toMatchObject({
      message: "save failed",
      path: ["root", "b"],
    });
    expect(applyB).not.toHaveBeenCalled();
    expect(statuses).toMatchObject({ a: "succeeded", b: "failed" });
  });

  test("reports the step's own error when recording its failure fails", async () => {
    const { logger, state } = await execute(
      { b: () => Promise.reject(new Error("apply failed")) },
      {
        onStepFailure: () => {
          throw new Error("save failed");
        },
      },
    );

    expect.assert(state.status === "failed");
    expect(state.error).toMatchObject({
      message: "apply failed",
      path: ["root", "b"],
    });
    expect(logger.warn).toHaveBeenCalledWith(
      "[b] Failed to record the failure of step root/b: save failed",
    );
  });

  test("labels the logs of the branches that run at the same time", async () => {
    const log: Apply = async (_plan, context) => {
      context.logger.info("applied %s", "item");
      context.logger.warn({ detail: true });
      return { snapshotData: null };
    };

    const { logger } = await execute({ a: log, d: log });

    expect(logger.info).toHaveBeenCalledWith("[a] applied %s", "item");
    expect(logger.warn).toHaveBeenCalledWith("[a]", { detail: true });
    expect(logger.info).toHaveBeenCalledWith("applied %s", "item");
    expect(logger.warn).toHaveBeenCalledWith({ detail: true });
  });
});
