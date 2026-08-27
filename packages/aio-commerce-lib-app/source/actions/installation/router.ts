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
  internalServerError,
  noContent,
  ok,
} from "@adobe/aio-commerce-lib-core/responses";
import {
  HttpActionRouter,
  logger as withLogger,
} from "@aio-commerce-sdk/common-utils/actions";

import { validateCommerceAppConfig } from "#config/lib/validate";
import { LifecycleRequestContextSchema } from "#management/common/schema";
import { getCurrentLifecycleBaseline } from "#management/lifecycle/baseline";
import {
  CURRENT_STATE_KEY,
  normalizeExpiredAttempt,
} from "#management/lifecycle/state";

import {
  createInstallationStore,
  createLifecyclePersistence,
  createUninstallationStore,
  getStorageKey,
  isPostAppDeployInvocation,
  readStateFromStore,
} from "./common";
import {
  executeInstallation,
  startInstallation,
  validateInstallation,
} from "./install";
import { executeUninstallation, startUninstallation } from "./uninstall";
import { executeUpgrade, startUpgrade } from "./upgrade";

import type {
  ExecutionRouteParams,
  InstallationActionContext,
  LifecycleExecutionRouteParams,
} from "./common";

// Re-exported for the runtime action factory (see ./index.ts).
export type { CustomScriptsLoader, RuntimeActionFactoryArgs } from "./common";

/**
 * Installation action router.
 *
 * Routes:
 * - GET /                            Get current installation or upgrade status
 * - POST /                           Reconcile to the target config: install when no baseline exists, otherwise upgrade
 * - POST /execution                  Execute an installation or upgrade (internal, called async)
 * - POST /validation                 Pre-installation validation
 * - POST /uninstallation             Start uninstallation (creates plan, invokes execution async)
 * - GET /uninstallation              Get current uninstallation status
 * - POST /uninstallation/execution   Execute uninstallation (internal, called async)
 * - DELETE /uninstallation           Clear uninstallation state only (no offboarding)
 */
export const router = new HttpActionRouter<InstallationActionContext>().use(
  withLogger({ name: () => "installation" }),
);

/** GET / - Get current installation or upgrade status. */
router.get("/", {
  handler: async (req, { logger }) => {
    const isPostAppDeploy = isPostAppDeployInvocation(req.headers);

    // TODO(CEXT-6556): Unify the GET branches behind one lifecycle flow.
    if (isPostAppDeploy) {
      logger.debug("Getting upgrade execution status...");
      const { stateStore } = await createLifecyclePersistence();
      const state = await stateStore.get(CURRENT_STATE_KEY);
      if (!state?.latestAttempt) {
        logger.debug("No upgrade state found");
        return noContent();
      }

      const normalized = await normalizeExpiredAttempt(stateStore, state);
      const attempt = normalized.latestAttempt;
      if (!attempt) {
        return noContent();
      }

      const { plan: _plan, ...attemptState } = attempt;
      logger.debug(`Found upgrade state: ${attemptState.status}`);
      return ok({ body: attemptState });
    }

    logger.debug("Getting installation execution status...");
    const store = await createInstallationStore();
    return readStateFromStore(store, (msg) => logger.debug(msg));
  },
});

/**
 * POST / - Reconcile the app toward the target configuration.
 *
 * Desired-state endpoint: installs when no lifecycle baseline exists, otherwise
 * upgrades from the baseline to the target config. The chosen branch exposes the
 * derived `operation` in its response.
 */
router.post("/", {
  body: LifecycleRequestContextSchema,
  handler: async (req, { logger, rawParams }) => {
    const rawAppConfig = rawParams.appConfig;
    if (!rawAppConfig) {
      return internalServerError(
        "The app config is missing. Does the action receive it as a parameter?",
      );
    }

    const appConfig = validateCommerceAppConfig(rawAppConfig);
    const { baselineProvider, stateStore } = await createLifecyclePersistence();
    const baseline = await getCurrentLifecycleBaseline(
      stateStore,
      baselineProvider,
    );

    const hasNoBaseline = baseline === null;
    const isPostAppDeploy = isPostAppDeployInvocation(req.headers);

    // TODO(CEXT-6556): Unify the POST branches behind one lifecycle flow.
    if (hasNoBaseline && !isPostAppDeploy) {
      return startInstallation({
        appConfig,
        body: req.body,
        logger,
        rawParams,
      });
    }

    return startUpgrade({
      appConfig,
      baseline,
      body: req.body,
      logger,
      rawParams,
    });
  },
});

/**
 * POST /execution - Execute an installation or upgrade.
 * @internal - Do not add to OpenAPI Spec.
 *
 * Called asynchronously by POST /. Upgrade executions carry an `attemptId`;
 * installation executions carry an `initialState`.
 */
router.post("/execution", {
  handler: (_req, { logger, rawParams }) => {
    const params = rawParams as ExecutionRouteParams &
      Partial<LifecycleExecutionRouteParams>;

    return params.attemptId
      ? executeUpgrade({
          logger,
          params: params as LifecycleExecutionRouteParams,
        })
      : executeInstallation({ logger, params });
  },
});

/** POST /validation - Pre-installation validation. */
router.post("/validation", {
  body: LifecycleRequestContextSchema,
  handler: (req, { logger, rawParams }) =>
    validateInstallation({ body: req.body, logger, rawParams }),
});

/** GET /uninstallation - Get current uninstallation status. */
router.get("/uninstallation", {
  handler: async (_req, { logger }) => {
    logger.debug("Getting uninstallation execution status...");
    const store = await createUninstallationStore();
    return readStateFromStore(store, (msg) => logger.debug(msg));
  },
});

/** POST /uninstallation - Start uninstallation (async). */
router.post("/uninstallation", {
  body: LifecycleRequestContextSchema,
  handler: (req, { logger, rawParams }) =>
    startUninstallation({ body: req.body, logger, rawParams }),
});

/**
 * POST /uninstallation/execution - Execute uninstallation.
 * @internal - Do not add to OpenAPI Spec.
 */
router.post("/uninstallation/execution", {
  handler: (_req, { logger, rawParams }) =>
    executeUninstallation({
      logger,
      params: rawParams as ExecutionRouteParams,
    }),
});

/** DELETE /uninstallation - Clear uninstallation state (no offboarding). */
router.delete("/uninstallation", {
  handler: async (_req, { logger }) => {
    logger.debug("Clearing uninstallation state...");
    const store = await createUninstallationStore();
    await store.delete(getStorageKey());
    logger.debug("Uninstallation state cleared");
    return noContent();
  },
});
