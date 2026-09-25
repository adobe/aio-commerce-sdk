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

import { validateRecordedCommerceAppConfig } from "#config/lib/validate";
import { getAssociationData } from "#management/association/repository";
import { nowIsoString } from "#management/common/workflow/utils";
import { executeLifecycleAttempt } from "#management/lifecycle/execution";
import {
  getLifecycleOperation,
  planLifecycle,
} from "#management/lifecycle/planning";
import { startLifecycleAttempt } from "#management/lifecycle/start";
import { CURRENT_STATE_KEY } from "#management/lifecycle/state";

import {
  buildWorkflowParams,
  createInstallationStore,
  createLifecycleRuntime,
  createUninstallationStore,
  DEFAULT_ACTION_NAME,
  getStorageKey,
  toWorkflowRunState,
} from "./common";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { AssociatedCommerceData } from "#management/association/types";
import type {
  AppStateSnapshot,
  LifecycleAttempt,
  LifecycleOperation,
  OrchestrationState,
} from "#management/common/orchestration";
import type { LifecycleStore } from "#management/lifecycle/state";
import type {
  ExecutionHandlerArgs,
  RequestHandlerArgs,
  WorkflowRouteParams,
} from "./common";

/** Inputs for planning and starting one lifecycle transition. */
export type StartLifecycleChangeArgs = RequestHandlerArgs & {
  baseline: AppStateSnapshot | null;
  targetConfig: CommerceAppConfigOutputModel | null;
};

/**
 * Checks the preconditions of a lifecycle transition and resolves what planning it needs: the
 * operation, the Commerce instance, and the lifecycle runtime. Returns the error response instead
 * when a precondition fails.
 */
export async function prepareLifecycleChange({
  baseline,
  body,
  logger,
  rawParams,
  targetConfig,
}: StartLifecycleChangeArgs) {
  const actionVersion = process.env.__OW_ACTION_VERSION;
  if (!actionVersion) {
    return {
      response: internalServerError(
        "The OpenWhisk action version is required to plan a lifecycle change",
      ),
    };
  }

  const operation = getLifecycleOperation(baseline, targetConfig);

  // Install and upgrade run with the new config. An uninstall has none, so its step tree is built
  // from the installed version's config.
  const treeConfig = targetConfig ?? baseline?.config;
  // Only an uninstall of an app that isn't installed has no operation to run.
  if (!(operation && treeConfig)) {
    return {
      response: conflict({
        body: { message: "The app is not installed.", reason: "not-installed" },
      }),
    };
  }

  const validationError = validateLifecycleChange(baseline, targetConfig);
  if (validationError) {
    return { response: validationError };
  }

  // Install and uninstall take the Commerce instance from the request; upgrades take it from the association.
  let commerce: AssociatedCommerceData | undefined;
  if (operation === "upgrade") {
    const association = await getAssociationData();
    if (!association) {
      return {
        response: conflict({
          body: {
            message: "The app is not associated with a Commerce instance.",
            reason: "not-associated",
          },
        }),
      };
    }

    ({ commerce } = association);
  } else if (!body.commerceBaseUrl) {
    return {
      response: badRequest(
        `commerceBaseUrl is required to ${operation} the app.`,
      ),
    };
  }

  const params = buildLifecycleParams(body, rawParams, commerce);
  const runtime = await createLifecycleRuntime(
    params,
    treeConfig,
    logger,
    operation,
  );

  return {
    operation,
    params,
    planningOptions: {
      ...runtime,
      actionVersion,
      targetConfig,
    },
    treeConfig,
  };
}

/**
 * Starts the transition from the current baseline to the target config asynchronously.
 *
 * The operation is derived from the pair: no baseline installs, no target config uninstalls,
 * and both present upgrades. A manual upgrade is only planned and returned, without starting it.
 */
export async function startLifecycleChange(args: StartLifecycleChangeArgs) {
  const { logger, targetConfig } = args;
  const rawExecutionDeadline = process.env.__OW_DEADLINE;

  const prepared = await prepareLifecycleChange(args);
  if (prepared.response) {
    return prepared.response;
  }

  const { treeConfig, operation, params, planningOptions } = prepared;
  const { plan } = await planLifecycle(planningOptions);

  if (plan.issues.length > 0) {
    // Capitalized to keep the existing response message.
    const label = `${operation.charAt(0).toUpperCase()}${operation.slice(1)}`;
    return conflict({
      body: {
        issues: plan.issues,
        message: `${label} planning is blocked`,
      },
    });
  }

  if (
    operation === "upgrade" &&
    targetConfig?.metadata.upgradeMode === "manual"
  ) {
    return ok({
      body: { message: "Upgrade planned", operation, plan },
    });
  }

  if (!rawExecutionDeadline) {
    return internalServerError(
      "The OpenWhisk action deadline is required to start a lifecycle change",
    );
  }

  const executionDeadline = Number(rawExecutionDeadline);
  if (!Number.isFinite(executionDeadline)) {
    return internalServerError(
      "The OpenWhisk action deadline must be a valid timestamp",
    );
  }

  const attempt = await startLifecycleAttempt({
    ...planningOptions,
    executionDeadline: new Date(executionDeadline).toISOString(),
    planId: plan.id,
  });

  if (operation === "uninstall") {
    // A stale legacy uninstall record would otherwise resurface once this attempt is cleared.
    const legacyUninstallStore = await createUninstallationStore();
    await legacyUninstallStore.delete(getStorageKey());
  }

  let activationId: unknown;
  try {
    const activation = await openwhisk().actions.invoke({
      blocking: false,
      name: DEFAULT_ACTION_NAME,
      params: {
        ...params,
        __ow_method: "post",
        __ow_path: "/execution",
        appConfig: treeConfig,
        attemptId: attempt.id,
        operation: attempt.operation,
      },
      result: false,
    });
    ({ activationId } = activation);
  } catch (error) {
    await persistDispatchFailure(planningOptions.stateStore, attempt, error);
    throw error;
  }

  logger.debug(`Async ${operation} execution started: ${String(activationId)}`);
  if (operation === "upgrade") {
    return accepted({
      body: {
        message: "Upgrade started",
        operation,
        plan,
      },
    });
  }

  return accepted({
    body: {
      activationId,
      message:
        operation === "install"
          ? "Installation started"
          : "Uninstallation started",
      operation,
      ...toWorkflowRunState(attempt, treeConfig),
    },
  });
}

const LIFECYCLE_OPERATIONS: readonly LifecycleOperation[] = [
  "install",
  "upgrade",
  "uninstall",
];

/** Executes the current lifecycle attempt. */
export async function executeLifecycleChange({
  logger,
  params,
}: ExecutionHandlerArgs) {
  const { attemptId, appConfig: rawAppConfig, operation } = params;

  if (!rawAppConfig) {
    return badRequest("appConfig is required for lifecycle execution");
  }
  if (!LIFECYCLE_OPERATIONS.includes(operation)) {
    return badRequest("operation is required for lifecycle execution");
  }

  const rawExecutionDeadline = process.env.__OW_DEADLINE;
  if (!rawExecutionDeadline) {
    return internalServerError(
      "The OpenWhisk action deadline is required to execute a lifecycle change",
    );
  }
  const executionDeadline = Number(rawExecutionDeadline);
  if (!Number.isFinite(executionDeadline)) {
    return internalServerError(
      "The OpenWhisk action deadline must be a valid timestamp",
    );
  }
  const actionVersion = process.env.__OW_ACTION_VERSION;
  if (!actionVersion) {
    return internalServerError(
      "The OpenWhisk action version is required to execute a lifecycle change",
    );
  }

  // An uninstall replays a recorded baseline config, which predates the current strict schema.
  const appConfig = validateRecordedCommerceAppConfig(rawAppConfig);
  const runtime = await createLifecycleRuntime(
    params,
    appConfig,
    logger,
    operation,
  );
  const result = await executeLifecycleAttempt({
    actionVersion,
    attemptId,
    executionDeadline: new Date(executionDeadline).toISOString(),
    lifecycleContext: runtime.lifecycleContext,
    rootStep: runtime.rootStep,
    snapshotStore: runtime.snapshotStore,
    stateStore: runtime.stateStore,
  });

  logger.debug(`${result.operation} completed: ${result.status}`);
  if (result.status === "failed") {
    return internalServerError({
      body: {
        attempt: result,
        failure: result.failure,
        message: `${result.operation} failed`,
      },
    });
  }

  // The legacy record is what the compatibility baseline reads, so a lifecycle-owned run must
  // retire it; otherwise a completed uninstall would still report the app as installed.
  const legacyStore = await createInstallationStore();
  await legacyStore.delete(getStorageKey());

  return ok({ body: result });
}

/** Builds execution parameters targeting the associated Commerce instance when given, otherwise the body's. */
function buildLifecycleParams(
  body: StartLifecycleChangeArgs["body"],
  rawParams: StartLifecycleChangeArgs["rawParams"],
  commerce?: AssociatedCommerceData,
): WorkflowRouteParams {
  // Upgrades never took the I/O Events settings from the body, so they keep the action's own.
  if (!commerce) {
    return buildWorkflowParams(body, rawParams) as WorkflowRouteParams;
  }

  return {
    ...rawParams,
    AIO_COMMERCE_API_BASE_URL: commerce.baseUrl,
    AIO_COMMERCE_API_FLAVOR: commerce.env,
    appData: body.appData,
  } as WorkflowRouteParams;
}

/** Validates the invariants that apply before lifecycle planning. */
function validateLifecycleChange(
  baseline: AppStateSnapshot | null,
  targetConfig: CommerceAppConfigOutputModel | null,
) {
  if (!(baseline && targetConfig)) {
    return null;
  }

  if (baseline.config.metadata.id !== targetConfig.metadata.id) {
    return conflict({
      body: {
        message: `The application ID (metadata.id) cannot be changed during an upgrade. Expected "${baseline.config.metadata.id}", received "${targetConfig.metadata.id}".`,
      },
    });
  }

  return baseline.config.metadata.version === targetConfig.metadata.version
    ? conflict({
        body: {
          message: "The app is already on the target version.",
          reason: "already-current",
        },
      })
    : null;
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
    throw new Error("The dispatched lifecycle attempt is missing or stale");
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
