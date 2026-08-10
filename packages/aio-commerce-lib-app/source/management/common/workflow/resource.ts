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
export type ResourceOperation<TValue> = {
  /** Stable identifier of the operation within its plan. */
  id: string;

  /** Human-readable label for display. */
  label: string;

  /** Whether the operation converges configuration or resolves cleanup. */
  category: "configuration" | "cleanup";
} & (
  | { kind: "add"; after: TValue }
  | { kind: "update"; before: TValue; after: TValue }
  | { kind: "remove"; before: TValue }
);

/** A durable reminder that a resource may have been created and could need cleanup. */
export type CleanupResource<TIdentity = Record<string, unknown>> = {
  /** Full workflow path of the step that owns the resource. */
  path: string[];

  /** Domain-specific identity used to locate the resource for cleanup. */
  identity: TIdentity;
};

/** A domain's proposed set of resource operations, plus resources to reconcile. */
export type DomainPlan<
  TValue = unknown,
  TCleanupIdentity = Record<string, unknown>,
> = {
  /** Full workflow path of the step this plan belongs to. */
  path: string[];

  /** The operations the domain proposes to apply. */
  operations: ResourceOperation<TValue>[];

  /** Resources that may need cleanup as a result of applying the plan. */
  possibleCleanupResources: CleanupResource<TCleanupIdentity>[];
};

/** The execution context passed to a step's `apply` handler. */
export type ApplyContext<
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
> = ExecutionContext<TStepCtx> & {
  /** Identifier of the lifecycle attempt currently executing. */
  attemptId: string;
};

/** Inputs a domain needs to plan its changes: the prior baseline and the target. */
export type PlanningInput<TConfig, TSnapshotData, TCleanupIdentity> = {
  /** Full workflow path of the step being planned. */
  path: string[];

  /** The last successful state for this domain, or `null` when the domain was absent. */
  baseline: { config: TConfig; data: TSnapshotData } | null;

  /** The target configuration to converge to, or `null` when none is available. */
  targetConfig: TConfig | null;

  /** Cleanup resources still pending resolution from prior attempts. */
  unresolvedCleanupResources: CleanupResource<TCleanupIdentity>[];
};

/** The outcome a domain reports after applying its plan. */
export type ApplyResult<TSnapshotData, TCleanupIdentity> = {
  /** The snapshot data describing the resulting state, or `null` if none. */
  snapshotData: TSnapshotData | null;

  /** Cleanup resources resolved (reconciled) during this execution. */
  resolvedCleanupResources: CleanupResource<TCleanupIdentity>[];
};

/**
 * The outcome of a domain's planning pass, discriminated by `kind`: `planned`
 * carries the executable plan, `blocked` carries the issues preventing one.
 */
export type PlanningResult<TPlan extends DomainPlan = DomainPlan> =
  | { kind: "planned"; plan: TPlan }
  | { kind: "blocked"; issues: PlanningIssue[] };

/** Infers the cleanup identity type carried by a {@link DomainPlan}. */
export type CleanupIdentityOf<TPlan> =
  // biome-ignore lint/suspicious/noExplicitAny: Only the identity is inferred here, so the value type is irrelevant.
  TPlan extends DomainPlan<any, infer TCleanupIdentity>
    ? TCleanupIdentity
    : never;

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
    input: PlanningInput<TConfig, TSnapshotData, CleanupIdentityOf<TPlan>>,
    context: ValidationExecutionContext<TStepCtx>,
  ) => Promise<PlanningResult<TPlan>>;

  apply: (
    plan: TPlan,
    context: ApplyContext<TStepCtx>,
  ) => Promise<ApplyResult<TSnapshotData, CleanupIdentityOf<TPlan>>>;
};
