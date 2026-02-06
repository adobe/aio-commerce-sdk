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

import { HttpActionRouter, logger } from "@adobe/aio-commerce-lib-core/actions";
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
  createLibStateStore,
  isFailedState,
  runInstallation,
} from "#management/index";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type {
  InstallationState,
  InstallationStateStore,
  PendingInstallationState,
} from "#management/installation/workflow/types";

// TTL for installation state (10 minutes in seconds)
const INSTALLATION_TTL_SECONDS = 10 * 60;

// Action name for async invocation
const DEFAULT_ACTION_NAME = "app-management/installation";

/** Type for params with manifest and internal flags */
type InstallationParams = RuntimeActionParams & {
  manifest?: unknown;
  initialState?: PendingInstallationState;
};

/**
 * Creates hooks to sync installation state to lib-state.
 */
function createInstallationHooks(
  store: InstallationStateStore,
  logFn: (message: string) => void,
) {
  const logAndSave = async (message: string, data: InstallationState) => {
    logFn(message);
    await store.save(data);
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
router.get("/installation/execution", {
  handler: async (_req, { logger }) => {
    logger.debug("Getting installation execution status...");

    const store = await createLibStateStore({
      ttlSeconds: INSTALLATION_TTL_SECONDS,
    });

    const state = await store.get("current");
    if (state) {
      logger.debug(`Found execution: ${state.status}`);
      return ok({ body: { state } });
    }

    // No execution found - return empty status
    logger.debug("No execution found");
    return ok({
      body: {
        status: "not_started",
        message: "No installation has been started",
      },
    });
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
router.post("/installation", {
  handler: async (_req, { logger, rawParams }) => {
    logger.debug("Starting installation...");
    const store = await createLibStateStore({
      ttlSeconds: INSTALLATION_TTL_SECONDS,
    });

    const existingState = await store.get("current");
    if (existingState) {
      // If pending or in-progress, return conflict
      if (
        existingState.status === "pending" ||
        existingState.status === "in-progress"
      ) {
        logger.debug(
          `Installation already in progress: ${existingState.status}`,
        );

        return conflict(
          `Installation is already ${existingState.status}. Wait for it to complete.`,
        );
      }

      // If succeeded, return conflict
      if (existingState.status === "succeeded") {
        logger.debug("Installation already succeeded");
        return conflict("Installation has already completed successfully.");
      }

      // If failed, allow retry - continue to create new plan
      logger.debug("Previous installation failed, allowing retry");
    }

    // The manifest should be passed in params or loaded from a known location
    const { manifest } = rawParams;
    if (!manifest) {
      return badRequest("manifest is required in params");
    }

    const appConfig = validateCommerceAppConfig(manifest);
    const initialState = createInitialInstallationState({ config: appConfig });
    logger.debug(`Created initial state: ${initialState.installationId}`);

    await store.save({ ...initialState, installationId: "current" });
    const ow = openwhisk();

    const activation = await ow.actions.invoke({
      name: DEFAULT_ACTION_NAME,
      blocking: false,
      result: false,

      params: {
        ...rawParams,
        initialState,

        // Override path to hit the execution endpoint
        __ow_path: "/installation/execution",
        __ow_method: "post",
      },
    });

    logger.debug(`Async execution started: ${activation.activationId}`);
    return accepted({
      body: {
        message: "Installation started",
        installationId: initialState.installationId,
        activationId: activation.activationId,
        state: initialState,
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
router.post("/installation/execution", {
  handler: async (_req, { logger, rawParams }) => {
    const { initialState, manifest } = rawParams as InstallationParams;

    if (!initialState) {
      return badRequest("initialState is required for execution");
    }

    if (!manifest) {
      return badRequest("manifest is required for execution");
    }

    logger.debug(`Executing installation: ${initialState.installationId}`);

    const appConfig = validateCommerceAppConfig(manifest);
    const store = await createLibStateStore({
      ttlSeconds: INSTALLATION_TTL_SECONDS,
    });

    const hooks = createInstallationHooks(store, (msg) => logger.debug(msg));

    const installationContext = {
      params: rawParams as Record<string, unknown>,
      logger,
    };

    const result = await runInstallation({
      installationContext,
      config: appConfig,
      initialState,
      hooks,
    });

    // Save final state with "current" key for status lookups
    await store.save({ ...result, installationId: "current" });
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

/** Export the router handler for Adobe I/O Runtime */
export const main = router.handler();
