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
import { getAssociationData } from "#management/association/repository";
import { getCurrentLifecycleBaseline } from "#management/lifecycle/baseline";
import {
  DispatchedLifecycleAttemptNotFoundError,
  LifecycleAttemptInProgressError,
} from "#management/lifecycle/errors";
import { planLifecycle } from "#management/lifecycle/planning";
import { startLifecycleAttempt } from "#management/lifecycle/start";
import { CURRENT_STATE_KEY } from "#management/lifecycle/state";

import {
  buildWorkflowParams,
  createLifecyclePersistence,
  createLifecycleRuntime,
  DEFAULT_ACTION_NAME,
  isPostAppDeployInvocation,
  LIFECYCLE_OPERATION_LABEL,
} from "./common";

import type { ActionResponse } from "@adobe/aio-commerce-lib-core/responses";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  AppStateSnapshot,
  LifecycleAttempt,
  LifecycleOperation,
  OrchestrationState,
} from "#management/common/orchestration";
import type { LifecycleStore } from "#management/lifecycle/state";
import type { RequestHandlerArgs, WorkflowRouteParams } from "./common";

/** Inputs for {@link startLifecycle}. */
type StartLifecycleArgs = RequestHandlerArgs & {
  headers: Record<string, string | undefined>;
};

/**
 * Plans the reconciliation from the current baseline toward the target config and starts it
 * asynchronously. Installs when there is no baseline, and upgrades otherwise.
 */
export async function startLifecycle({
  body,
  headers,
  logger,
  rawParams,
}: StartLifecycleArgs) {
  const rawAppConfig = rawParams.appConfig;
  if (!rawAppConfig) {
    return internalServerError(
      "The app config is missing. Does the action receive it as a parameter?",
    );
  }

  const actionVersion = process.env.__OW_ACTION_VERSION;
  if (!actionVersion) {
    return internalServerError(
      "The OpenWhisk action version is required to plan a lifecycle operation",
    );
  }

  const appConfig = validateCommerceAppConfig(rawAppConfig);
  const persistence = await createLifecyclePersistence();
  const baseline = await getCurrentLifecycleBaseline(
    persistence.stateStore,
    persistence.baselineProvider,
  );

  const operation: LifecycleOperation = baseline ? "upgrade" : "install";
  const label = LIFECYCLE_OPERATION_LABEL[operation];

  // A deploy never starts a first install: it runs for an app that is installed from Commerce
  // Admin, so without a baseline it reports that the app is not installed instead.
  const canStartInstall = !isPostAppDeployInvocation(headers);

  const resolution =
    operation === "install" && canStartInstall
      ? resolveInstallParams({ body, rawParams })
      : await resolveUpgradeParams({ appConfig, baseline, body, rawParams });

  if (resolution.kind === "rejected") {
    return resolution.response;
  }

  const { params } = resolution;

  logger.debug(
    `Planning ${operation} for app "${body.appData.projectName}" (workspace: "${body.appData.workspaceName}")`,
  );

  const runtime = createLifecycleRuntime(
    persistence,
    params,
    appConfig,
    logger,
  );

  try {
    const planning = await planLifecycle({
      ...runtime,
      actionVersion,
      operation,
      targetAppVersion: appConfig.metadata.version,
      targetConfig: appConfig,
    });

    if (planning.kind === "blocked") {
      return conflict({
        body: {
          issues: planning.plan.issues,
          message: `${label} planning is blocked`,
        },
      });
    }

    if (
      operation === "upgrade" &&
      appConfig.metadata.upgradeMode === "manual"
    ) {
      return ok({
        body: {
          message: "Upgrade planned",
          operation,
          plan: planning.plan,
        },
      });
    }

    const rawExecutionDeadline = process.env.__OW_DEADLINE;
    if (!rawExecutionDeadline) {
      return internalServerError(
        "The OpenWhisk action deadline is required to start a lifecycle operation",
      );
    }

    const attempt = await startLifecycleAttempt({
      ...runtime,
      actionVersion,
      executionDeadline: new Date(Number(rawExecutionDeadline)).toISOString(),
      planId: planning.plan.id,
    });

    await dispatchExecution(runtime.stateStore, attempt, params, logger);
    return accepted({
      body: {
        message: `${label} started`,
        operation,
        plan: planning.plan,
      },
    });
  } catch (error) {
    if (error instanceof LifecycleAttemptInProgressError) {
      return conflict(
        `${label} is already in progress. Wait for it to complete.`,
      );
    }

    throw error;
  }
}

/** Outcome of the preconditions that gate a lifecycle operation. */
type ParamsResolution =
  | { kind: "rejected"; response: ActionResponse }
  | { kind: "resolved"; params: WorkflowRouteParams };

/** Resolves an install's workflow params from the request body. */
function resolveInstallParams({
  body,
  rawParams,
}: {
  body: RequestHandlerArgs["body"];
  rawParams: RequestHandlerArgs["rawParams"];
}): ParamsResolution {
  const { commerceBaseUrl } = body;
  if (!commerceBaseUrl) {
    return {
      kind: "rejected",
      response: badRequest("commerceBaseUrl is required to install the app."),
    };
  }

  return {
    kind: "resolved",
    params: buildWorkflowParams({ ...body, commerceBaseUrl }, rawParams),
  };
}

/**
 * Checks the preconditions that only apply to an upgrade and, when they hold, resolves its
 * workflow params from the Commerce association rather than from the request body.
 */
async function resolveUpgradeParams({
  appConfig,
  baseline,
  body,
  rawParams,
}: {
  appConfig: CommerceAppConfigOutputModel;
  baseline: AppStateSnapshot | null;
  body: RequestHandlerArgs["body"];
  rawParams: RequestHandlerArgs["rawParams"];
}): Promise<ParamsResolution> {
  const reject = (response: ActionResponse): ParamsResolution => ({
    kind: "rejected",
    response,
  });

  const association = await getAssociationData();
  if (!association) {
    return reject(
      conflict({
        body: {
          message: "The app is not associated with a Commerce instance.",
          reason: "not-associated",
        },
      }),
    );
  }

  if (!baseline) {
    return reject(
      conflict({
        body: { message: "The app is not installed.", reason: "not-installed" },
      }),
    );
  }

  if (baseline.config.metadata.id !== appConfig.metadata.id) {
    return reject(
      conflict({
        body: {
          message: `The application ID (metadata.id) cannot be changed during an upgrade. Expected "${baseline.config.metadata.id}", received "${appConfig.metadata.id}".`,
        },
      }),
    );
  }

  if (baseline.config.metadata.version === appConfig.metadata.version) {
    return reject(
      conflict({
        body: {
          message: "The app is already on the target version.",
          reason: "already-current",
        },
      }),
    );
  }

  return {
    kind: "resolved",
    params: {
      ...rawParams,
      AIO_COMMERCE_API_BASE_URL: association.commerce.baseUrl,
      AIO_COMMERCE_API_FLAVOR: association.commerce.env,
      appData: body.appData,
    },
  };
}

/** Invokes the execution route asynchronously for a started attempt. */
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

    logger.debug(
      `Async lifecycle execution started: ${String(activation.activationId)}`,
    );
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
