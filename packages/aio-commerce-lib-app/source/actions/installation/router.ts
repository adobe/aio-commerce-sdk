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
  notFound,
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
  readNormalizedAttempt,
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

import type { LifecycleAttempt } from "#management/common/orchestration";
import type { StepStatus } from "#management/common/workflow/types";
import type {
  ExecutionRouteParams,
  InstallationActionContext,
  LifecycleExecutionRouteParams,
} from "./common";

// Re-exported for the runtime action factory (see ./index.ts).
export type { CustomScriptsLoader, RuntimeActionFactoryArgs } from "./common";

/** The pollable status view of an attempt returned by `GET /execution/{attemptId}`. */
type AttemptStatusView = {
  id: string;
  status: LifecycleAttempt["status"];
  startedAt: string;
  executionDeadline: string;
  step: StepStatus;
  result?: { appVersion: string; snapshotId: string };
  failure?: { key: string; message?: string; path: (string | number)[] };
};

/**
 * Projects an attempt to its pollable status view. Carries the step-tree
 * `progress` (as `step`) so the Commerce App Management Service can surface
 * per-step progress; the plan and merchant `data` are stripped. Step metadata
 * (labels/descriptions/paths) is authored by the app, never by the merchant.
 */
function toAttemptStatusView(attempt: LifecycleAttempt): AttemptStatusView {
  const view: AttemptStatusView = {
    executionDeadline: attempt.executionDeadline,
    id: attempt.id,
    startedAt: attempt.startedAt,
    status: attempt.status,
    step: attempt.progress,
  };

  if (attempt.status === "succeeded") {
    view.result = {
      appVersion: attempt.result.appVersion,
      snapshotId: attempt.result.snapshotId,
    };
  } else if (attempt.status === "failed") {
    view.failure = {
      key: attempt.failure.key,
      message: attempt.failure.message,
      path: attempt.failure.path,
    };
  }

  return view;
}

/**
 * Installation action router.
 *
 * Routes:
 * - GET /                            Get current installation or upgrade status
 * - GET /execution/:attemptId        Get a single upgrade attempt's pollable status (externally callable)
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
 * GET /execution/:attemptId - Get a single upgrade attempt's pollable status.
 *
 * Externally callable: the Commerce App Management Service polls this while it
 * orchestrates an upgrade. Returns the attempt's `id`, `status`, step-tree
 * `step` (progress), terminal `result`/`failure`, `startedAt`, and
 * `executionDeadline` — the plan and merchant `data` are stripped. Responds 404
 * for an unknown id.
 * An attempt past its deadline is normalized to `failed` (keyed
 * `LIFECYCLE_ATTEMPT_EXPIRED`) so callers key a timeout off `failure.key`.
 */
router.get("/execution/:attemptId", {
  handler: async (req, { logger }) => {
    const { attemptId } = req.params;
    logger.debug(`Getting upgrade attempt status: ${attemptId}`);

    const { attemptStore } = await createLifecyclePersistence();
    const attempt = await readNormalizedAttempt(attemptStore, attemptId);
    if (!attempt) {
      logger.debug(`No upgrade attempt found for id: ${attemptId}`);
      return notFound(`No upgrade attempt was found for id "${attemptId}".`);
    }

    logger.debug(`Found upgrade attempt ${attemptId}: ${attempt.status}`);
    return ok({ body: toAttemptStatusView(attempt) });
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
