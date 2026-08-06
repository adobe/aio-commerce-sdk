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

// Deliberately not the engine's `ValidationIssue`: planning issues are always
// blocking (no severity gradation) and carry `domain` for cross-domain aggregation.
/** A planning problem that prevents a domain from producing an executable plan. */
export type UpgradeIssue = {
  /** The domain that raised the issue. */
  domain: string;

  /** Machine-readable code identifying the issue type. */
  code: string;

  /** Human-readable description of the issue. */
  message: string;
};

/**
 * A single change a domain proposes to apply during an upgrade, discriminated
 * by `kind`: `add` creates a resource, `update` mutates one, `remove` deletes one.
 */
export type UpgradeOperation<TValue> = {
  /** Stable identifier of the operation within its plan. */
  id: string;

  /** Human-readable label for display. */
  label: string;
} & (
  | { kind: "add"; after: TValue }
  | { kind: "update"; before: TValue; after: TValue }
  | { kind: "remove"; before: TValue }
);

/** A durable reminder that a resource may have been created and could need cleanup. */
export type CleanupResource<TIdentity = Record<string, unknown>> = {
  /** The domain that owns the resource. */
  domain: string;

  /** Domain-specific identity used to locate the resource for cleanup. */
  identity: TIdentity;
};

/** A domain's proposed set of operations for an upgrade, plus resources to reconcile. */
export type UpgradeDomainPlan<
  TValue = unknown,
  TCleanupIdentity = Record<string, unknown>,
> = {
  /** The domain this plan belongs to. */
  domain: string;

  /** The operations the domain proposes to apply. */
  operations: UpgradeOperation<TValue>[];

  /** Resources that may need cleanup as a result of applying the plan. */
  possibleCleanupResources: CleanupResource<TCleanupIdentity>[];
};

/** The execution context passed to a step's `upgrade` handler. */
export type UpgradeExecutionContext<
  TStepCtx extends Record<string, unknown> = Record<string, unknown>,
> = ExecutionContext<TStepCtx> & {
  /** Identifier of the upgrade attempt currently executing. */
  attemptId: string;
};

/** Inputs a domain needs to plan an upgrade: the prior baseline and the target. */
export type UpgradePlanningInput<TConfig, TSnapshotData, TCleanupIdentity> = {
  /** The last successful state (config and snapshot data), or `null` on first run. */
  baseline: { config: TConfig; data: TSnapshotData } | null;

  /** The target configuration to upgrade to, or `null` when none is available. */
  targetConfig: TConfig | null;

  /** Cleanup resources still pending resolution from prior attempts. */
  unresolvedCleanupResources: CleanupResource<TCleanupIdentity>[];
};

/** The outcome a domain reports after executing its upgrade. */
export type UpgradeExecutionResult<TSnapshotData, TCleanupIdentity> = {
  /** The snapshot data describing the resulting state, or `null` if none. */
  snapshotData: TSnapshotData | null;

  /** Cleanup resources resolved (reconciled) during this execution. */
  resolvedCleanupResources: CleanupResource<TCleanupIdentity>[];
};

/**
 * The outcome of a domain's planning pass, discriminated by `kind`: `planned`
 * carries the executable plan, `blocked` carries the issues preventing one.
 */
export type UpgradePlanningResult<
  TPlan extends UpgradeDomainPlan = UpgradeDomainPlan,
> =
  | { kind: "planned"; plan: TPlan }
  | { kind: "blocked"; issues: UpgradeIssue[] };

/** Infers the cleanup identity type carried by an {@link UpgradeDomainPlan}. */
export type CleanupIdentityOf<TPlan> =
  // biome-ignore lint/suspicious/noExplicitAny: Only the identity is inferred here, so the value type is irrelevant.
  TPlan extends UpgradeDomainPlan<any, infer TCleanupIdentity>
    ? TCleanupIdentity
    : never;

/**
 * The upgrade behavior a step contributes: planning proposes a domain plan (or
 * reports blocking issues) using a side-effect-free context, and execution
 * applies the plan under an attempt-scoped context.
 */
export type UpgradeCapability<
  TConfig extends CommerceAppConfigOutputModel,
  TStepCtx extends Record<string, unknown>,
  TPlan extends UpgradeDomainPlan,
  TSnapshotData,
> = {
  planUpgrade: (
    input: UpgradePlanningInput<
      TConfig,
      TSnapshotData,
      CleanupIdentityOf<TPlan>
    >,
    context: ValidationExecutionContext<TStepCtx>,
  ) => Promise<UpgradePlanningResult<TPlan>>;

  upgrade: (
    plan: TPlan,
    context: UpgradeExecutionContext<TStepCtx>,
  ) => Promise<UpgradeExecutionResult<TSnapshotData, CleanupIdentityOf<TPlan>>>;
};
