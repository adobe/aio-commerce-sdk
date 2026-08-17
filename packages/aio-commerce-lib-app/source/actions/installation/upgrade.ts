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

import { createLifecycleRuntime, DEFAULT_ACTION_NAME } from "./common";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { AppStateSnapshot } from "#management/common/orchestration";
import type {
  ExecutionHandlerArgs,
  LifecycleExecutionRouteParams,
  RequestHandlerArgs,
  WorkflowRouteParams,
} from "./common";

/** Inputs for {@link startUpgrade}. */
type StartUpgradeArgs = RequestHandlerArgs & {
  appConfig: CommerceAppConfigOutputModel;
  baseline: AppStateSnapshot;
};

/**
 * Plans an upgrade from the current baseline toward the target config and,
 * for automatic upgrades, starts it asynchronously.
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
    return ok({ body: { reason: "not-associated", skipped: true } });
  }

  if (baseline.config.metadata.version === appConfig.metadata.version) {
    return ok({ body: { reason: "already-current", skipped: true } });
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

  const { upgradeMode } = appConfig.metadata;
  if (upgradeMode === "manual") {
    return ok({
      body: {
        message: "Upgrade planned",
        operation: "upgrade",
        plan: planning.plan,
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

  logger.debug(`Async upgrade execution started: ${activation.activationId}`);
  return accepted({
    body: {
      message: "Upgrade started",
      operation: "upgrade",
      plan: planning.plan,
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

  const appConfig = validateCommerceAppConfig(rawAppConfig);
  const runtime = await createLifecycleRuntime(params, appConfig, logger);
  const result = await executeLifecycleAttempt({
    attemptId,
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
