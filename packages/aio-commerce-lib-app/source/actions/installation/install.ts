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
import {
  createInitialInstallationState,
  isFailedState,
  isInProgressState,
  isSucceededState,
  runInstallation,
  runValidation,
} from "#management/index";

import {
  buildLifecycleContext,
  buildWorkflowParams,
  createInstallationHooks,
  createInstallationStore,
  DEFAULT_ACTION_NAME,
  getStorageKey,
} from "./common";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { ValidationContext } from "#management/index";
import type { ExecutionHandlerArgs, RequestHandlerArgs } from "./common";

/** Inputs for {@link startInstallation}. */
type StartInstallationArgs = RequestHandlerArgs & {
  appConfig: CommerceAppConfigOutputModel;
};

/** Plans and asynchronously starts an initial installation. */
export async function startInstallation({
  appConfig,
  body,
  logger,
  rawParams,
}: StartInstallationArgs) {
  const { appData, commerceBaseUrl } = body;
  const store = await createInstallationStore();
  const existingState = await store.get(getStorageKey());

  if (existingState) {
    if (isInProgressState(existingState)) {
      logger.debug(`Installation already in progress: ${existingState.status}`);
      return conflict(
        `Installation is already ${existingState.status}. Wait for it to complete.`,
      );
    }

    if (isSucceededState(existingState)) {
      logger.debug("Installation already succeeded");
      return conflict(
        // Temporarily return 409 while we don't have a fallback storage to get the config from.
        existingState.config
          ? "Installation has already completed successfully."
          : "The existing installation does not include its original config and cannot be upgraded safely. Uninstall and reinstall the app.",
      );
    }

    logger.debug("Previous installation failed, allowing retry");
  }

  if (!commerceBaseUrl) {
    return badRequest("commerceBaseUrl is required to install the app.");
  }

  logger.debug(
    `Starting installation for app "${appData.projectName}" (workspace: "${appData.workspaceName}", commerce: "${commerceBaseUrl}")`,
  );

  const initialState = createInitialInstallationState({ config: appConfig });
  logger.debug(`Created initial state: ${initialState.id}`);
  await store.put(getStorageKey(), initialState);

  const mergedParams = buildWorkflowParams(body, rawParams);
  const activation = await openwhisk().actions.invoke({
    blocking: false,
    name: DEFAULT_ACTION_NAME,
    params: {
      ...mergedParams,
      __ow_method: "post",
      __ow_path: "/execution",
      appConfig,
      initialState,
    },
    result: false,
  });

  logger.debug(`Async execution started: ${activation.activationId}`);
  return accepted({
    body: {
      activationId: activation.activationId,
      message: "Installation started",
      operation: "install",
      ...initialState,
    },
  });
}

/** Runs the installation workflow for an async execution request. */
export async function executeInstallation({
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

  const appConfig = validateCommerceAppConfig(rawAppConfig);
  const store = await createInstallationStore();
  const hooks = createInstallationHooks(store, (msg) => logger.debug(msg));
  const installationContext = buildLifecycleContext(params, appConfig, logger);

  logger.debug(
    `Executing installation ${initialState.id} for app "${appData.projectName}" (workspace: "${appData.workspaceName}", commerce: "${AIO_COMMERCE_API_BASE_URL}")`,
  );
  const result = await runInstallation({
    config: appConfig,
    hooks,
    initialState,
    installationContext,
  });

  await store.put(getStorageKey(), result);
  logger.debug(`Installation completed: ${result.status}`);

  if (isFailedState(result)) {
    return internalServerError({
      body: {
        error: result.error,
        message: "Installation failed",
        state: result,
      },
    });
  }

  return ok({ body: result });
}

/** Runs pre-installation validation over the step tree. */
export async function validateInstallation({
  body,
  logger,
  rawParams,
}: RequestHandlerArgs) {
  logger.debug("Running pre-installation validation...");

  const rawAppConfig = rawParams.appConfig;
  if (!rawAppConfig) {
    return internalServerError(
      "The app config is missing. Does the action receive it as a parameter?",
    );
  }

  const appConfig = validateCommerceAppConfig(rawAppConfig);
  const { appData, ...params } = buildWorkflowParams(body, rawParams);

  const validationContext: ValidationContext = {
    appData,
    logger,
    params,
  };

  const result = await runValidation({
    config: appConfig,
    validationContext,
  });

  logger.debug(
    `Validation complete. Valid: ${result.valid}, Errors: ${result.summary.errors}, Warnings: ${result.summary.warnings}`,
  );

  return ok({ body: result });
}
