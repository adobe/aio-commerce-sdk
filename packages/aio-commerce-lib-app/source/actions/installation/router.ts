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

import { executeLifecycle } from "./lifecycle";
import { startLifecycle } from "./start";
import { getLifecycleStatus, getUninstallationStatus } from "./status";
import {
  clearUninstallationState,
  executeUninstallation,
  startUninstallation,
} from "./uninstall";
import { validateInstallation } from "./validation";

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
 * - GET /                            Get the current lifecycle attempt status
 * - POST /                           Reconcile to the target config: install when no baseline exists, otherwise upgrade
 * - POST /execution                  Execute a lifecycle attempt (internal, called async)
 * - POST /validation                 Pre-installation validation
 * - POST /uninstallation             Start uninstallation (creates plan, invokes execution async)
 * - GET /uninstallation              Get current uninstallation status
 * - POST /uninstallation/execution   Execute uninstallation (internal, called async)
 * - DELETE /uninstallation           Clear uninstallation state only (no offboarding)
 */
export const router = new HttpActionRouter<InstallationActionContext>().use(
  withLogger({ name: () => "installation" }),
);

/** GET / - Get the current lifecycle attempt status. */
router.get("/", {
  handler: (_req, { logger }) => getLifecycleStatus(logger),
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
    startLifecycle({
      body: req.body,
      headers: req.headers,
      logger,
      rawParams,
    }),
});

/**
 * POST /execution - Execute a lifecycle attempt.
 * @internal - Do not add to OpenAPI Spec.
 *
 * Called asynchronously by POST /.
 */
router.post("/execution", {
  handler: (_req, { logger, rawParams }) =>
    executeLifecycle({
      logger,
      params: rawParams as LifecycleExecutionRouteParams,
    }),
});

/** POST /validation - Pre-installation validation. */
router.post("/validation", {
  body: LifecycleRequestContextSchema,
  handler: (req, { logger, rawParams }) =>
    validateInstallation({ body: req.body, logger, rawParams }),
});

/** GET /uninstallation - Get current uninstallation status. */
router.get("/uninstallation", {
  handler: (_req, { logger }) => getUninstallationStatus(logger),
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
  handler: (_req, { logger }) => clearUninstallationState(logger),
});
