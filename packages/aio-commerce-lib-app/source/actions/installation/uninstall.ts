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
import {
  createInitialUninstallationState,
  isFailedState,
  isInProgressState,
  isSucceededState,
  runUninstallation,
} from "#management/index";
import { getCurrentLifecycleBaseline } from "#management/lifecycle/baseline";
import { CURRENT_STATE_KEY } from "#management/lifecycle/state";
import { createOrchestrationStateStore } from "#management/lifecycle/storage";

import {
  buildLifecycleContext,
  buildWorkflowParams,
  createInstallationHooks,
  createInstallationStore,
  createLifecyclePersistence,
  createUninstallationStore,
  DEFAULT_ACTION_NAME,
  getStorageKey,
} from "./common";

import type { ExecutionHandlerArgs, RequestHandlerArgs } from "./common";

/** Plans and asynchronously starts an uninstallation. */
export async function startUninstallation({
  body,
  logger,
  rawParams,
}: RequestHandlerArgs) {
  const { appData, commerceBaseUrl } = body;
  if (!commerceBaseUrl) {
    return badRequest("commerceBaseUrl is required to uninstall the app.");
  }

  logger.debug(
    `Starting uninstallation for app "${appData.projectName}" (workspace: "${appData.workspaceName}", commerce: "${commerceBaseUrl}")`,
  );

  const store = await createUninstallationStore();
  const existingState = await store.get(getStorageKey());

  if (existingState && isInProgressState(existingState)) {
    logger.debug(`Uninstallation already in progress: ${existingState.status}`);
    return conflict(
      "Uninstallation is already in progress. Wait for it to complete.",
    );
  }

  const { baselineProvider, stateStore } = await createLifecyclePersistence();
  const installationSnapshot = await getCurrentLifecycleBaseline(
    stateStore,
    baselineProvider,
  );
  const baselineAppConfig = installationSnapshot?.config;

  const uninstallConfig = baselineAppConfig ?? rawParams.appConfig;
  if (!uninstallConfig) {
    return internalServerError(
      "Cannot determine what to uninstall: no recorded lifecycle baseline and no app config was provided.",
    );
  }

  logger.debug(
    baselineAppConfig
      ? "Sourcing uninstallation from recorded lifecycle baseline"
      : "No recorded lifecycle baseline found; falling back to request config",
  );

  const initialState = createInitialUninstallationState({
    config: validateRecordedCommerceAppConfig(uninstallConfig),
  });
  logger.debug(`Created initial uninstall state: ${initialState.id}`);
  await store.put(getStorageKey(), initialState);

  const workflowParams = buildWorkflowParams(body, rawParams);
  const activation = await openwhisk().actions.invoke({
    blocking: false,
    name: DEFAULT_ACTION_NAME,
    params: {
      ...workflowParams,
      __ow_method: "post",
      __ow_path: "/uninstallation/execution",
      appConfig: uninstallConfig,
      initialState,
    },
    result: false,
  });

  logger.debug(`Async uninstallation started: ${activation.activationId}`);
  return accepted({
    body: {
      activationId: activation.activationId,
      message: "Uninstallation started",
      ...initialState,
    },
  });
}

/** Runs the uninstallation workflow and clears lifecycle state on success. */
export async function executeUninstallation({
  logger,
  params,
}: ExecutionHandlerArgs) {
  const {
    initialState,
    appConfig: rawAppConfig,
    appData,
    AIO_COMMERCE_API_BASE_URL,
  } = params;

  // params is an unchecked cast over raw runtime action params, so initialState
  // can genuinely be missing at runtime despite the asserted type.
  if (!initialState) {
    return badRequest("initialState is required for execution");
  }

  if (!rawAppConfig) {
    return badRequest("appConfig is required for execution");
  }

  const appConfig = validateRecordedCommerceAppConfig(rawAppConfig);
  const store = await createUninstallationStore();
  const hooks = createInstallationHooks(store, (msg) => logger.debug(msg));
  const installationContext = buildLifecycleContext(params, appConfig, logger);

  logger.debug(
    `Executing uninstallation ${initialState.id} for app "${appData.projectName}" (workspace: "${appData.workspaceName}", commerce: "${AIO_COMMERCE_API_BASE_URL}")`,
  );

  const result = await runUninstallation({
    config: appConfig,
    hooks,
    initialState,
    installationContext,
  });

  await store.put(getStorageKey(), result);
  logger.debug(`Uninstallation completed: ${result.status}`);

  if (isSucceededState(result)) {
    const [installationStore, orchestrationStateStore] = await Promise.all([
      createInstallationStore(),
      createOrchestrationStateStore(),
    ]);

    await Promise.all([
      installationStore.delete(getStorageKey()),
      orchestrationStateStore.delete(CURRENT_STATE_KEY),
    ]);

    logger.debug(
      "Cleared installation and lifecycle orchestration state after successful uninstallation",
    );
  }

  if (isFailedState(result)) {
    return internalServerError({
      body: {
        error: result.error,
        message: "Uninstallation failed",
        state: result,
      },
    });
  }

  return ok({ body: result });
}
