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
import type { ValidationIssue, ValidationIssueSeverity } from "./validation";

/** A problem found while planning or validating a plan. Blocking issues prevent the plan from running. */
export type PlanningIssue = {
  /** The domain that raised the issue. */
  domain: string;

  /** Machine-readable code identifying the issue type. */
  code: string;

  /** Human-readable description of the issue. */
  message: string;

  /** Whether the issue prevents the plan from running. Defaults to `true` when absent. */
  blocking?: boolean;

  /** Severity of the issue. Defaults to `error` when absent. */
  severity?: ValidationIssueSeverity;

  /** Full workflow path of the step that raised the issue. */
  path?: string[];

  /** Additional context about the issue. */
  details?: Record<string, unknown>;
};

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
   * Why the operation exists: `change` when the target config differs from the baseline,
   * `drift` when the target matches the baseline but deployed state does not.
   */
  reason: "change" | "drift";
} & (
  | { kind: "add"; after: TAfter }
  | { kind: "update"; before: TBefore; after: TAfter }
  | { kind: "remove"; before: TBefore }
);

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

/**
 * The outcome of a domain's planning pass, discriminated by `kind`: `planned`
 * carries the executable plan and any issues that do not block it, `blocked`
 * carries the issues preventing one.
 */
export type PlanningResult<TPlan extends DomainPlan = DomainPlan> =
  | { kind: "planned"; plan: TPlan; issues?: PlanningIssue[] }
  | { kind: "blocked"; issues: PlanningIssue[] };

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

  /**
   * Checks the operations of a plan the step produced, with the same input `plan` received.
   * May read external state. Its issues never block the plan.
   */
  validatePlan?: (
    plan: TPlan,
    input: PlanningInput<TConfig, TSnapshotData>,
    context: ValidationExecutionContext<TStepCtx>,
  ) => ValidationIssue[] | Promise<ValidationIssue[]>;

  apply: (
    plan: TPlan,
    context: ApplyContext<TStepCtx, TConfig, TSnapshotData>,
  ) => Promise<ApplyResult<TSnapshotData>>;
};

/** Whether an issue prevents the plan it belongs to from running. */
export function isBlockingIssue(issue: PlanningIssue): boolean {
  return issue.blocking !== false;
}
