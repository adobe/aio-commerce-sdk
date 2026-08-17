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

/** A planning problem that prevents a domain from producing an executable plan. */
export type PlanningIssue = {
  /** The domain that raised the issue. */
  domain: string;

  /** Machine-readable code identifying the issue type. */
  code: string;

  /** Human-readable description of the issue. */
  message: string;
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
> = ExecutionContext<TStepCtx> & {
  /** Identifier of the lifecycle attempt currently executing. */
  attemptId: string;
};

/** Inputs a domain needs to plan its changes: the prior baseline and the target. */
export type PlanningInput<TConfig, TSnapshotData> = {
  /** Full workflow path of the step being planned. */
  path: string[];

  /** The last successful state for this domain, or `null` when the domain was absent. */
  baseline: { config: TConfig; data: TSnapshotData } | null;

  /** The target configuration to converge to, or `null` when none is available. */
  targetConfig: TConfig | null;
};

/** The outcome a domain reports after applying its plan. */
export type ApplyResult<TSnapshotData> = {
  /** The snapshot data describing the resulting state, or `null` if none. */
  snapshotData: TSnapshotData | null;
};

/**
 * The outcome of a domain's planning pass, discriminated by `kind`: `planned`
 * carries the executable plan, `blocked` carries the issues preventing one.
 */
export type PlanningResult<TPlan extends DomainPlan = DomainPlan> =
  | { kind: "planned"; plan: TPlan }
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

  apply: (
    plan: TPlan,
    context: ApplyContext<TStepCtx>,
  ) => Promise<ApplyResult<TSnapshotData>>;
};
