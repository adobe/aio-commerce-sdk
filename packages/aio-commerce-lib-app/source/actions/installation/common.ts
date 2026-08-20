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

import { getHeader } from "@adobe/aio-commerce-lib-core/headers";
import { noContent, ok } from "@adobe/aio-commerce-lib-core/responses";
import { createCombinedStore } from "@aio-commerce-sdk/common-utils/storage";

import { isCompletedState, isSucceededState } from "#management/index";
import { createRootInstallationStep } from "#management/installation/root";
import { createLifecycleBaselineProvider } from "#management/lifecycle/baseline";
import {
  createAppStateSnapshotStore,
  createOrchestrationStateStore,
} from "#management/lifecycle/storage";

import type { ActionResponse } from "@adobe/aio-commerce-lib-core/responses";
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
import type { LifecycleContext } from "#management/index";

/** Action name for async invocation. */
export const DEFAULT_ACTION_NAME = "app-management/installation";

/** Header used to identify the source of an installation action request. */
export const INSTALLATION_INVOCATION_SOURCE_HEADER =
  "x-aio-commerce-installation-invocation-source";

/** Invocation source used by the generated post-deploy hook. */
export const POST_APP_DEPLOY_INVOCATION_SOURCE = "post-app-deploy";

/** Returns the declared installation action invocation source, if present. */
export function getInstallationInvocationSource(
  headers: Record<string, string | undefined>,
) {
  return getHeader(headers, INSTALLATION_INVOCATION_SOURCE_HEADER);
}

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
export type RuntimeActionArgs = LifecycleContext["params"] &
  RuntimeActionFactoryArgs;

/** The context for the installation action. */
export interface InstallationActionContext extends BaseContext {
  rawParams: RuntimeActionArgs;
}

/** Params for routes that operate on a resolved lifecycle context. */
export type WorkflowRouteParams = RuntimeActionArgs & {
  appData: LifecycleContext["appData"];
};

/** Params for the installation/uninstallation execution routes. */
export type ExecutionRouteParams = WorkflowRouteParams & {
  initialState: InProgressWorkflowState;
};

/** Params for the upgrade execution route. */
export type LifecycleExecutionRouteParams = WorkflowRouteParams & {
  attemptId: string;
};

/** Shared inputs for the request handlers that plan work (start/validate). */
export type RequestHandlerArgs = {
  body: LifecycleRequestContext;
  rawParams: RuntimeActionArgs;
  logger: LifecycleContext["logger"];
};

/** Inputs for the async execution handlers. */
export type ExecutionHandlerArgs<TParams = ExecutionRouteParams> = {
  params: TParams;
  logger: LifecycleContext["logger"];
};

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
export function createInstallationStore() {
  return createWorkflowStore("installation");
}

/** Creates the uninstallation state store. */
export function createUninstallationStore() {
  return createWorkflowStore("uninstallation");
}

/** Returns the storage key used to store the current installation ID. */
export function getStorageKey() {
  // For simplicity, we use a single key to store the current installation state.
  // In the future we might use the installation ID.
  return "current";
}

/**
 * Merges rawParams with body fields, overriding API URLs.
 * Shared by lifecycle start and execution routes.
 */
export function buildWorkflowParams(
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

/**
 * Builds a LifecycleContext from merged workflow params.
 * Shared by installation, uninstallation, and upgrade execution.
 */
export function buildLifecycleContext(
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
export async function readStateFromStore(
  store: KeyValueStore<WorkflowRunState>,
  logFn: (msg: string) => void,
): Promise<ActionResponse> {
  const state = await store.get(getStorageKey());
  if (state) {
    logFn(`Found state: ${state.status}`);
    return ok({ body: state });
  }
  logFn("No state found");
  return noContent();
}

/** Creates hooks to sync installation state to storage. */
export function createInstallationHooks(
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
 * Returns the completed installation snapshot that recorded its config, or null
 * when none is authoritative (no install, an in-progress install, or a legacy
 * record persisted before the config was recorded).
 */
export async function getInstallationSnapshot(): Promise<AppStateSnapshot | null> {
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

/** Creates the shared storage read/write dependencies used by lifecycle orchestration. */
export async function createLifecyclePersistence() {
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
export async function createLifecycleRuntime(
  params: WorkflowRouteParams,
  appConfig: CommerceAppConfigOutputModel,
  logger: LifecycleContext["logger"],
) {
  return {
    ...(await createLifecyclePersistence()),
    lifecycleContext: buildLifecycleContext(params, appConfig, logger),
    rootStep: createRootInstallationStep(appConfig),
  };
}
