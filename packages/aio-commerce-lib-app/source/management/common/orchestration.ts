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
import type {
  CleanupResource,
  DomainPlan,
  PlanningIssue,
} from "#management/common/workflow/resource";
import type {
  StepStatus,
  SucceededWorkflowState,
  WorkflowData,
  WorkflowError,
} from "#management/common/workflow/types";

/** The kind of lifecycle operation an orchestration run performs. */
export type LifecycleOperation = "install" | "upgrade" | "uninstall";

/** A persisted plan spanning every participating domain. */
export type LifecyclePlan = {
  /** Unique plan identifier. */
  id: string;

  /** Version of the action that produced the plan. */
  actionVersion: string;

  /** The state the plan transitions from. */
  source: {
    /** Identifier of the baseline snapshot. */
    snapshotId: string;

    /** App version of the baseline. */
    appVersion: string;
  };

  /** The state the plan transitions to. */
  target: {
    /** App version being transitioned to. */
    appVersion: string;

    /** Validated configuration used to produce and execute the plan. */
    config: CommerceAppConfigOutputModel;
  };

  /** Per-domain plans that compose the operation. */
  domains: DomainPlan[];

  /** Blocking issues reported while planning. */
  issues: PlanningIssue[];
};

/** The result recorded when a lifecycle attempt succeeds. */
export type SuccessfulResult = {
  /** Identifier of the snapshot captured after the operation. */
  snapshotId: string;

  /** App version the operation landed on. */
  appVersion: string;
};

/** Properties shared by every lifecycle attempt, regardless of status. */
type LifecycleAttemptBase = {
  /** Unique attempt identifier. */
  id: string;

  /** The lifecycle operation this attempt performs. */
  operation: LifecycleOperation;

  /** The plan this attempt is executing. */
  plan: LifecyclePlan;

  /** Step-tree progress of the attempt. */
  progress: StepStatus;

  /** ISO timestamp when the attempt started. */
  startedAt: string;

  /** ISO timestamp after which an active attempt no longer blocks orchestration. */
  executionDeadline: string;

  /** Snapshot data produced by completed leaves. */
  data: WorkflowData | null;

  /** Cleanup resources resolved by completed leaves. */
  resolvedCleanupResources: CleanupResource[];
};

/**
 * A persisted record of a single lifecycle attempt and its progress,
 * discriminated by `status`: a `succeeded` attempt carries its `result`, a
 * `failed` attempt carries its `failure`, and neither is present while the
 * attempt is pending or in progress.
 */
export type LifecycleAttempt = LifecycleAttemptBase &
  (
    | { status: "pending" | "in-progress" }
    | { status: "succeeded"; result: SuccessfulResult }
    | { status: "failed"; failure: WorkflowError<{ operationId?: string }> }
  );

/** A captured snapshot of app state: its configuration and collected workflow data. */
export type AppStateSnapshot = Required<
  Pick<SucceededWorkflowState, "id" | "config" | "data">
>;

/** The persisted orchestration state driving a lifecycle. */
export type OrchestrationState = {
  /** A plan awaiting execution, or `null` when none is pending. */
  pendingPlan: LifecyclePlan | null;

  /** The most recent attempt, or `null` when none has run. */
  latestAttempt: LifecycleAttempt | null;

  /** Identifier of the current baseline snapshot, or `null` when none exists. */
  baselineSnapshotId: string | null;

  /** Cleanup resources still awaiting reconciliation. */
  unresolvedCleanupResources: CleanupResource[];
};
