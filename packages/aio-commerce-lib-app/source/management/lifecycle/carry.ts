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

import { isBranchStep } from "#management/common/workflow/step";
import { pathsEqual } from "#management/common/workflow/utils";

import type {
  CarriedDomainOperations,
  CarriedOperation,
  LifecycleAttempt,
  LifecycleOperation,
} from "#management/common/orchestration";
import type { ResourceOperation } from "#management/common/workflow/resource";
import type { AnyStep, BranchStep } from "#management/common/workflow/step";
import type { StepStatus } from "#management/common/workflow/types";

/** Inputs to carry the completed steps of a failed attempt into a new attempt. */
export type CarryCompletedStepsOptions = {
  operation: LifecycleOperation;

  /** The latest attempt before the new one, or `null` when there is none. */
  previousAttempt: LifecycleAttempt | null;

  /** The step tree of the new attempt, built from its plan. */
  progress: StepStatus;

  /** The step definition the new attempt executes. */
  rootStep: BranchStep;
};

/** The step tree and the operations of a new attempt after carrying completed steps. */
export type CarriedSteps = {
  progress: StepStatus;

  /** The operations of the carried steps. Absent when no step was carried. */
  operations?: CarriedDomainOperations[];
};

/** The preview shape of a resource operation, without its before and after values. */
export function toCarriedOperation({
  id,
  kind,
  label,
  reason,
  itemRefs,
}: ResourceOperation<unknown>): CarriedOperation {
  return { id, itemRefs, kind, label, reason };
}

/**
 * Adds to the step tree of a new attempt the leaves that a failed attempt of the same operation
 * completed and that the new tree does not have, so the new attempt shows them as succeeded. A
 * leaf in the new tree is never carried, and only steps in `rootStep` are.
 *
 * Carried leaves are `succeeded`, so the executor skips them. Branches added for them are
 * `pending`, so the executor visits them and runs their other children.
 */
export function carryCompletedSteps(
  options: CarryCompletedStepsOptions,
): CarriedSteps {
  const { operation, previousAttempt, progress, rootStep } = options;
  if (
    previousAttempt?.status !== "failed" ||
    previousAttempt.operation !== operation
  ) {
    return { progress };
  }

  const carriedLeaves: StepStatus[] = [];
  const merged = mergeChildren(
    rootStep,
    progress,
    previousAttempt.progress,
    carriedLeaves,
  );

  if (carriedLeaves.length === 0) {
    return { progress };
  }

  const operations: CarriedDomainOperations[] = [];
  for (const leaf of carriedLeaves) {
    const leafOperations = getLeafOperations(previousAttempt, leaf.path);
    if (leafOperations.length > 0) {
      operations.push({ operations: leafOperations, path: leaf.path });
    }
  }

  return {
    operations: operations.length > 0 ? operations : undefined,
    progress: merged,
  };
}

/**
 * The step node with the children of its definition, in definition order. Children of the new
 * tree win. A previous child is added only when the new tree lacks it.
 */
function mergeChildren(
  step: BranchStep,
  current: StepStatus,
  previous: StepStatus | undefined,
  carriedLeaves: StepStatus[],
): StepStatus {
  const children: StepStatus[] = [];

  for (const definition of step.children) {
    const currentChild = current.children.find(
      (child) => child.name === definition.name,
    );

    const previousChild = previous?.children.find(
      (child) => child.name === definition.name,
    );

    if (currentChild) {
      children.push(
        isBranchStep(definition)
          ? mergeChildren(
              definition,
              currentChild,
              previousChild,
              carriedLeaves,
            )
          : currentChild,
      );
    } else if (previousChild) {
      const carried = carryNode(definition, previousChild, carriedLeaves);
      if (carried) {
        children.push(carried);
      }
    }
  }

  return { ...current, children };
}

/** Copies a succeeded leaf, or a pending branch holding copies of its succeeded leaves. */
function carryNode(
  definition: AnyStep,
  previous: StepStatus,
  carriedLeaves: StepStatus[],
): StepStatus | null {
  if (!isBranchStep(definition)) {
    if (previous.status !== "succeeded") {
      return null;
    }

    const leaf = structuredClone(previous);
    carriedLeaves.push(leaf);
    return leaf;
  }

  const children: StepStatus[] = [];
  for (const childDefinition of definition.children) {
    const previousChild = previous.children.find(
      (child) => child.name === childDefinition.name,
    );

    const carried = previousChild
      ? carryNode(childDefinition, previousChild, carriedLeaves)
      : null;

    if (carried) {
      children.push(carried);
    }
  }

  if (children.length === 0) {
    return null;
  }

  return {
    children,
    id: previous.id,
    meta: structuredClone(previous.meta),
    name: previous.name,
    path: previous.path,
    status: "pending",
  };
}

/** The operations a leaf completed in the previous attempt, carried or planned. */
function getLeafOperations(
  previousAttempt: LifecycleAttempt,
  path: string[],
): CarriedOperation[] {
  const carried = previousAttempt.carriedOperations?.find((entry) =>
    pathsEqual(entry.path, path),
  );

  if (carried) {
    return carried.operations;
  }

  const planned = previousAttempt.plan.domains.find((domain) =>
    pathsEqual(domain.path, path),
  );

  return planned?.operations.map(toCarriedOperation) ?? [];
}
