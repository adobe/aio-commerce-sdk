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
  logger as withLogger,
} from "@aio-commerce-sdk/common-utils/actions";
import { createCombinedStore } from "@aio-commerce-sdk/common-utils/storage";
import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";
import openwhisk from "openwhisk";

import { validateCommerceAppConfig } from "#config/lib/validate";
import { getAssociationData } from "#management/association/repository";
import {
  createInitialInstallationState,
  createInitialUninstallationState,
  isCompletedState,
  isFailedState,
  isInProgressState,
  isSucceededState,
  runCleanupTeardown,
  runInstallation,
  runUninstallation,
  runUpdate,
  runValidation,
} from "#management/index";
import {
  configHasDestructiveChange,
  diffConfig,
  getOperativeChanges,
  isEmptyPlan,
} from "#management/upgrade/diff";
import { createEmStatusClient } from "#management/upgrade/em-status-client";
import {
  createCleanupStore,
  createPlanStore,
  generatePlanId,
  PLAN_KEY,
} from "#management/upgrade/plan-store";

import {
  InstallationRequestBodySchema,
  UpdateRequestBodySchema,
} from "./schema";

import type { BaseContext } from "@aio-commerce-sdk/common-utils/actions";
import type { KeyValueStore } from "@aio-commerce-sdk/common-utils/storage";
import type {
  CommerceAppConfig,
  CommerceAppConfigOutputModel,
} from "#config/schema/app";
import type { InstallationContext, ValidationContext } from "#management/index";
import type { StepFailedEvent } from "#management/installation/workflow/hooks";
import type {
  FailedInstallationState,
  InProgressInstallationState,
  InstallationState,
  StepStatus,
  SucceededInstallationState,
} from "#management/installation/workflow/types";
import type { WriteUpdateStatusInput } from "#management/upgrade/em-status-client";
import type { UpdatePlan } from "#management/upgrade/types";

// Action name for async invocation
const DEFAULT_ACTION_NAME = "app-management/installation";

/** Loads generated custom installation script modules. */
export type CustomScriptsLoader = (
  config: CommerceAppConfigOutputModel,
  logger: InstallationContext["logger"],
) => Record<string, unknown>;

/** Arguments for the runtime action factory. */
export type RuntimeActionFactoryArgs = {
  appConfig: CommerceAppConfig;
  customScriptsLoader?: CustomScriptsLoader;
};

/** Params received by all handlers. */
type RuntimeActionArgs = InstallationContext["params"] &
  RuntimeActionFactoryArgs;

/** The context for the installation action. */
interface InstallationActionContext extends BaseContext {
  rawParams: RuntimeActionArgs;
}

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

/** Creates the update workflow state store. */
function createUpdateStore() {
  return createWorkflowStore("update");
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
    AIO_COMMERCE_API_BASE_URL: body.commerceBaseUrl,
    AIO_COMMERCE_API_FLAVOR: body.commerceEnv,
    AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: body.ioEventsEnv,
    AIO_EVENTS_API_BASE_URL: body.ioEventsUrl,
    appData: body.appData,
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
    customScripts: params.customScriptsLoader?.(appConfig, logFn) ?? {},
    logger: logFn,
    params,
  };
}

/** True when a stored workflow state represents an operation still running. */
function isBusyState(state: InstallationState | null): boolean {
  return state !== null && isInProgressState(state);
}

/**
 * Recursively marks every step in the tree as succeeded. A top-level
 * `"succeeded"` status implies every step succeeded everywhere else in this
 * workflow (the real execution path sets each step's status as it completes),
 * so a synthesized succeeded state (e.g. the version-only no-op) must uphold
 * the same invariant rather than leaving descendants at their initial status.
 */
function markStepTreeSucceeded(step: StepStatus): StepStatus {
  return {
    ...step,
    children: step.children.map(markStepTreeSucceeded),
    status: "succeeded",
  };
}

/**
 * Best-effort reports an update lifecycle status to the Extension Manager.
 *
 * Skips (with a warning, not a failure) when no `extensionId` is on record for
 * this install — pre-backfill installs have no `extensionId` yet (spec §8.7).
 * An Extension Manager failure never fails the update itself: the §7.3
 * endpoint is an unresolved BLOCKER, hitting a mock in tests and a placeholder
 * URL in prod until the contract lands.
 */
async function reportUpdateStatus(
  rawParams: RuntimeActionArgs,
  logger: InstallationContext["logger"],
  input: Omit<WriteUpdateStatusInput, "extensionId" | "timestamp">,
): Promise<void> {
  const association = await getAssociationData();
  const extensionId = association?.extensionId;

  if (!extensionId) {
    logger.warn(
      `Skipping Extension Manager status write (${input.status}): no extensionId on record for this install.`,
    );
    return;
  }

  try {
    const emClient = createEmStatusClient({ auth: rawParams });
    await emClient.writeUpdateStatus({
      ...input,
      extensionId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.warn(
      `Failed to write update status "${input.status}" to the Extension Manager: ${stringifyError(error)}`,
    );
  }
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
    onInstallationFailure: (state: InstallationState) =>
      logAndSave("Installation failed", state),
    onInstallationStart: (state: InstallationState) =>
      logAndSave("Installation started", state),
    onInstallationSuccess: (state: InstallationState) =>
      logAndSave(
        state.status === "succeeded" && state.metadata?.isRetry
          ? "Installation succeeded on retry"
          : "Installation succeeded",
        state,
      ),
    onStepFailure: (event: StepFailedEvent, state: InstallationState) =>
      logAndSave(
        `Step failed: ${event.stepName} — ${event.error.message ?? `(key: ${event.error.key})`}`,
        state,
      ),

    onStepStart: (event: { stepName: string }, state: InstallationState) =>
      logAndSave(`Step started: ${event.stepName}`, state),
    onStepSuccess: (event: { stepName: string }, state: InstallationState) =>
      logAndSave(`Step succeeded: ${event.stepName}`, state),
  };
}

/**
 * Installation action router.
 *
 * Routes:
 * - GET /                            Get current installation status
 * - POST /                           Start installation (creates plan, invokes execution async)
 * - POST /execution                  Execute installation (internal, called async)
 * - POST /validation                 Pre-installation validation
 * - POST /update/preview             Preview an update plan (computes diff, stores plan)
 * - GET /update                      Get current update workflow status
 * - POST /update                     Apply the stored update plan (consent + staleness guard)
 * - POST /update/execution           Execute update (internal, called async)
 * - POST /uninstallation             Start uninstallation (creates plan, invokes execution async)
 * - GET /uninstallation              Get current uninstallation status
 * - POST /uninstallation/execution   Execute uninstallation (internal, called async)
 * - DELETE /uninstallation           Clear uninstallation state only (no offboarding)
 */
export const router = new HttpActionRouter<InstallationActionContext>().use(
  withLogger({ name: () => "installation" }),
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
    const { appData, commerceBaseUrl } = req.body;
    logger.debug(
      `Starting installation for app "${appData.projectName}" (workspace: "${appData.workspaceName}", commerce: "${commerceBaseUrl}")`,
    );

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

    const rawAppConfig = rawParams.appConfig;

    if (!rawAppConfig) {
      return internalServerError(
        "The app config is missing. Does the action receive it as a parameter?",
      );
    }

    const appConfig = validateCommerceAppConfig(rawAppConfig);
    const initialState = createInitialInstallationState({ config: appConfig });
    logger.debug(`Created initial state: ${initialState.id}`);

    await store.put(getStorageKey(), initialState);
    const ow = openwhisk();

    const mergedParams = buildWorkflowParams(req.body, rawParams);

    const activation = await ow.actions.invoke({
      blocking: false,
      name: DEFAULT_ACTION_NAME,

      params: {
        ...mergedParams,
        __ow_method: "post",

        // Override path to hit the execution endpoint
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
        ...initialState,
      },
    });
  },
});

/**
 * POST /installation/execution - Execute installation
 * @internal - Do not add to OpenAPI Spec.
 *
 * This endpoint is called asynchronously by POST /installation.
 * It runs the actual installation workflow and saves state.
 */
router.post("/execution", {
  handler: async (_req, { logger, rawParams }) => {
    const params = rawParams as ExecutionRouteParams;
    const {
      initialState,
      appConfig: rawAppConfig,
      appData,
      AIO_COMMERCE_API_BASE_URL,
    } = params;

    // biome-ignore lint/suspicious/noUnnecessaryConditions: params is an unchecked `as ExecutionRouteParams` cast over raw runtime action params, so initialState can genuinely be missing at runtime despite the asserted type.
    if (!initialState) {
      return badRequest("initialState is required for execution");
    }

    if (!rawAppConfig) {
      return badRequest("appConfig is required for execution");
    }

    const appConfig = validateCommerceAppConfig(rawAppConfig);
    const store = await createInstallationStore();
    const hooks = createInstallationHooks(store, (msg) => logger.debug(msg));
    const installationContext = buildInstallationContext(
      params,
      appConfig,
      logger,
    );

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

    const rawAppConfig = rawParams.appConfig;

    if (!rawAppConfig) {
      return internalServerError(
        "The app config is missing. Does the action receive it as a parameter?",
      );
    }

    const appConfig = validateCommerceAppConfig(rawAppConfig);
    const { appData, ...params } = buildWorkflowParams(req.body, rawParams);

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
      `Validation complete — valid: ${result.valid}, errors: ${result.summary.errors}, warnings: ${result.summary.warnings}`,
    );

    return ok({ body: result });
  },
});

/**
 * POST /update/preview - Preview an update plan
 *
 * Computes the diff between the recorded installation snapshot and the
 * target config, runs validation against the target config, and stores the
 * resulting plan (overwriting any prior pending plan). Synchronous and does
 * not touch any external (Commerce/IO Events) resources — POST /update
 * (Task 9) is what consumes the stored plan and actually applies it.
 *
 * Flow:
 * 1. Read the installed snapshot config via getInstallationSnapshot()
 * 2. If none recorded: return 409 Conflict (code: "no-baseline")
 * 3. Read the target config from rawParams.appConfig
 * 4. Compute diffConfig(oldConfig, newConfig)
 * 5. Run validation against the target config
 * 6. Store the plan, overwriting any prior pending plan
 * 7. Return 200 { planId, diff, validation }
 */
router.post("/update/preview", {
  body: InstallationRequestBodySchema,

  handler: async (req, { logger, rawParams }) => {
    logger.debug("Previewing update plan...");

    const installationSnapshot = await getInstallationSnapshot();
    const oldConfig = installationSnapshot?.config;

    if (!oldConfig) {
      return conflict({
        body: {
          code: "no-baseline",
          message:
            "No installed snapshot to update from. Install the app before previewing an update.",
        },
      });
    }

    const rawAppConfig = rawParams.appConfig;
    if (!rawAppConfig) {
      return internalServerError(
        "The app config is missing. Does the action receive it as a parameter?",
      );
    }

    const newConfig = validateCommerceAppConfig(rawAppConfig);
    const diff = diffConfig(oldConfig, newConfig);

    const { appData, ...params } = buildWorkflowParams(req.body, rawParams);
    const validationContext: ValidationContext = {
      appData,
      logger,
      params,
    };

    const validation = await runValidation({
      config: newConfig,
      validationContext,
    });

    const planId = generatePlanId();
    const plan: UpdatePlan = {
      createdAt: new Date().toISOString(),
      // Stamp with the installation action's own version (spec §8.4 staleness
      // caveat), not the app-config action's value.
      deploymentVersion: process.env.__OW_ACTION_VERSION ?? "",
      diff,
      planId,
      targetConfig: newConfig,
    };

    const planStore = await createPlanStore();
    await planStore.put(PLAN_KEY, plan);

    logger.debug(
      `Stored update plan ${planId} (${diff.changes.length} change(s))`,
    );

    return ok({ body: { diff, planId, validation } });
  },
});

/**
 * GET /update - Get current update workflow status
 *
 * Returns 200 with state if an update has been started, 204 otherwise.
 */
router.get("/update", {
  handler: async (_req, { logger }) => {
    logger.debug("Getting update execution status...");
    const store = await createUpdateStore();
    return readStateFromStore(store, (msg) => logger.debug(msg));
  },
});

/**
 * POST /update - Apply the stored update plan (async)
 *
 * Flow:
 * 1. Load the stored plan; if none, or `body.planId` doesn't match it, return
 *    409 Conflict (code: "plan-mismatch") — consent guard (spec §8.4).
 * 2. If the live installation-action deployment version no longer matches the
 *    plan's, return 409 Conflict (code: "stale") — staleness guard.
 * 3. If an install, uninstall, or update is already in progress, return 409
 *    Conflict (code: "busy").
 * 4. If the plan has a destructive change, report `UPDATE_REVIEW_REQUIRED` to
 *    the Extension Manager and return 409 Conflict (code: "review-required")
 *    without ever invoking execution (spec §5, §6.1). This guard lives here —
 *    not in POST /update/execution — so a destructive plan never reaches the
 *    self-invoke, matching the other consent/staleness/busy guards above.
 * 5. Seed the cleanup list from the plan's operative (added/removed/changed)
 *    changes (spec §11), create the initial update state, invoke
 *    POST /update/execution async via openwhisk.
 * 6. Return 202 Accepted with the initial state.
 */
router.post("/update", {
  body: UpdateRequestBodySchema,

  handler: async (req, { logger, rawParams }) => {
    const { appData, commerceBaseUrl, planId } = req.body;
    logger.debug(
      `Starting update for app "${appData.projectName}" (workspace: "${appData.workspaceName}", commerce: "${commerceBaseUrl}")`,
    );

    const planStore = await createPlanStore();
    const plan = await planStore.get(PLAN_KEY);

    if (!plan || planId !== plan.planId) {
      logger.debug(
        "Update rejected: planId does not match the current pending plan",
      );
      return conflict({
        body: {
          code: "plan-mismatch",
          message:
            "The provided planId does not match the current pending update plan. Preview the update again before applying it.",
        },
      });
    }

    const liveDeploymentVersion = process.env.__OW_ACTION_VERSION ?? "";
    if (liveDeploymentVersion !== plan.deploymentVersion) {
      logger.debug(
        "Update rejected: the app has been redeployed since this plan was computed",
      );
      return conflict({
        body: {
          code: "stale",
          message:
            "The app has been redeployed since this update plan was computed. Preview the update again before applying it.",
        },
      });
    }

    const installationStore = await createInstallationStore();
    const uninstallationStore = await createUninstallationStore();
    const updateStore = await createUpdateStore();

    const [installationState, uninstallationState, updateState] =
      await Promise.all([
        installationStore.get(getStorageKey()),
        uninstallationStore.get(getStorageKey()),
        updateStore.get(getStorageKey()),
      ]);

    if (
      isBusyState(installationState) ||
      isBusyState(uninstallationState) ||
      isBusyState(updateState)
    ) {
      logger.debug(
        "Update rejected: another install/uninstall/update operation is in progress",
      );
      return conflict({
        body: {
          code: "busy",
          message:
            "Another installation, uninstallation, or update operation is already in progress. Wait for it to complete.",
        },
      });
    }

    if (configHasDestructiveChange(plan.diff)) {
      logger.debug(
        "Update rejected: the plan has a destructive change and requires manual review",
      );

      await reportUpdateStatus(rawParams, logger, {
        deploymentVersion: plan.deploymentVersion,
        status: "UPDATE_REVIEW_REQUIRED",
        version: plan.targetConfig.metadata.version,
      });

      return conflict({
        body: {
          code: "review-required",
          message:
            "This update contains a destructive change and requires manual review before it can be applied.",
        },
      });
    }

    const cleanupStore = await createCleanupStore();
    await cleanupStore.put(PLAN_KEY, {
      entries: getOperativeChanges(plan.diff).map((change) => ({
        domain: change.domain,
        identity: change.identity,
      })),
    });

    const initialState = createInitialInstallationState({
      config: plan.targetConfig,
    });
    logger.debug(`Created initial update state: ${initialState.id}`);
    await updateStore.put(getStorageKey(), initialState);

    const ow = openwhisk();
    const mergedParams = buildWorkflowParams(req.body, rawParams);

    const activation = await ow.actions.invoke({
      blocking: false,
      name: DEFAULT_ACTION_NAME,

      params: {
        ...mergedParams,
        __ow_method: "post",

        // Override path to hit the update execution endpoint
        __ow_path: "/update/execution",

        initialState,
      },
      result: false,
    });

    logger.debug(`Async update started: ${activation.activationId}`);
    return accepted({
      body: {
        activationId: activation.activationId,
        message: "Update started",
        ...initialState,
      },
    });
  },
});

/**
 * POST /update/execution - Execute the stored update plan
 * @internal - Do not add to OpenAPI Spec.
 *
 * This endpoint is called asynchronously by POST /update. It loads the
 * stored plan (executed verbatim, spec §8.4), runs the update workflow, and
 * persists state. On success it advances the recorded installation snapshot
 * to `plan.targetConfig` and clears the plan + cleanup stores.
 *
 * Version-only/no-op (spec §6.3): when the plan's diff has no operative
 * changes AND the cleanup list has no pending entries, no external calls are
 * made (runUpdate's reconcile is skipped) — the snapshot is still advanced
 * and the stores are still cleared.
 *
 * Reports lifecycle status to the Extension Manager (spec §5, §6.2):
 * `UPDATING` right before the reconcile decision, then `INSTALLED` (with
 * `version` + `deploymentVersion`) or `UPDATE_FAILED` (with the error) on the
 * terminal outcome. Every write is best-effort — skipped with a warning when
 * no `extensionId` is on record, and never allowed to fail the update itself.
 */
router.post("/update/execution", {
  handler: async (_req, { logger, rawParams }) => {
    const params = rawParams as ExecutionRouteParams;
    const { initialState, appData, AIO_COMMERCE_API_BASE_URL } = params;

    // biome-ignore lint/suspicious/noUnnecessaryConditions: params is an unchecked `as ExecutionRouteParams` cast over raw runtime action params, so initialState can genuinely be missing at runtime despite the asserted type.
    if (!initialState) {
      return badRequest("initialState is required for execution");
    }

    const planStore = await createPlanStore();
    const plan = await planStore.get(PLAN_KEY);

    if (!plan) {
      return internalServerError(
        "No stored update plan found for this execution",
      );
    }

    const store = await createUpdateStore();
    const hooks = createInstallationHooks(store, (msg) => logger.debug(msg));
    const installationContext = buildInstallationContext(
      params,
      plan.targetConfig,
      logger,
    );

    logger.debug(
      `Executing update ${initialState.id} for app "${appData.projectName}" (workspace: "${appData.workspaceName}", commerce: "${AIO_COMMERCE_API_BASE_URL}")`,
    );

    const cleanupStore = await createCleanupStore();
    const cleanupList = await cleanupStore.get(PLAN_KEY);
    const hasPendingCleanup = Boolean(
      cleanupList && cleanupList.entries.length > 0,
    );
    const isVersionOnly = isEmptyPlan(plan.diff) && !hasPendingCleanup;

    await reportUpdateStatus(rawParams, logger, {
      deploymentVersion: plan.deploymentVersion,
      status: "UPDATING",
      version: plan.targetConfig.metadata.version,
    });

    let result: SucceededInstallationState | FailedInstallationState;
    if (isVersionOnly) {
      logger.debug(
        "Update plan is version-only (no operative changes); skipping reconcile",
      );
      result = {
        ...initialState,
        completedAt: new Date().toISOString(),
        status: "succeeded",
        step: markStepTreeSucceeded(initialState.step),
      };
    } else {
      result = await runUpdate({
        config: plan.targetConfig,
        hooks,
        initialState,
        installationContext,
        plan,
      });
    }

    await store.put(getStorageKey(), result);
    logger.debug(`Update completed: ${result.status}`);

    if (isSucceededState(result)) {
      const installationStore = await createInstallationStore();
      await installationStore.put(getStorageKey(), {
        ...result,
        config: plan.targetConfig,
      });

      await planStore.delete(PLAN_KEY);
      await cleanupStore.delete(PLAN_KEY);
      logger.debug(
        "Advanced installation snapshot to the plan's target config; cleared plan and cleanup stores",
      );

      await reportUpdateStatus(rawParams, logger, {
        deploymentVersion: plan.deploymentVersion,
        status: "INSTALLED",
        version: plan.targetConfig.metadata.version,
      });
    }

    if (isFailedState(result)) {
      await reportUpdateStatus(rawParams, logger, {
        deploymentVersion: plan.deploymentVersion,
        error: { message: result.error.message ?? result.error.key },
        status: "UPDATE_FAILED",
        version: plan.targetConfig.metadata.version,
      });

      return internalServerError({
        body: {
          error: result.error,
          message: "Update failed",
          state: result,
        },
      });
    }

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
    const { appData, commerceBaseUrl } = req.body;
    logger.debug(
      `Starting uninstallation for app "${appData.projectName}" (workspace: "${appData.workspaceName}", commerce: "${commerceBaseUrl}")`,
    );

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

    const installationSnapshot = await getInstallationSnapshot();
    const installAppConfig = installationSnapshot?.config;

    const uninstallConfig = installAppConfig ?? rawParams.appConfig;
    if (!uninstallConfig) {
      return internalServerError(
        "Cannot determine what to uninstall: no recorded installation snapshot and no app config was provided.",
      );
    }

    logger.debug(
      installAppConfig
        ? "Sourcing uninstallation from recorded install snapshot"
        : "No recorded install config found; falling back to request config",
    );

    const initialState = createInitialUninstallationState({
      config: validateCommerceAppConfig(uninstallConfig),
    });
    logger.debug(`Created initial uninstall state: ${initialState.id}`);
    await store.put(getStorageKey(), initialState);

    const workflowParams = buildWorkflowParams(req.body, rawParams);
    const ow = openwhisk();
    const activation = await ow.actions.invoke({
      blocking: false,
      name: DEFAULT_ACTION_NAME,
      params: {
        ...workflowParams,
        __ow_method: "post",
        __ow_path: "/uninstallation/execution",
        appConfig: uninstallConfig,
        initialState,
      },
      result: false,
    });

    logger.debug(`Async uninstallation started: ${activation.activationId}`);
    return accepted({
      body: {
        activationId: activation.activationId,
        message: "Uninstallation started",
        ...initialState,
      },
    });
  },
});

/**
 * POST /uninstallation/execution - Execute uninstallation
 * @internal - Do not add to OpenAPI Spec.
 *
 * Flow:
 * 1. Build InstallationContext from params
 * 2. Run uninstallation workflow with hooks (hooks persist state per step)
 * 3. Save final state to uninstallation store
 * 4. On success: clear the installation store, then best-effort tear down any cleanup-list
 *    entries a failed in-flight update left behind that the baseline walk didn't already
 *    cover (spec §11) and clear the cleanup store. Teardown is wrapped so it can never turn
 *    an already-completed uninstall into a 500 — a failure there just leaves the cleanup
 *    store in place for a future retry. A failed uninstall also leaves the cleanup list in
 *    place.
 * 5. Return 200 on success, 500 on failure
 */
router.post("/uninstallation/execution", {
  handler: async (_req, { logger, rawParams }) => {
    const params = rawParams as ExecutionRouteParams;
    const {
      initialState,
      appConfig: rawAppConfig,
      appData,
      AIO_COMMERCE_API_BASE_URL,
    } = params;

    // biome-ignore lint/suspicious/noUnnecessaryConditions: params is an unchecked `as ExecutionRouteParams` cast over raw runtime action params, so initialState can genuinely be missing at runtime despite the asserted type.
    if (!initialState) {
      return badRequest("initialState is required for execution");
    }

    if (!rawAppConfig) {
      return badRequest("appConfig is required for execution");
    }

    const appConfig = validateCommerceAppConfig(rawAppConfig);
    const store = await createUninstallationStore();
    const hooks = createInstallationHooks(store, (msg) => logger.debug(msg));
    const installationContext = buildInstallationContext(
      params,
      appConfig,
      logger,
    );

    logger.debug(
      `Executing uninstallation ${initialState.id} for app "${appData.projectName}" (workspace: "${appData.workspaceName}", commerce: "${AIO_COMMERCE_API_BASE_URL}")`,
    );
    const result = await runUninstallation({
      config: appConfig,
      hooks,
      initialState,
      installationContext,
    });

    await store.put(getStorageKey(), result);
    logger.debug(`Uninstallation completed: ${result.status}`);

    if (isSucceededState(result)) {
      const installationStore = await createInstallationStore();
      await installationStore.delete(getStorageKey());

      // Cleanup-list teardown is best-effort: the uninstall has already succeeded (state
      // persisted, installation store cleared) by this point, so a throw from the glue
      // around the per-domain deletes (store reads, diffConfig, execution-context/client
      // construction) must not turn an already-completed uninstall into a 500. Leaving the
      // cleanup store uncleared on such a failure is fine — it's retried on the next
      // uninstall.
      try {
        await runCleanupTeardown(appConfig, installationContext);
        const cleanupStore = await createCleanupStore();
        await cleanupStore.delete(PLAN_KEY);

        logger.debug(
          "Cleared installation state after successful uninstallation; tore down any pending cleanup-list entries and cleared the cleanup store",
        );
      } catch (error) {
        logger.warn(
          `Cleanup-list teardown failed after a successful uninstallation: ${stringifyError(error)}. Cleanup store left in place for a future retry.`,
        );
      }
    }

    if (isFailedState(result)) {
      return internalServerError({
        body: {
          error: result.error,
          message: "Uninstallation failed",
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

/**
 * Returns the completed installation snapshot that recorded its config, or null
 * when none is authoritative (no install, an in-progress install, or a legacy
 * record persisted before the config was recorded).
 */
async function getInstallationSnapshot() {
  const installationStore = await createInstallationStore();
  const installSnapshot = await installationStore.get(getStorageKey());
  return installSnapshot &&
    isCompletedState(installSnapshot) &&
    installSnapshot.config
    ? installSnapshot
    : null;
}
