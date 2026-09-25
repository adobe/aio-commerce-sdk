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
  badRequest,
  internalServerError,
  ok,
} from "@adobe/aio-commerce-lib-core/responses";

import { validateCommerceAppConfig } from "#config/lib/validate";
import { executeLifecycleAttempt } from "#management/lifecycle/execution";

import {
  createLifecyclePersistence,
  createLifecycleRuntime,
  LIFECYCLE_OPERATION_LABEL,
} from "./common";

import type {
  ExecutionHandlerArgs,
  LifecycleExecutionRouteParams,
} from "./common";

/** Executes a started lifecycle attempt, whether it installs or upgrades the app. */
export async function executeLifecycle({
  logger,
  params,
}: ExecutionHandlerArgs<LifecycleExecutionRouteParams>) {
  const { attemptId, appConfig: rawAppConfig } = params;

  if (!rawAppConfig) {
    return badRequest("appConfig is required for lifecycle execution");
  }

  const rawExecutionDeadline = process.env.__OW_DEADLINE;
  if (!rawExecutionDeadline) {
    return internalServerError(
      "The OpenWhisk action deadline is required to execute a lifecycle attempt",
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
      "The OpenWhisk action version is required to execute a lifecycle attempt",
    );
  }

  const appConfig = validateCommerceAppConfig(rawAppConfig);
  const persistence = await createLifecyclePersistence();
  const runtime = createLifecycleRuntime(
    persistence,
    params,
    appConfig,
    logger,
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

  const label = LIFECYCLE_OPERATION_LABEL[result.operation];
  logger.debug(`${label} completed: ${result.status}`);

  if (result.status === "failed") {
    return internalServerError({
      body: {
        attempt: result,
        failure: result.failure,
        message: `${label} failed`,
      },
    });
  }

  return ok({ body: result });
}
