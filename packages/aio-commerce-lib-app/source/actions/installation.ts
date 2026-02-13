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
  isSucceededState,
  runInstallation,
} from "#management/index";
import { AppDataSchema } from "#management/installation/schema";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type { KeyValueStore } from "@aio-commerce-sdk/common-utils/storage";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { InstallationContext } from "#management/index";
import type {
  InProgressInstallationState,
  InstallationState,
} from "#management/installation/workflow/types";

// Action name for async invocation
const DEFAULT_ACTION_NAME = "app-management/installation";

type CustomScriptsLoader = (
  config: CommerceAppConfigOutputModel,
  logger: InstallationContext["logger"],
) => Record<string, unknown>;

type RuntimeActionFactoryArgs = {
  appConfig: CommerceAppConfigOutputModel;
  customScriptsLoader?: CustomScriptsLoader;
};

/** Params received by all handlers. */
type RuntimeActionArgs = InstallationContext["params"] &
  RuntimeActionFactoryArgs;

/** Creates an installation state store using lib-core combined storage. */
function createInstallationStore() {
  return createCombinedStore<InstallationState>({
    cache: { keyPrefix: "installation" },
    persistent: {
      dirPrefix: "installation",
      shouldPersist: isCompletedState,
    },
  });
}

/** Returns the storage key used to store the current installation ID. */
function getStorageKey() {
  // For simplicity, we use a single key to store the current installation state.
  // In the future we might use the installation ID.
  return "current";
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
    await store.put(getStorageKey(), data);
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
const router = new HttpActionRouter().use(
  logger({ name: () => "installation" }),
);

/**
 * GET /installation/execution - Get current execution status
 *
 * Flow:
 * 1. Find execution in state store
 * 2. If found: return execution plan with step statuses
 * 3. If not found: return empty status
 */
router.get("/", {
  handler: async (_req, { logger }) => {
    logger.debug("Getting installation execution status...");

    const store = await createInstallationStore();
    const state = await store.get(getStorageKey());

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
 * POST / - Start installation
 *
 * Flow:
 * 1. Find execution in state store
 * 2. If found and (pending/in-progress or succeeded): return 409 Conflict
 * 3. If not found or failed: create plan, invoke execution async, return 202 Accepted
 */
router.post("/", {
  body: object({
    appData: AppDataSchema,
    commerceBaseUrl: string(),
    commerceEnv: string(),
    ioEventsUrl: string(),
    ioEventsEnv: string(),
  }),

  handler: async (req, { logger, rawParams }) => {
    logger.debug("Starting installation...");

    const store = await createInstallationStore();
    const existingState = await store.get(getStorageKey());

    if (existingState) {
      if (isInProgressState(existingState)) {
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

    const executionParams = rawParams as RuntimeActionArgs;
    const appConfig = executionParams.appConfig;

    if (!appConfig) {
      return internalServerError(
        "Could not find or parse the app.commerce.manifest.json file, is it present and valid?",
      );
    }

    const initialState = createInitialInstallationState({ config: appConfig });
    logger.debug(`Created initial state: ${initialState.id}`);

    await store.put(getStorageKey(), initialState);
    const ow = openwhisk();

    const activation = await ow.actions.invoke({
      name: DEFAULT_ACTION_NAME,
      blocking: false,
      result: false,

      params: {
        ...rawParams,

        appData: req.body.appData,
        AIO_EVENTS_API_BASE_URL: req.body.ioEventsUrl,
        AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: req.body.ioEventsEnv,
        AIO_COMMERCE_API_BASE_URL: req.body.commerceBaseUrl,
        AIO_COMMERCE_API_FLAVOR: req.body.commerceEnv,

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
router.post("/execution", {
  handler: async (_req, { logger, rawParams }) => {
    const { appData, ...params } = rawParams as RuntimeActionArgs & {
      initialState: InProgressInstallationState;
      appData: InstallationContext["appData"];
    };

    const { initialState, appConfig } = params;

    if (!initialState) {
      return badRequest("initialState is required for execution");
    }

    if (!appConfig) {
      return badRequest("appConfig is required for execution");
    }

    const store = await createInstallationStore();
    const hooks = createInstallationHooks(store, (msg) => logger.debug(msg));
    const installationContext: InstallationContext = {
      appData,
      params,
      logger,
      customScripts: params.customScriptsLoader?.(appConfig, logger) || {},
    };

    logger.debug(`Executing installation: ${initialState.id}`);
    const result = await runInstallation({
      installationContext,
      config: appConfig,
      initialState,
      hooks,
    });

    await store.put(getStorageKey(), result);
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

/**
 * DELETE / - Clear installation state
 *
 * This endpoint allows clearing the installation state.
 */
router.delete("/", {
  handler: async (_req, { logger }) => {
    logger.debug("Clearing installation state...");

    const store = await createInstallationStore();
    await store.delete(getStorageKey());
    logger.debug("Installation state cleared");

    return noContent();
  },
});

/** The route handler for the runtime action. */
export const installationRuntimeAction =
  ({ appConfig, customScriptsLoader }: RuntimeActionFactoryArgs) =>
  async (params: RuntimeActionParams) => {
    const handler = router.handler();
    return await handler({
      ...params,
      appConfig,
      customScriptsLoader,
    });
  };
