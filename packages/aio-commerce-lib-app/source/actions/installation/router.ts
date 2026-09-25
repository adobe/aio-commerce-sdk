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
  HttpActionRouter,
  logger as withLogger,
} from "@aio-commerce-sdk/common-utils/actions";

import { LifecycleRequestContextSchema } from "#management/common/schema";

import { isPostAppDeployInvocation } from "./common";
import { executeLifecycleChange } from "./lifecycle";
import { startInstallation, startUninstallation } from "./start";
import {
  clearUninstallationState,
  getInstallationStatus,
  getUninstallationStatus,
} from "./status";
import { validateInstallation } from "./validation";

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
  handler: (req, { logger }) =>
    getInstallationStatus({
      logger,
      postDeploy: isPostAppDeployInvocation(req.headers),
    }),
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
  handler: (req, { logger, rawParams }) =>
    startInstallation({
      body: req.body,
      logger,
      postDeploy: isPostAppDeployInvocation(req.headers),
      rawParams,
    }),
});

/** Executes the lifecycle attempt dispatched by POST / or POST /uninstallation. */
const executeLifecycleRoute: Parameters<typeof router.post>[1] = {
  handler: (_req, { logger, rawParams }) =>
    executeLifecycleChange({
      logger,
      params: rawParams as LifecycleExecutionRouteParams,
    }),
};

/**
 * POST /execution - Execute a lifecycle attempt.
 * @internal - Do not add to OpenAPI Spec.
 *
 * Called asynchronously by POST / and POST /uninstallation once a plan is accepted for execution.
 */
router.post("/execution", executeLifecycleRoute);

/** POST /validation - Pre-installation validation. */
router.post("/validation", {
  body: LifecycleRequestContextSchema,
  handler: (req, { logger, rawParams }) =>
    validateInstallation({ body: req.body, logger, rawParams }),
});

/** GET /uninstallation - Get current uninstallation status. */
router.get("/uninstallation", {
  handler: (_req, { logger }) => getUninstallationStatus({ logger }),
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
 *
 * Kept for uninstall executions dispatched before they moved to POST /execution.
 */
router.post("/uninstallation/execution", executeLifecycleRoute);

/** DELETE /uninstallation - Clear uninstallation state (no offboarding). */
router.delete("/uninstallation", {
  handler: (_req, { logger }) => clearUninstallationState({ logger }),
});
