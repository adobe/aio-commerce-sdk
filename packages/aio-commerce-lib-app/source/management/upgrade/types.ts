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

import type { LifecycleRequestContext } from "#management/common/schema";
import type {
  ExecutionStatus,
  StepStatus,
  SucceededWorkflowState,
  WorkflowError,
} from "#management/common/workflow/types";
import type {
  CleanupResource,
  UpgradeDomainPlan,
} from "#management/common/workflow/upgrade";

/** A resolved, executable upgrade plan spanning every participating domain. */
export type UpgradePlan = {
  /** Unique plan identifier. */
  id: string;

  /** Version of the action that produced the plan. */
  actionVersion: string;

  /** The state the plan upgrades from. */
  source: {
    /** Identifier of the baseline snapshot. */
    snapshotId: string;

    /** App version of the baseline. */
    appVersion: string;
  };

  /** The state the plan upgrades to. */
  target: {
    /** App version being upgraded to. */
    appVersion: string;
  };

  /** Per-domain plans that compose the upgrade. */
  domains: UpgradeDomainPlan[];
};

/** The result recorded when an upgrade attempt succeeds. */
export type SuccessfulUpgradeResult = {
  /** Identifier of the snapshot captured after the upgrade. */
  snapshotId: string;

  /** App version the upgrade landed on. */
  appVersion: string;
};

/** A persisted record of a single upgrade attempt and its progress. */
export type StoredUpgradeAttempt = {
  /** Unique attempt identifier. */
  id: string;

  /** The plan this attempt is executing. */
  plan: UpgradePlan;

  /** Current status of the attempt. */
  status: ExecutionStatus;

  /** Step-tree progress of the attempt. */
  progress: StepStatus;

  /** The step-execution error, present when the attempt failed. */
  failure?: WorkflowError<{ operationId?: string }>;

  /** Success details, present when the attempt succeeded. */
  result?: SuccessfulUpgradeResult;
};

/** A captured snapshot of app state: its configuration and collected workflow data. */
export type StateSnapshot = Required<
  Pick<SucceededWorkflowState, "id" | "config" | "data">
>;

/** The persisted orchestration state driving the upgrade lifecycle. */
export type UpgradeOrchestrationState = {
  /** A plan awaiting execution, or `null` when none is pending. */
  pendingPlan: UpgradePlan | null;

  /** The most recent attempt, or `null` when none has run. */
  latestAttempt: StoredUpgradeAttempt | null;

  /** Identifier of the current baseline snapshot, or `null` when none exists. */
  baselineSnapshotId: string | null;

  /** Cleanup resources still awaiting reconciliation. */
  unresolvedCleanupResources: CleanupResource[];
};

/**
 * The request context available to upgrade orchestration runtime actions — the
 * shared lifecycle request shape reused across install, uninstall, and upgrade.
 */
export type UpgradeRequestContext = LifecycleRequestContext;
