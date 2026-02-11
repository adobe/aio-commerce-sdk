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
  noContent,
  ok,
} from "@adobe/aio-commerce-lib-core/responses";
import {
  HttpActionRouter,
  logger,
} from "@aio-commerce-sdk/common-utils/actions";
import { createCombinedStore } from "@aio-commerce-sdk/common-utils/storage";
import openwhisk from "openwhisk";
import { object, string } from "valibot";

import {
  createInitialInstallationState,
  isCompletedState,
  isFailedState,
  isInProgressState,
  isPendingState,
  isSucceededState,
  runInstallation,
} from "#management/index";
import { AppCredentialsSchema } from "#management/installation/schema";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type { KeyValueStore } from "@aio-commerce-sdk/common-utils/storage";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { AppCredentials } from "#management/installation/schema";
import type {
  InstallationState,
  PendingInstallationState,
} from "#management/installation/workflow/types";

// Action name for async invocation
const DEFAULT_ACTION_NAME = "app-management/installation";

/** Params received during async execution (internal invocation). */
type ExecutionParams = RuntimeActionParams & {
  appCredentials: AppCredentials;
  initialState: PendingInstallationState;
  appConfig: CommerceAppConfigOutputModel;

  AIO_COMMERCE_AUTH_IMS_CLIENT_ID: string;
};

/**
 * Creates an installation state store using lib-core combined storage.
 */
function createInstallationStore() {
  return createCombinedStore<InstallationState>({
    cache: { keyPrefix: "installation" },
    persistent: {
      dirPrefix: "installation",
      shouldPersist: isCompletedState,
    },
  });
}

/**
 * Creates hooks to sync installation state to storage.
 */
function createInstallationHooks(
  store: KeyValueStore<InstallationState>,
  logFn: (message: string) => void,
) {
  const logAndSave = async (message: string, data: InstallationState) => {
    logFn(message);
    await store.put(data.id, data);
  };

  return {
    onInstallationStart: (state: InstallationState) =>
      logAndSave("Installation started", state),
    onInstallationFailure: (state: InstallationState) =>
      logAndSave("Installation failed", state),
    onInstallationSuccess: (state: InstallationState) =>
      logAndSave("Installation succeeded", state),

    onStepStart: (event: { stepName: string }, state: InstallationState) =>
      logAndSave(`Step started: ${event.stepName}`, state),
    onStepSuccess: (event: { stepName: string }, state: InstallationState) =>
      logAndSave(`Step succeeded: ${event.stepName}`, state),
    onStepFailure: (event: { stepName: string }, state: InstallationState) =>
      logAndSave(`Step failed: ${event.stepName}`, state),
  };
}

/**
 * Installation action router.
 *
 * Routes:
 * - POST /installation - Start installation (creates plan, invokes execution async)
 * - GET /installation/execution - Get current execution status
 * - POST /installation/execution - Execute installation (internal, called async)
 */
let router = new HttpActionRouter().use(logger({ name: () => "installation" }));

/**
 * GET /installation/execution - Get current execution status
 *
 * Flow:
 * 1. Find execution in state store
 * 2. If found: return execution plan with step statuses
 * 3. If not found: return empty status
 */
router = router.get("/execution", {
  handler: async (_req, { logger }) => {
    logger.debug("Getting installation execution status...");

    const store = await createInstallationStore();
    const state = await store.get("current");

    if (state) {
      logger.debug(`Found execution: ${state.status}`);
      return ok({ body: state });
    }

    // No execution found - return 204 No Content
    logger.debug("No execution found");
    return noContent();
  },
});

/**
 * POST /installation - Start installation
 *
 * Flow:
 * 1. Find execution in state store
 * 2. If found and (pending/in-progress or succeeded): return 409 Conflict
 * 3. If not found or failed: create plan, invoke execution async, return 202 Accepted
 */
router = router.post("/", {
  body: object({
    appCredentials: AppCredentialsSchema,

    commerceBaseUrl: string(),
    commerceEnv: string(),
    ioEventsUrl: string(),
    ioEventsEnv: string(),
  }),

  handler: async (req, { logger, rawParams }) => {
    const appCredentials = req.body.appCredentials;

    logger.debug("Starting installation...");
    const store = await createInstallationStore();
    const existingState = await store.get("current");

    if (existingState) {
      if (isPendingState(existingState) || isInProgressState(existingState)) {
        logger.debug(
          `Installation already in progress: ${existingState.status}`,
        );

        return conflict(
          `Installation is already ${existingState.status}. Wait for it to complete.`,
        );
      }

      if (isSucceededState(existingState)) {
        logger.debug("Installation already succeeded");
        return conflict("Installation has already completed successfully.");
      }

      logger.debug("Previous installation failed, allowing retry");
    }

    const appConfig = (rawParams as ExecutionParams).appConfig;
    if (!appConfig) {
      return internalServerError(
        "Could not find or parse the app.commerce.manifest.json file, is it present and valid?.",
      );
    }

    const initialState = createInitialInstallationState({ config: appConfig });
    logger.debug(`Created initial state: ${initialState.id}`);

    await store.put("current", initialState);
    const ow = openwhisk();

    const activation = await ow.actions.invoke({
      name: DEFAULT_ACTION_NAME,
      blocking: false,
      result: false,

      params: {
        ...rawParams,

        AIO_EVENTS_API_BASE_URL: req.body.ioEventsUrl,
        AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: req.body.ioEventsEnv,
        AIO_COMMERCE_API_BASE_URL: req.body.commerceBaseUrl,
        AIO_COMMERCE_API_FLAVOR: req.body.commerceEnv,

        appCredentials,
        initialState,
        appConfig,

        // Override path to hit the execution endpoint
        __ow_path: "/execution",
        __ow_method: "post",
      },
    });

    logger.debug(`Async execution started: ${activation.activationId}`);
    return accepted({
      body: {
        message: "Installation started",
        activationId: activation.activationId,
        ...initialState,
      },
    });
  },
});

/**
 * POST /installation/execution - Execute installation (internal)
 *
 * This endpoint is called asynchronously by POST /installation.
 * It runs the actual installation workflow and saves state.
 */
router = router.post("/execution", {
  handler: async (_req, { logger, rawParams }) => {
    const params = rawParams as ExecutionParams;
    const { initialState, appConfig } = params;

    if (!initialState) {
      return badRequest("initialState is required for execution");
    }

    if (!appConfig) {
      return badRequest("appConfig is required for execution");
    }

    const store = await createInstallationStore();
    const hooks = createInstallationHooks(store, (msg) => logger.debug(msg));
    const installationContext = {
      params,
      logger,
    };

    logger.debug(`Executing installation: ${initialState.id}`);
    const result = await runInstallation({
      installationContext,
      config: appConfig,
      initialState,
      hooks,
    });

    await store.put("current", result);
    logger.debug(`Installation completed: ${result.status}`);

    if (isFailedState(result)) {
      return internalServerError({
        body: {
          message: "Installation failed",
          error: result.error,
          state: result,
        },
      });
    }

    return ok({ body: result });
  },
});

/** The route handler for the runtime action. */
export const installationRuntimeAction =
  (appConfig: CommerceAppConfigOutputModel) =>
  (params: RuntimeActionParams) => {
    const handler = router.handler();
    return handler({
      ...params,
      appConfig,
    });
  };
