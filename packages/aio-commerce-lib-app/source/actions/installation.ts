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
  createInitialUninstallationState,
  isCompletedState,
  isFailedState,
  isInProgressState,
  isSucceededState,
  runInstallation,
  runUninstallation,
  runValidation,
} from "#management/index";
import { AppDataSchema } from "#management/installation/schema";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type { BaseContext } from "@aio-commerce-sdk/common-utils/actions";
import type { KeyValueStore } from "@aio-commerce-sdk/common-utils/storage";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { InstallationContext, ValidationContext } from "#management/index";
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

/** Arguments for the runtime action factory. */
type RuntimeActionFactoryArgs = {
  appConfig: CommerceAppConfigOutputModel;
  customScriptsLoader?: CustomScriptsLoader;
};

/** Params received by all handlers. */
type RuntimeActionArgs = InstallationContext["params"] &
  RuntimeActionFactoryArgs;

/** The context for the installation action. */
interface InstallationActionContext extends BaseContext {
  rawParams: RuntimeActionArgs;
}

/** Request body schema shared by POST / and POST /validation. */
const InstallationRequestBodySchema = object({
  appData: AppDataSchema,
  commerceBaseUrl: string(),
  commerceEnv: string(),
  ioEventsUrl: string(),
  ioEventsEnv: string(),
});

type WorkflowRequestBody = {
  appData: InstallationContext["appData"];
  commerceBaseUrl: string;
  commerceEnv: string;
  ioEventsUrl: string;
  ioEventsEnv: string;
};

/** Creates a workflow state store with the given prefix. */
function createWorkflowStore(prefix: string) {
  return createCombinedStore<InstallationState>({
    cache: { keyPrefix: prefix },
    persistent: {
      dirPrefix: prefix,
      shouldPersist: isCompletedState,
    },
  });
}

/** Creates the installation state store. */
function createInstallationStore() {
  return createWorkflowStore("installation");
}

/** Creates the uninstallation state store. */
function createUninstallationStore() {
  return createWorkflowStore("uninstallation");
}

/** Returns the storage key used to store the current installation ID. */
function getStorageKey() {
  // For simplicity, we use a single key to store the current installation state.
  // In the future we might use the installation ID.
  return "current";
}

/**
 * Merges rawParams with body fields, overriding API URLs.
 * Shared by POST /, POST /execution, POST /uninstallation, POST /uninstallation/execution.
 */
function buildWorkflowParams(
  body: WorkflowRequestBody,
  rawParams: RuntimeActionArgs,
) {
  return {
    ...rawParams,
    appData: body.appData,
    AIO_EVENTS_API_BASE_URL: body.ioEventsUrl,
    AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: body.ioEventsEnv,
    AIO_COMMERCE_API_BASE_URL: body.commerceBaseUrl,
    AIO_COMMERCE_API_FLAVOR: body.commerceEnv,
  };
}

type ExecutionRouteParams = RuntimeActionArgs & {
  initialState: InProgressInstallationState;
  appData: InstallationContext["appData"];
};

/**
 * Builds an InstallationContext from merged workflow params.
 * Shared by POST /execution and POST /uninstallation/execution.
 */
function buildInstallationContext(
  params: ExecutionRouteParams,
  appConfig: CommerceAppConfigOutputModel,
  logFn: InstallationContext["logger"],
): InstallationContext {
  return {
    appData: params.appData,
    params,
    logger: logFn,
    customScripts: params.customScriptsLoader?.(appConfig, logFn) ?? {},
  };
}

/**
 * Reads state from a store and returns 200 with body or 204.
 * Shared by GET / and GET /uninstallation.
 */
async function readStateFromStore(
  store: KeyValueStore<InstallationState>,
  logFn: (msg: string) => void,
) {
  const state = await store.get(getStorageKey());
  if (state) {
    logFn(`Found state: ${state.status}`);
    return ok({ body: state });
  }
  logFn("No state found");
  return noContent();
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
 * - GET /installation             - Get current installation status
 * - POST /installation            - Start installation (creates plan, invokes execution async)
 * - POST /installation/execution  - Execute installation (internal, called async)
 * - POST /installation/validation - Pre-installation validation
 * - DELETE /installation          - Clear installation state only (no offboarding)
 * - POST /installation/uninstallation           - Start uninstallation (async)
 * - GET /installation/uninstallation            - Get current uninstallation status
 * - POST /installation/uninstallation/execution - Execute uninstallation (internal, called async)
 * - DELETE /installation/uninstallation         - Clear uninstallation state only (no offboarding)
 */
const router = new HttpActionRouter<InstallationActionContext>().use(
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
    return readStateFromStore(store, (msg) => logger.debug(msg));
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
  body: InstallationRequestBodySchema,

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

    const appConfig = rawParams.appConfig;

    if (!appConfig) {
      return internalServerError(
        "Could not find or parse the app.commerce.manifest.json file, is it present and valid?",
      );
    }

    const initialState = createInitialInstallationState({ config: appConfig });
    logger.debug(`Created initial state: ${initialState.id}`);

    await store.put(getStorageKey(), initialState);
    const ow = openwhisk();

    const mergedParams = buildWorkflowParams(req.body, rawParams);

    const activation = await ow.actions.invoke({
      name: DEFAULT_ACTION_NAME,
      blocking: false,
      result: false,

      params: {
        ...mergedParams,

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
    const params = rawParams as ExecutionRouteParams;
    const { initialState, appConfig } = params;

    if (!initialState) {
      return badRequest("initialState is required for execution");
    }

    if (!appConfig) {
      return badRequest("appConfig is required for execution");
    }

    const store = await createInstallationStore();
    const hooks = createInstallationHooks(store, (msg) => logger.debug(msg));
    const installationContext = buildInstallationContext(
      params,
      appConfig,
      logger,
    );

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
 * POST /installation/validation - Pre-installation validation
 *
 * Synchronously validates the step tree before installation begins.
 * Accepts the same request body as POST / (installation start) so the
 * frontend can reuse the same parameters without any extra mapping.
 *
 * Flow:
 * 1. Build a ValidationContext from the request parameters
 * 2. Call runValidation() — traverses the step tree and collects issues
 * 3. Return the structured ValidationResult immediately (no async invoke)
 */
router.post("/validation", {
  body: InstallationRequestBodySchema,

  handler: async (req, { logger, rawParams }) => {
    logger.debug("Running pre-installation validation...");

    const appConfig = rawParams.appConfig;

    if (!appConfig) {
      return internalServerError(
        "Could not find or parse the app.commerce.manifest.json file, is it present and valid?",
      );
    }

    const { appData, ...params } = buildWorkflowParams(
      req.body,
      rawParams as RuntimeActionArgs,
    );

    const validationContext: ValidationContext = {
      appData,
      params,
      logger,
    };

    const result = await runValidation({
      validationContext,
      config: appConfig,
    });

    logger.debug(
      `Validation complete — valid: ${result.valid}, errors: ${result.summary.errors}, warnings: ${result.summary.warnings}`,
    );

    return ok({ body: result });
  },
});

/**
 * GET /uninstallation - Get current uninstallation status
 *
 * Returns 200 with state if an uninstallation has been started, 204 otherwise.
 */
router.get("/uninstallation", {
  handler: async (_req, { logger }) => {
    logger.debug("Getting uninstallation execution status...");
    const store = await createUninstallationStore();
    return readStateFromStore(store, (msg) => logger.debug(msg));
  },
});

/**
 * DELETE / - Clear installation state
 *
 * Removes the stored installation state without triggering any offboarding.
 * Use POST /uninstallation to run the full uninstallation workflow.
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

/**
 * POST /uninstallation - Start uninstallation (async)
 *
 * Flow:
 * 1. Check uninstallation store for existing state
 * 2. If in-progress: return 409 Conflict
 * 3. Create initial uninstall state, save to store
 * 4. Invoke POST /uninstallation/execution async via openwhisk
 * 5. Return 202 Accepted with initial state
 */
router.post("/uninstallation", {
  body: InstallationRequestBodySchema,

  handler: async (req, { logger, rawParams }) => {
    logger.debug("Starting async uninstallation...");

    const appConfig = rawParams.appConfig;

    if (!appConfig) {
      return internalServerError(
        "Could not find or parse the app.commerce.manifest.json file, is it present and valid?",
      );
    }

    const store = await createUninstallationStore();
    const existingState = await store.get(getStorageKey());

    if (existingState && isInProgressState(existingState)) {
      logger.debug(
        `Uninstallation already in progress: ${existingState.status}`,
      );
      return conflict(
        "Uninstallation is already in progress. Wait for it to complete.",
      );
    }

    const initialState = createInitialUninstallationState({
      config: appConfig,
    });
    logger.debug(`Created initial uninstall state: ${initialState.id}`);
    await store.put(getStorageKey(), initialState);

    const workflowParams = buildWorkflowParams(req.body, rawParams);
    const ow = openwhisk();
    const activation = await ow.actions.invoke({
      name: DEFAULT_ACTION_NAME,
      blocking: false,
      result: false,
      params: {
        ...workflowParams,
        initialState,
        appConfig,
        __ow_path: "/uninstallation/execution",
        __ow_method: "post",
      },
    });

    logger.debug(`Async uninstallation started: ${activation.activationId}`);
    return accepted({
      body: {
        message: "Uninstallation started",
        activationId: activation.activationId,
        ...initialState,
      },
    });
  },
});

/**
 * POST /uninstallation/execution - Execute uninstallation (internal, called async by POST /uninstallation)
 *
 * Flow:
 * 1. Build InstallationContext from params
 * 2. Run uninstallation workflow with hooks (hooks persist state per step)
 * 3. Save final state to uninstallation store
 * 4. On success, clear installation store
 * 5. Return 200 on success, 500 on failure
 */
router.post("/uninstallation/execution", {
  handler: async (_req, { logger, rawParams }) => {
    const params = rawParams as ExecutionRouteParams;
    const { initialState, appConfig } = params;

    if (!initialState) {
      return badRequest("initialState is required for execution");
    }

    if (!appConfig) {
      return badRequest("appConfig is required for execution");
    }

    const store = await createUninstallationStore();
    const hooks = createInstallationHooks(store, (msg) => logger.debug(msg));
    const installationContext = buildInstallationContext(
      params,
      appConfig,
      logger,
    );

    logger.debug(`Executing uninstallation: ${initialState.id}`);
    const result = await runUninstallation({
      installationContext,
      config: appConfig,
      initialState,
      hooks,
    });

    await store.put(getStorageKey(), result);
    logger.debug(`Uninstallation completed: ${result.status}`);

    if (isSucceededState(result)) {
      const installationStore = await createInstallationStore();
      await installationStore.delete(getStorageKey());
      logger.debug(
        "Cleared installation state after successful uninstallation",
      );
    }

    if (isFailedState(result)) {
      return internalServerError({
        body: {
          message: "Uninstallation failed",
          error: result.error,
          state: result,
        },
      });
    }

    return ok({ body: result });
  },
});

/**
 * DELETE /uninstallation - Clear uninstallation state
 *
 * Removes the stored uninstallation state without triggering any offboarding.
 */
router.delete("/uninstallation", {
  handler: async (_req, { logger }) => {
    logger.debug("Clearing uninstallation state...");
    const store = await createUninstallationStore();
    await store.delete(getStorageKey());
    logger.debug("Uninstallation state cleared");
    return noContent();
  },
});

/** Factory to create the route handler for the `installation` action. */
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
