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

import {
  accepted,
  badRequest,
  conflict,
  internalServerError,
  ok,
} from "@adobe/aio-commerce-lib-core/responses";
import openwhisk from "openwhisk";

import { validateCommerceAppConfig } from "#config/lib/validate";
import { nowIsoString } from "#management/common/workflow/utils";
import {
  createInstallationStore,
  getStorageKey,
} from "#management/deprecated/stores";
import {
  DispatchedLifecycleAttemptNotFoundError,
  LifecycleAttemptInProgressError,
  PendingLifecyclePlanNotFoundError,
} from "#management/lifecycle/errors";
import { executeLifecycleAttempt } from "#management/lifecycle/execution";
import { planLifecycle } from "#management/lifecycle/planning";
import { startLifecycleAttempt } from "#management/lifecycle/start";
import { CURRENT_STATE_KEY } from "#management/lifecycle/state";

import { createLifecycleRuntime, DEFAULT_ACTION_NAME } from "./common";

import type { ActionResponse } from "@adobe/aio-commerce-lib-core/responses";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  LifecycleAttempt,
  LifecycleOperation,
  OrchestrationState,
} from "#management/common/orchestration";
import type { PlanLifecycleResult } from "#management/lifecycle/planning";
import type { LifecycleStore } from "#management/lifecycle/state";
import type {
  ExecutionHandlerArgs,
  LifecycleExecutionRouteParams,
  RequestHandlerArgs,
  WorkflowRouteParams,
} from "./common";

/** How each lifecycle operation is named in responses. */
export const OPERATION_LABEL: Record<LifecycleOperation, string> = {
  install: "Installation",
  uninstall: "Uninstallation",
  upgrade: "Upgrade",
};

/** The dependencies a lifecycle request plans and starts with. */
export type LifecycleRuntime = Awaited<
  ReturnType<typeof createLifecycleRuntime>
>;

/** Inputs for {@link planOperation}. */
type PlanOperationArgs = {
  operation: LifecycleOperation;
  runtime: LifecycleRuntime;
  actionVersion: string;

  /** The config to converge to, or `null` when nothing should remain installed. */
  targetConfig: CommerceAppConfigOutputModel | null;

  /** The config to plan from when no baseline is stored. */
  fallbackBaselineConfig?: CommerceAppConfigOutputModel;
  reviewedPlanId?: string;
};

/** The planning result, or the response that ends the request. */
type PlanOperationResult =
  | {
      kind: "planned";
      planning: Extract<PlanLifecycleResult, { kind: "planned" }>;
    }
  | { kind: "rejected"; response: ActionResponse };

/**
 * Plans a lifecycle operation. Rejects with 409 when another attempt is in progress, when the
 * reviewed plan is no longer the pending one, or when planning is blocked.
 */
export async function planOperation({
  operation,
  runtime,
  actionVersion,
  targetConfig,
  fallbackBaselineConfig,
  reviewedPlanId,
}: PlanOperationArgs): Promise<PlanOperationResult> {
  const label = OPERATION_LABEL[operation];

  let planning: PlanLifecycleResult;
  try {
    planning = await planLifecycle({
      ...runtime,
      actionVersion,
      fallbackBaselineConfig,
      operation,
      reviewedPlanId,
      targetConfig,
    });
  } catch (error) {
    if (error instanceof LifecycleAttemptInProgressError) {
      const state = await runtime.stateStore.get(CURRENT_STATE_KEY);
      return {
        kind: "rejected",
        response: attemptInProgressConflict(state?.latestAttempt),
      };
    }

    if (error instanceof PendingLifecyclePlanNotFoundError) {
      return {
        kind: "rejected",
        response: stalePlanConflict(
          `The reviewed plan is no longer the pending plan. Plan the ${label.toLowerCase()} again and review the new plan.`,
        ),
      };
    }

    throw error;
  }

  if (planning.kind === "blocked") {
    return {
      kind: "rejected",
      response: conflict({
        body: {
          issues: planning.plan.issues,
          message: `${label} planning is blocked`,
        },
      }),
    };
  }

  return { kind: "planned", planning };
}

/** Inputs for {@link startPlannedOperation}. */
type StartPlannedOperationArgs = {
  runtime: LifecycleRuntime;
  params: WorkflowRouteParams;
  planning: Extract<PlanLifecycleResult, { kind: "planned" }>;
  actionVersion: string;
  logger: RequestHandlerArgs["logger"];
};

/** Starts an attempt for a planned operation and invokes its execution asynchronously. */
export async function startPlannedOperation({
  runtime,
  params,
  planning,
  actionVersion,
  logger,
}: StartPlannedOperationArgs): Promise<ActionResponse> {
  const { operation } = planning.plan;
  const label = OPERATION_LABEL[operation];

  let attempt: LifecycleAttempt;
  try {
    attempt = await startLifecycleAttempt({
      ...runtime,
      actionVersion,
      executionDeadline: getExecutionDeadline(),
      planId: planning.plan.id,
      review: planning.review,
    });
  } catch (error) {
    if (error instanceof LifecycleAttemptInProgressError) {
      const state = await runtime.stateStore.get(CURRENT_STATE_KEY);
      return attemptInProgressConflict(state?.latestAttempt);
    }

    // This request planned it a moment ago, so only a simultaneous request can have replaced it.
    if (error instanceof PendingLifecyclePlanNotFoundError) {
      return stalePlanConflict(
        `Another request replaced this plan. Plan the ${label.toLowerCase()} again.`,
      );
    }

    throw error;
  }

  const activationId = await dispatchExecution(
    runtime.stateStore,
    attempt,
    params,
  );
  logger.debug(
    `Async ${operation} execution started for attempt ${attempt.id}: ${activationId}`,
  );

  return accepted({
    body: {
      ...toAttemptStatus(attempt),
      activationId,
      message: `${label} started`,
    },
  });
}

/** The deadline of the current activation as an ISO timestamp. */
function getExecutionDeadline() {
  return new Date(Number(process.env.__OW_DEADLINE)).toISOString();
}

/** Executes a started lifecycle attempt. */
export async function executeLifecycle({
  logger,
  params,
}: ExecutionHandlerArgs<LifecycleExecutionRouteParams>) {
  const { attemptId, appConfig: rawAppConfig } = params;

  if (!attemptId) {
    return badRequest("attemptId is required for execution");
  }

  if (!rawAppConfig) {
    return badRequest("appConfig is required for execution");
  }

  const actionVersion = process.env.__OW_ACTION_VERSION;
  if (!actionVersion) {
    return internalServerError(
      "The OpenWhisk action version is required to execute a lifecycle attempt",
    );
  }

  const appConfig = validateCommerceAppConfig(rawAppConfig);
  const runtime = await createLifecycleRuntime(params, appConfig, logger);
  const result = await executeLifecycleAttempt({
    actionVersion,
    attemptId,
    executionDeadline: getExecutionDeadline(),
    lifecycleContext: runtime.lifecycleContext,
    rootStep: runtime.rootStep,
    snapshotStore: runtime.snapshotStore,
    stateStore: runtime.stateStore,
  });

  const label = OPERATION_LABEL[result.operation];
  logger.debug(`${label} completed: ${result.status}`);

  // An older library version's record would otherwise refuse a later install as already installed.
  if (result.operation === "uninstall" && result.status === "succeeded") {
    await (await createInstallationStore()).delete(getStorageKey());
  }

  if (result.status === "failed") {
    return internalServerError({
      body: { attempt: toAttemptStatus(result), message: `${label} failed` },
    });
  }

  return ok({ body: toAttemptStatus(result) });
}

/** The status of a lifecycle attempt as clients read it. */
export function toAttemptStatus(attempt: LifecycleAttempt) {
  return {
    completedAt: attempt.completedAt,
    data: attempt.data,
    error: attempt.status === "failed" ? attempt.failure : undefined,
    id: attempt.id,
    operation: attempt.operation,
    review: attempt.review,
    startedAt: attempt.startedAt,
    status: attempt.status,
    step: attempt.progress,
  };
}

/**
 * The response for a request that finds another attempt starting or running. Carries that
 * attempt's status when it is a lifecycle attempt, so the caller can follow it.
 */
export function attemptInProgressConflict(attempt?: LifecycleAttempt | null) {
  return conflict({
    body: {
      ...(attempt && { attempt: toAttemptStatus(attempt) }),
      message:
        "Another lifecycle operation is already in progress. Wait for it to finish, then try again if needed.",
      reason: "in-progress",
    },
  });
}

/** The response for a request whose plan is no longer the pending one. */
export function stalePlanConflict(message: string) {
  return conflict({ body: { message, reason: "stale-plan" } });
}

/** Invokes the execution route asynchronously for a started attempt and returns its activation id. */
async function dispatchExecution(
  stateStore: LifecycleStore<OrchestrationState>,
  attempt: LifecycleAttempt,
  params: WorkflowRouteParams,
) {
  try {
    const activation = await openwhisk().actions.invoke({
      blocking: false,
      name: DEFAULT_ACTION_NAME,
      params: {
        ...params,
        __ow_method: "post",
        __ow_path: "/execution",
        attemptId: attempt.id,
      },
      result: false,
    });

    return activation.activationId;
  } catch (error) {
    await persistDispatchFailure(stateStore, attempt, error);
    throw error;
  }
}

/** Marks an attempt retryable when its background invocation cannot be dispatched. */
async function persistDispatchFailure(
  stateStore: LifecycleStore<OrchestrationState>,
  attempt: LifecycleAttempt,
  error: unknown,
) {
  const state = await stateStore.get(CURRENT_STATE_KEY);

  if (
    !state ||
    state.latestAttempt?.id !== attempt.id ||
    state.latestAttempt.status !== "pending"
  ) {
    throw new DispatchedLifecycleAttemptNotFoundError(attempt.id);
  }

  await stateStore.put(CURRENT_STATE_KEY, {
    ...state,
    latestAttempt: {
      ...attempt,
      completedAt: nowIsoString(),
      failure: {
        key: "LIFECYCLE_DISPATCH_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Lifecycle execution dispatch failed",
        path: [],
      },
      status: "failed",
    },
  });
}
