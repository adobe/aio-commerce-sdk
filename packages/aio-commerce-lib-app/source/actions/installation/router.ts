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
  runInstallation,
  runUninstallation,
  runValidation,
} from "#management/index";
import { createRootInstallationStep } from "#management/installation/root";
import {
  createLifecycleBaselineProvider,
  getCurrentLifecycleBaseline,
} from "#management/lifecycle/baseline";
import { executeLifecycleAttempt } from "#management/lifecycle/execution";
import { planLifecycle } from "#management/lifecycle/planning";
import { startLifecycleAttempt } from "#management/lifecycle/start";
import { CURRENT_STATE_KEY } from "#management/lifecycle/state";
import {
  createAppStateSnapshotStore,
  createOrchestrationStateStore,
} from "#management/lifecycle/storage";

import {
  InstallationRequestBodySchema,
  UpgradeRequestBodySchema,
} from "./schema";

import type { BaseContext } from "@aio-commerce-sdk/common-utils/actions";
import type { KeyValueStore } from "@aio-commerce-sdk/common-utils/storage";
import type {
  CommerceAppConfig,
  CommerceAppConfigOutputModel,
} from "#config/schema/app";
import type { AppStateSnapshot } from "#management/common/orchestration";
import type { LifecycleRequestContext } from "#management/common/schema";
import type { StepFailedEvent } from "#management/common/workflow/hooks";
import type {
  InProgressWorkflowState,
  WorkflowRunState,
} from "#management/common/workflow/types";
import type { LifecycleContext, ValidationContext } from "#management/index";

// Action name for async invocation
const DEFAULT_ACTION_NAME = "app-management/installation";

/** Loads generated custom installation script modules. */
export type CustomScriptsLoader = (
  config: CommerceAppConfigOutputModel,
  logger: LifecycleContext["logger"],
) => Record<string, unknown>;

/** Arguments for the runtime action factory. */
export type RuntimeActionFactoryArgs = {
  appConfig: CommerceAppConfig;
  customScriptsLoader?: CustomScriptsLoader;
};

/** Params received by all handlers. */
type RuntimeActionArgs = LifecycleContext["params"] & RuntimeActionFactoryArgs;

/** The context for the installation action. */
interface InstallationActionContext extends BaseContext {
  rawParams: RuntimeActionArgs;
}

/** Creates a workflow state store with the given prefix. */
function createWorkflowStore(prefix: string) {
  return createCombinedStore<WorkflowRunState>({
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
 * Shared by lifecycle start and execution routes.
 */
function buildWorkflowParams(
  body: LifecycleRequestContext,
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

type WorkflowRouteParams = RuntimeActionArgs & {
  appData: LifecycleContext["appData"];
};

type ExecutionRouteParams = WorkflowRouteParams & {
  initialState: InProgressWorkflowState;
};

type LifecycleExecutionRouteParams = WorkflowRouteParams & {
  attemptId: string;
};

/**
 * Builds a LifecycleContext from merged workflow params.
 * Shared by installation, uninstallation, and upgrade execution.
 */
function buildInstallationContext(
  params: WorkflowRouteParams,
  appConfig: CommerceAppConfigOutputModel,
  logFn: LifecycleContext["logger"],
): LifecycleContext {
  return {
    appData: params.appData,
    customScripts: params.customScriptsLoader?.(appConfig, logFn) ?? {},
    logger: logFn,
    params,
  };
}

/**
 * Reads state from a store and returns 200 with body or 204.
 * Shared by GET / and GET /uninstallation.
 */
async function readStateFromStore(
  store: KeyValueStore<WorkflowRunState>,
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

/** Creates hooks to sync installation state to storage. */
function createInstallationHooks(
  store: KeyValueStore<WorkflowRunState>,
  logFn: (message: string) => void,
) {
  const logAndSave = async (message: string, data: WorkflowRunState) => {
    logFn(message);
    await store.put(getStorageKey(), data);
  };

  return {
    onInstallationFailure: (state: WorkflowRunState) =>
      logAndSave("Installation failed", state),
    onInstallationStart: (state: WorkflowRunState) =>
      logAndSave("Installation started", state),
    onInstallationSuccess: (state: WorkflowRunState) =>
      logAndSave(
        state.status === "succeeded" && state.metadata?.isRetry
          ? "Installation succeeded on retry"
          : "Installation succeeded",
        state,
      ),
    onStepFailure: (event: StepFailedEvent, state: WorkflowRunState) =>
      logAndSave(
        `Step failed: ${event.stepName} — ${event.error.message ?? `(key: ${event.error.key})`}`,
        state,
      ),
    onStepStart: (event: { stepName: string }, state: WorkflowRunState) =>
      logAndSave(`Step started: ${event.stepName}`, state),
    onStepSuccess: (event: { stepName: string }, state: WorkflowRunState) =>
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
 * - POST /uninstallation             Start uninstallation (creates plan, invokes execution async)
 * - GET /uninstallation              Get current uninstallation status
 * - POST /uninstallation/execution   Execute uninstallation (internal, called async)
 * - DELETE /uninstallation           Clear uninstallation state only (no offboarding)
 * - POST /upgrade                    Plan an upgrade and optionally start it
 * - POST /upgrade/execution          Execute an upgrade (internal, called async)
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
 * POST /installation/upgrade - Plan an upgrade and optionally start it.
 *
 * Creates or reuses the plan for the current deployment. Automatic upgrades
 * persist an attempt and invoke execution asynchronously.
 */
router.post("/upgrade", {
  body: UpgradeRequestBodySchema,

  handler: async (req, { logger, rawParams }) => {
    const actionVersion = process.env.__OW_ACTION_VERSION;
    const rawExecutionDeadline = process.env.__OW_DEADLINE;
    const rawAppConfig = rawParams.appConfig;

    if (!actionVersion) {
      return internalServerError(
        "The OpenWhisk action version is required to plan an upgrade",
      );
    }

    if (!rawAppConfig) {
      return internalServerError(
        "The app config is missing. Does the action receive it as a parameter?",
      );
    }

    const appConfig = validateCommerceAppConfig(rawAppConfig);
    const association = await getAssociationData();

    if (!association) {
      return ok({ body: { reason: "not-associated", skipped: true } });
    }

    const params = {
      ...rawParams,
      AIO_COMMERCE_API_BASE_URL: association.commerce.baseUrl,
      AIO_COMMERCE_API_FLAVOR: association.commerce.env,
      appData: req.body.appData,
    } as WorkflowRouteParams;

    const runtime = await createLifecycleRuntime(params, appConfig, logger);
    const state = await runtime.stateStore.get(CURRENT_STATE_KEY);
    const baseline = await runtime.baselineProvider.get(
      state?.baselineSnapshotId ?? null,
    );

    if (!baseline) {
      return ok({ body: { reason: "not-installed", skipped: true } });
    }

    if (baseline.config.metadata.version === appConfig.metadata.version) {
      return ok({ body: { reason: "already-current", skipped: true } });
    }

    const planning = await planLifecycle({
      ...runtime,
      actionVersion,
      targetAppVersion: appConfig.metadata.version,
      targetConfig: appConfig,
    });

    if (planning.kind === "blocked") {
      return conflict({
        body: {
          issues: planning.plan.issues,
          message: "Upgrade planning is blocked",
        },
      });
    }

    const { upgradeMode } = appConfig.metadata;
    if (upgradeMode === "manual") {
      return ok({ body: { plan: planning.plan } });
    }

    if (!rawExecutionDeadline) {
      return internalServerError(
        "The OpenWhisk action deadline is required to start an upgrade",
      );
    }

    const attempt = await startLifecycleAttempt({
      ...runtime,
      actionVersion,
      executionDeadline: new Date(Number(rawExecutionDeadline)).toISOString(),
      planId: planning.plan.id,
    });

    const activation = await openwhisk().actions.invoke({
      blocking: false,
      name: DEFAULT_ACTION_NAME,

      params: {
        ...params,
        __ow_method: "post",
        __ow_path: "/upgrade/execution",

        attemptId: attempt.id,
      },

      result: false,
    });

    logger.debug(`Async upgrade execution started: ${activation.activationId}`);
    return accepted({ body: { plan: planning.plan } });
  },
});

/**
 * POST /installation/upgrade/execution - Execute an upgrade.
 * @internal - Do not add to OpenAPI Spec.
 */
router.post("/upgrade/execution", {
  handler: async (_req, { logger, rawParams }) => {
    const params = rawParams as LifecycleExecutionRouteParams;
    const { attemptId, appConfig: rawAppConfig } = params;

    if (!attemptId) {
      return badRequest("attemptId is required for upgrade execution");
    }

    if (!rawAppConfig) {
      return badRequest("appConfig is required for upgrade execution");
    }

    const appConfig = validateCommerceAppConfig(rawAppConfig);
    const runtime = await createLifecycleRuntime(params, appConfig, logger);
    const result = await executeLifecycleAttempt({
      attemptId,
      lifecycleContext: runtime.lifecycleContext,
      rootStep: runtime.rootStep,
      snapshotStore: runtime.snapshotStore,
      stateStore: runtime.stateStore,
    });

    logger.debug(`Upgrade completed: ${result.status}`);
    if (result.status === "failed") {
      return internalServerError({
        body: {
          attempt: result,
          failure: result.failure,
          message: "Upgrade failed",
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

    const { baselineProvider, stateStore } = await createLifecyclePersistence();
    const installationSnapshot = await getCurrentLifecycleBaseline(
      stateStore,
      baselineProvider,
    );
    const baselineAppConfig = installationSnapshot?.config;

    const uninstallConfig = baselineAppConfig ?? rawParams.appConfig;
    if (!uninstallConfig) {
      return internalServerError(
        "Cannot determine what to uninstall: no recorded lifecycle baseline and no app config was provided.",
      );
    }

    logger.debug(
      baselineAppConfig
        ? "Sourcing uninstallation from recorded lifecycle baseline"
        : "No recorded lifecycle baseline found; falling back to request config",
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
 * 1. Build LifecycleContext from params
 * 2. Run uninstallation workflow with hooks (hooks persist state per step)
 * 3. Save final state to uninstallation store
 * 4. On success, clear installation store
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
      const [installationStore, orchestrationStateStore] = await Promise.all([
        createInstallationStore(),
        createOrchestrationStateStore(),
      ]);

      await Promise.all([
        installationStore.delete(getStorageKey()),
        orchestrationStateStore.delete(CURRENT_STATE_KEY),
      ]);

      logger.debug(
        "Cleared installation and lifecycle orchestration state after successful uninstallation",
      );
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
async function getInstallationSnapshot(): Promise<AppStateSnapshot | null> {
  const installationStore = await createInstallationStore();
  const installSnapshot = await installationStore.get(getStorageKey());
  if (
    !(
      installSnapshot &&
      isSucceededState(installSnapshot) &&
      installSnapshot.config
    )
  ) {
    return null;
  }

  return {
    config: installSnapshot.config,
    createdAt: installSnapshot.completedAt,
    data: installSnapshot.data,
    id: installSnapshot.id,
  };
}

/** Creates the shared dependencies used by lifecycle orchestration. */
async function createLifecyclePersistence() {
  const [stateStore, snapshotStore] = await Promise.all([
    createOrchestrationStateStore(),
    createAppStateSnapshotStore(),
  ]);

  return {
    baselineProvider: createLifecycleBaselineProvider(snapshotStore, {
      get: getInstallationSnapshot,
    }),

    snapshotStore,
    stateStore,
  };
}

/** Creates the shared dependencies used by lifecycle orchestration. */
async function createLifecycleRuntime(
  params: WorkflowRouteParams,
  appConfig: CommerceAppConfigOutputModel,
  logger: LifecycleContext["logger"],
) {
  return {
    ...(await createLifecyclePersistence()),
    lifecycleContext: buildInstallationContext(params, appConfig, logger),
    rootStep: createRootInstallationStep(appConfig),
  };
}
