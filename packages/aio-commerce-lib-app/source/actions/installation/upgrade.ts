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
import { executeLifecycleAttempt } from "#management/lifecycle/execution";
import { planLifecycle } from "#management/lifecycle/planning";
import { startLifecycleAttempt } from "#management/lifecycle/start";
import {
  putAttempt,
  readAttempt,
  updateLatestAttempt,
} from "#management/lifecycle/state";

import { createLifecycleRuntime, DEFAULT_ACTION_NAME } from "./common";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  AppStateSnapshot,
  LifecycleAttempt,
} from "#management/common/orchestration";
import type { LifecycleRuntime } from "#management/lifecycle/state";
import type {
  ExecutionHandlerArgs,
  LifecycleExecutionRouteParams,
  RequestHandlerArgs,
  WorkflowRouteParams,
} from "./common";

/** Inputs for {@link startUpgrade}. */
type StartUpgradeArgs = RequestHandlerArgs & {
  appConfig: CommerceAppConfigOutputModel;
  baseline: AppStateSnapshot | null;
};

/**
 * Externally-callable execute entry point.
 *
 * Called by the Commerce App Management Service to run an upgrade (for both auto
 * and manual modes — they differ only in who triggers this call). It (re)plans
 * from the current baseline toward the target config, mints a persisted attempt
 * so status is pollable, asynchronously dispatches the actual work, and returns
 * `{ attemptId, plan: { source, target } }` synchronously.
 */
export async function startUpgrade({
  appConfig,
  baseline,
  body,
  logger,
  rawParams,
}: StartUpgradeArgs) {
  const actionVersion = process.env.__OW_ACTION_VERSION;
  const rawExecutionDeadline = process.env.__OW_DEADLINE;

  if (!actionVersion) {
    return internalServerError(
      "The OpenWhisk action version is required to plan an upgrade",
    );
  }

  const association = await getAssociationData();
  if (!association) {
    return conflict({
      body: {
        message: "The app is not associated with a Commerce instance.",
        reason: "not-associated",
      },
    });
  }

  if (!baseline) {
    return conflict({
      body: {
        message: "The app is not installed.",
        reason: "not-installed",
      },
    });
  }

  if (baseline.config.metadata.id !== appConfig.metadata.id) {
    return conflict({
      body: {
        message: `The application ID (metadata.id) cannot be changed during an upgrade. Expected "${baseline.config.metadata.id}", received "${appConfig.metadata.id}".`,
      },
    });
  }

  if (baseline.config.metadata.version === appConfig.metadata.version) {
    return conflict({
      body: {
        message: "The app is already on the target version.",
        reason: "already-current",
      },
    });
  }

  const params = {
    ...rawParams,
    AIO_COMMERCE_API_BASE_URL: association.commerce.baseUrl,
    AIO_COMMERCE_API_FLAVOR: association.commerce.env,
    appData: body.appData,
  } as WorkflowRouteParams;

  const runtime = await createLifecycleRuntime(params, appConfig, logger);
  const planning = await planLifecycle({
    ...runtime,
    actionVersion,
    operation: "upgrade",
    targetAppVersion: appConfig.metadata.version,
    targetConfig: appConfig,
  });

  if (planning.kind === "blocked") {
    return conflict({
      body: {
        issues: planning.plan.issues,
        message: "Upgrade planning is blocked",
      },
    });
  }

  if (!rawExecutionDeadline) {
    return internalServerError(
      "The OpenWhisk action deadline is required to start an upgrade",
    );
  }

  const attempt = await startLifecycleAttempt({
    ...runtime,
    actionVersion,
    executionDeadline: new Date(Number(rawExecutionDeadline)).toISOString(),
    planId: planning.plan.id,
  });

  const ow = openwhisk();
  let activationId: unknown;
  try {
    const activation = await ow.actions.invoke({
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
    ({ activationId } = activation);
  } catch (error) {
    await persistDispatchFailure(runtime, attempt, error);
    throw error;
  }

  logger.debug(`Async upgrade execution started: ${String(activationId)}`);
  return accepted({
    body: {
      attemptId: attempt.id,
      // Return only the versions the orchestrator needs — not the full validated
      // target config that plan.target also carries.
      plan: {
        source: { appVersion: planning.plan.source.appVersion },
        target: { appVersion: planning.plan.target.appVersion },
      },
    },
  });
}

/** Executes a planned upgrade attempt. */
export async function executeUpgrade({
  logger,
  params,
}: ExecutionHandlerArgs<LifecycleExecutionRouteParams>) {
  const { attemptId, appConfig: rawAppConfig } = params;

  if (!rawAppConfig) {
    return badRequest("appConfig is required for upgrade execution");
  }

  const rawExecutionDeadline = process.env.__OW_DEADLINE;
  if (!rawExecutionDeadline) {
    return internalServerError(
      "The OpenWhisk action deadline is required to execute an upgrade",
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
      "The OpenWhisk action version is required to execute an upgrade",
    );
  }

  const appConfig = validateCommerceAppConfig(rawAppConfig);
  const runtime = await createLifecycleRuntime(params, appConfig, logger);
  const result = await executeLifecycleAttempt({
    actionVersion,
    attemptId,
    attemptStore: runtime.attemptStore,
    executionDeadline: new Date(executionDeadline).toISOString(),
    lifecycleContext: runtime.lifecycleContext,
    rootStep: runtime.rootStep,
    snapshotStore: runtime.snapshotStore,
    stateStore: runtime.stateStore,
  });

  logger.debug(`Upgrade completed: ${result.status}`);
  if (result.status === "failed") {
    return internalServerError({
      body: {
        attempt: result,
        failure: result.failure,
        message: "Upgrade failed",
      },
    });
  }

  return ok({ body: result });
}

/** Marks an attempt failed when its background invocation cannot be dispatched. */
async function persistDispatchFailure(
  stores: Pick<LifecycleRuntime, "stateStore" | "attemptStore">,
  attempt: LifecycleAttempt,
  error: unknown,
) {
  const current = await readAttempt(stores.attemptStore, attempt.id);
  if (current?.status !== "pending") {
    throw new Error("The dispatched lifecycle attempt is missing or stale");
  }

  const failed: LifecycleAttempt = {
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
  };

  await putAttempt(stores.attemptStore, failed);
  await updateLatestAttempt(stores.stateStore, failed);
}
