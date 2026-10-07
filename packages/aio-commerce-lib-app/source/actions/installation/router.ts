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

import { noContent, ok } from "@adobe/aio-commerce-lib-core/responses";
import {
  HttpActionRouter,
  logger as withLogger,
} from "@aio-commerce-sdk/common-utils/actions";

import { LifecycleRequestContextSchema } from "#management/common/schema";
import {
  createInstallationStore,
  readStateFromStore,
} from "#management/deprecated/stores";
import {
  CURRENT_STATE_KEY,
  normalizeExpiredAttempt,
} from "#management/lifecycle/state";

import {
  createLifecyclePersistence,
  isPostAppDeployInvocation,
} from "./common";
import { executeLifecycle, toAttemptStatus } from "./lifecycle";
import { planRequestedOperation } from "./plan";
import { startPlannedRequest } from "./start";

import type {
  InstallationActionContext,
  LifecycleExecutionRouteParams,
} from "./common";

// Re-exported for the runtime action factory (see ./index.ts).
export type { CustomScriptsLoader, RuntimeActionFactoryArgs } from "./common";

/**
 * Installation action router.
 *
 * Routes:
 * - GET /                            Get the status of the latest lifecycle operation
 * - POST /                           Start the pending plan named by `planId`
 * - POST /plan                       Plan an install, upgrade or uninstall for review
 * - POST /execution                  Execute a started lifecycle attempt (internal, called async)
 */
export const router = new HttpActionRouter<InstallationActionContext>().use(
  withLogger({ name: () => "installation" }),
);

/** Reads the latest lifecycle attempt, or `null` when none has run. */
async function getLatestAttempt() {
  const { stateStore } = await createLifecyclePersistence();
  const state = await stateStore.get(CURRENT_STATE_KEY);
  return state
    ? (await normalizeExpiredAttempt(stateStore, state)).latestAttempt
    : null;
}

/**
 * GET / - Get the status of the latest installation or upgrade. Falls back to the record of an
 * installation made by an older library version.
 */
router.get("/", {
  handler: async (req, { logger }) => {
    const attempt = await getLatestAttempt();
    if (attempt) {
      logger.debug(`Found ${attempt.operation} state: ${attempt.status}`);
      return ok({ body: toAttemptStatus(attempt) });
    }

    if (isPostAppDeployInvocation(req.headers)) {
      logger.debug("No lifecycle attempt found");
      return noContent();
    }

    logger.debug("Getting legacy installation status...");
    const store = await createInstallationStore();
    return readStateFromStore(store, (msg) => logger.debug(msg));
  },
});

/**
 * POST / - Start the pending plan named by `planId`, whatever its operation.
 *
 * Plans it again and starts it asynchronously. The response carries the started attempt's status.
 */
router.post("/", {
  body: LifecycleRequestContextSchema,
  handler: (req, { logger, rawParams }) =>
    startPlannedRequest({ body: req.body, logger, rawParams }),
});

/**
 * POST /plan - Plan a lifecycle operation for review.
 *
 * Plans the install or upgrade the installed state calls for, or an uninstall when the body asks
 * for one. Stores it as the pending plan.
 */
router.post("/plan", {
  body: LifecycleRequestContextSchema,
  handler: (req, { logger, rawParams }) =>
    planRequestedOperation({ body: req.body, logger, rawParams }),
});

/**
 * POST /execution - Execute a started lifecycle attempt.
 * @internal - Do not add to OpenAPI Spec.
 *
 * Called asynchronously when an attempt starts, with the `attemptId` to execute.
 */
router.post("/execution", {
  handler: (_req, { logger, rawParams }) =>
    executeLifecycle({
      logger,
      params: rawParams as LifecycleExecutionRouteParams,
    }),
});
