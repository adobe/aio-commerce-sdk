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

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { ExecutionContext, ValidationExecutionContext } from "./step";
import type { ValidationIssueSeverity } from "./validation";

/** A problem found while planning. Blocking issues prevent the plan from running. */
export type PlanningIssue = {
  /** The domain that raised the issue. */
  domain: string;

  /** Machine-readable code identifying the issue type. */
  code: string;

  /** Human-readable description of the issue. */
  message: string;

  /** Whether the issue prevents the plan from running. */
  blocking: boolean;

  /** Severity of the issue. Defaults to `error` when absent. */
  severity?: ValidationIssueSeverity;

  /** Full workflow path of the step that raised the issue. */
  path?: string[];

  /** Additional context about the issue. */
  details?: Record<string, unknown>;
};

/**
 * A reference to a user-visible item an operation changes. Operations with the same `kind` and
 * `key` within a domain plan are parts of one change to one item, for example the metadata and the
 * subscription of one event. `label` and `description` are the item's own text, when it has any.
 */
export type ItemRef = {
  /** What the item is, for example `webhook` or `event`. */
  kind: string;

  /** Identifies the item within its domain plan and `kind`. */
  key: string;

  /** The label of the item's config. Absent when there is none. */
  label?: string;

  /** The description of the item's config. Absent when there is none. */
  description?: string;
};

/**
 * Builds an item reference, with the label and description of `source` when it has them.
 * @param kind - What the item is.
 * @param key - Identifies the item within its domain plan and `kind`.
 * @param source - The config item, or live resource, the text comes from.
 */
export function toItemRef(
  kind: string,
  key: string,
  source?: { label?: string; description?: string },
): ItemRef {
  return {
    key,
    kind,
    ...(source?.label && { label: source.label }),
    ...(source?.description && { description: source.description }),
  };
}

/**
 * A single change a domain proposes to apply to a resource, discriminated by
 * `kind`: `add` creates a resource, `update` mutates one, `remove` deletes one.
 */
export type ResourceOperation<TBefore, TAfter = TBefore> = {
  /** Stable identifier of the operation within its plan. */
  id: string;

  /** Human-readable label for display. */
  label: string;

  /**
   * The user-visible items the operation changes, usually one. Absent when the operation is internal
   * to its domain. The text comes from the target config item, else the baseline one, else the live
   * resource.
   */
  itemRefs?: ItemRef[];

  /**
   * Why the operation exists: `change` when the target config differs from the baseline,
   * `drift` when the target matches the baseline but deployed state does not.
   */
  reason: "change" | "drift";
} & (
  | { kind: "add"; after: TAfter }
  | { kind: "update"; before: TBefore; after: TAfter }
  | { kind: "remove"; before: TBefore }
);

/**
 * One user-visible item of a plan, built from the operations that reference it: it carries their
 * combined change and the item's label and description.
 */
export type PlanItem = ItemRef & {
  /** `add` when every operation adds, `remove` when every operation removes, otherwise `update`. */
  change: ResourceOperation<unknown>["kind"];

  /** `change` when any operation is a `change`, otherwise `drift`. */
  reason: ResourceOperation<unknown>["reason"];

  /** The ids of the operations that make up the item, in plan order. */
  operationIds: string[];
};

/**
 * Groups the operations of a domain plan into its user-visible items, by `kind` and `key`.
 * Operations without `itemRefs` are internal and left out. Items follow the order of their first
 * operation. Each of `label` and `description` comes from the first reference that has it.
 * @param operations - The operations of one domain plan.
 */
export function groupOperationsIntoItems(
  operations: readonly ResourceOperation<unknown>[],
): PlanItem[] {
  const groups = new Map<
    string,
    { refs: ItemRef[]; operations: ResourceOperation<unknown>[] }
  >();

  for (const operation of operations) {
    for (const ref of operation.itemRefs ?? []) {
      const groupKey = JSON.stringify([ref.kind, ref.key]);
      const group = groups.get(groupKey) ?? { operations: [], refs: [] };
      group.refs.push(ref);
      group.operations.push(operation);
      groups.set(groupKey, group);
    }
  }

  return [...groups.values()].map(({ refs, operations: grouped }) => {
    const [{ kind, key }] = refs;
    const [first] = grouped;
    const label = refs.find((ref) => ref.label)?.label;
    const description = refs.find((ref) => ref.description)?.description;

    return {
      change: grouped.every((operation) => operation.kind === first.kind)
        ? first.kind
        : "update",
      key,
      kind,
      operationIds: grouped.map((operation) => operation.id),
      reason: grouped.some((operation) => operation.reason === "change")
        ? "change"
        : "drift",
      ...(label && { label }),
      ...(description && { description }),
    };
  });
}

/** A domain's proposed set of resource operations. */
export type DomainPlan<TBefore = unknown, TAfter = TBefore> = {
  /** Full workflow path of the step this plan belongs to. */
  path: string[];

  /** The operations the domain proposes to apply. */
  operations: ResourceOperation<TBefore, TAfter>[];
};

/** The execution context passed to a step's `apply` handler. */
export type ApplyContext<
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
  TConfig extends CommerceAppConfigOutputModel = CommerceAppConfigOutputModel,
  TSnapshotData = unknown,
> = ExecutionContext<TStepCtx> & {
  /** Identifier of the lifecycle attempt currently executing. */
  attemptId: string;

  /**
   * The last successful state for this domain, or `null` when the domain was
   * absent from the baseline. Mirrors {@link PlanningInput.baseline} so `apply`
   * can converge deployed state without re-deriving it onto the plan.
   */
  baseline: { config: TConfig; data: TSnapshotData } | null;

  /** The target configuration to converge to, or `null` when none is available. */
  targetConfig: TConfig | null;
};

/** Inputs a domain needs to plan its changes: the prior baseline and the target. */
export type PlanningInput<TConfig, TSnapshotData> = {
  /** Full workflow path of the step being planned. */
  path: string[];

  /** The last successful state for this domain, or `null` when the domain was absent. */
  baseline: { config: TConfig; data: TSnapshotData } | null;

  /** The target configuration to converge to, or `null` when none is available. */
  targetConfig: TConfig | null;

  /**
   * The latest attempt, when it failed after the baseline was saved: its target configuration
   * (`null` when the domain was absent from it) and this domain's plan in it. Absent otherwise.
   */
  failedAttempt?: { targetConfig: TConfig | null; plan: DomainPlan | null };
};

/** The outcome a domain reports after applying its plan. */
export type ApplyResult<TSnapshotData> = {
  /** The snapshot data describing the resulting state, or `null` if none. */
  snapshotData: TSnapshotData | null;
};

/** An issue that prevents the plan from running. */
export type BlockingPlanningIssue = PlanningIssue & { blocking: true };

/** An issue reported with a plan that still runs. */
export type NonBlockingPlanningIssue = PlanningIssue & { blocking: false };

/**
 * The outcome of a domain's planning pass, discriminated by `kind`: `planned`
 * carries the executable plan and any issues that do not block it, `blocked`
 * carries the issues preventing one.
 */
export type PlanningResult<TPlan extends DomainPlan = DomainPlan> =
  | { kind: "planned"; plan: TPlan; issues?: NonBlockingPlanningIssue[] }
  | { kind: "blocked"; issues: BlockingPlanningIssue[] };

/**
 * The resource-reconciliation behavior a step contributes: planning proposes a
 * domain plan (or reports blocking issues) using a side-effect-free context, and
 * applying executes the plan under an attempt-scoped context.
 */
export type ResourceCapability<
  TConfig extends CommerceAppConfigOutputModel,
  TStepCtx extends Record<string, unknown>,
  TPlan extends DomainPlan,
  TSnapshotData,
> = {
  plan: (
    input: PlanningInput<TConfig, TSnapshotData>,
    context: ValidationExecutionContext<TStepCtx>,
  ) => Promise<PlanningResult<TPlan>>;

  apply: (
    plan: TPlan,
    context: ApplyContext<TStepCtx, TConfig, TSnapshotData>,
  ) => Promise<ApplyResult<TSnapshotData>>;
};
