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
import {
  describeActiveAttempt,
  logAttemptEnded,
  logAttemptStarted,
  logBlockedPlan,
  logPlan,
} from "./logging";

import type { ActionResponse } from "@adobe/aio-commerce-lib-core/responses";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  LifecycleAttempt,
  LifecycleOperation,
  LifecyclePlan,
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
  const { logger } = runtime.lifecycleContext;

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
      logger.warn(
        `Refused to plan the ${operation} because ${describeActiveAttempt(state?.latestAttempt)}.`,
      );

      return {
        kind: "rejected",
        response: attemptInProgressConflict(state?.latestAttempt),
      };
    }

    if (error instanceof PendingLifecyclePlanNotFoundError) {
      logger.warn(
        `Refused to plan the ${operation} because the reviewed plan ${reviewedPlanId} is no longer the pending plan.`,
      );

      return {
        kind: "rejected",
        response: stalePlanConflict(
          `The reviewed plan is no longer the pending plan. Plan the ${label.toLowerCase()} again and review the new plan.`,
        ),
      };
    }

    throw error;
  }

  logPlan(logger, planning.plan);
  if (planning.kind === "blocked") {
    logBlockedPlan(logger, planning.plan);

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
      activationId: getActivationId(),
      executionDeadline: getExecutionDeadline(),
      planId: planning.plan.id,
      review: planning.review,
    });
  } catch (error) {
    if (error instanceof LifecycleAttemptInProgressError) {
      const state = await runtime.stateStore.get(CURRENT_STATE_KEY);
      logger.warn(
        `Refused to start plan ${planning.plan.id} because ${describeActiveAttempt(state?.latestAttempt)}.`,
      );

      return attemptInProgressConflict(state?.latestAttempt);
    }

    // This request planned it a moment ago, so only a simultaneous request can have replaced it.
    if (error instanceof PendingLifecyclePlanNotFoundError) {
      logger.warn(
        `Refused to start plan ${planning.plan.id} because another request replaced it.`,
      );

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
    logger,
  );

  logAttemptStarted(logger, label, attempt, activationId);
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

/** The identifier of the current activation. */
function getActivationId() {
  // OpenWhisk always sets it. The fallback keeps a local run from failing on a missing log reference.
  return process.env.__OW_ACTIVATION_ID ?? "unknown";
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
  const activationId = getActivationId();
  const executionStartedAt = Date.now();

  logger.info(
    `Executing lifecycle attempt ${attemptId} in activation ${activationId}.`,
  );

  const result = await executeLifecycleAttempt({
    actionVersion,
    activationId,
    attemptId,
    executionDeadline: getExecutionDeadline(),
    lifecycleContext: runtime.lifecycleContext,
    rootStep: runtime.rootStep,
    snapshotStore: runtime.snapshotStore,
    stateStore: runtime.stateStore,
  });

  const label = OPERATION_LABEL[result.operation];
  logAttemptEnded(logger, label, result, Date.now() - executionStartedAt);

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
    activations: attempt.activations,
    completedAt: attempt.completedAt,
    data: attempt.data,
    error: attempt.status === "failed" ? attempt.failure : undefined,
    id: attempt.id,
    operation: attempt.operation,
    planId: attempt.plan.id,
    previousAttemptId: attempt.previousAttemptId,
    previousPlanId: attempt.plan.previousPlanId,
    result: attempt.status === "succeeded" ? attempt.result : undefined,
    review: attempt.review,
    startedAt: attempt.startedAt,
    status: attempt.status,
    step: attempt.progress,
  };
}

/** The stores the lifecycle history is read from. */
type LifecycleHistoryStores = {
  attemptStore: LifecycleStore<LifecycleAttempt>;
  planStore: LifecycleStore<LifecyclePlan>;
};

/**
 * The status of the latest attempt with the plans it ran and replaced, every earlier attempt
 * (newest first, each with its own plans) and the plans made since it.
 *
 * @param attempt - The latest attempt.
 * @param pendingPlan - The pending plan, or `null` when none is pending.
 * @param stores - The attempt and plan stores.
 * @param limit - How many earlier attempts to read at most. Reads all of them when absent.
 */
export async function toAttemptHistory(
  attempt: LifecycleAttempt,
  pendingPlan: LifecyclePlan | null,
  stores: LifecycleHistoryStores,
  limit?: number,
) {
  const history: (ReturnType<typeof toAttemptStatus> & {
    plans: LifecyclePlan[];
  })[] = [];

  let previousId = attempt.previousAttemptId;
  while (previousId && (limit === undefined || history.length < limit)) {
    // biome-ignore lint/performance/noAwaitInLoops: each attempt names the one before it
    const previous = await stores.attemptStore.get(previousId);
    if (!previous) {
      break;
    }

    history.push({
      ...toAttemptStatus(previous),
      plans: await readPlanChain(previous.plan, stores.planStore),
    });

    previousId = previous.previousAttemptId;
  }

  return {
    ...toAttemptStatus(attempt),
    history,
    pendingPlans: pendingPlan
      ? await readPlanChain(pendingPlan, stores.planStore)
      : [],
    plans: await readPlanChain(attempt.plan, stores.planStore),
  };
}

/** The given plan followed by the stored plans it replaced, newest first, up to the first missing one. */
async function readPlanChain(
  plan: LifecyclePlan,
  planStore: LifecycleStore<LifecyclePlan>,
) {
  const plans = [plan];
  let previousId = plan.previousPlanId;

  while (previousId) {
    // biome-ignore lint/performance/noAwaitInLoops: each plan names the one before it
    const previous = await planStore.get(previousId);
    if (!previous) {
      break;
    }

    plans.push(previous);
    previousId = previous.previousPlanId;
  }

  return plans;
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
  logger: RequestHandlerArgs["logger"],
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
    await persistDispatchFailure(stateStore, attempt, error, logger);
    throw error;
  }
}

/** Marks an attempt retryable when its background invocation cannot be dispatched. */
async function persistDispatchFailure(
  stateStore: LifecycleStore<OrchestrationState>,
  attempt: LifecycleAttempt,
  error: unknown,
  logger: RequestHandlerArgs["logger"],
) {
  const message =
    error instanceof Error
      ? error.message
      : "Lifecycle execution dispatch failed";

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
        message,
        path: [],
      },
      status: "failed",
    },
  });

  logger.error(
    `Could not dispatch the execution of the ${attempt.operation} attempt ${attempt.id}, so it was marked failed: ${message}`,
  );
}
