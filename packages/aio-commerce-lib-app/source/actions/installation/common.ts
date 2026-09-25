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
import { createCombinedStore } from "@aio-commerce-sdk/common-utils/storage";

import { isCompletedState, isSucceededState } from "#management/index";
import { createLifecycleBaselineProvider } from "#management/lifecycle/baseline";
import { createLifecycleRootStep } from "#management/lifecycle/root";
import {
  createAppStateSnapshotStore,
  createOrchestrationStateStore,
} from "#management/lifecycle/storage";

import type { BaseContext } from "@aio-commerce-sdk/common-utils/actions";
import type {
  CommerceAppConfig,
  CommerceAppConfigOutputModel,
} from "#config/schema/app";
import type {
  AppStateSnapshot,
  LifecycleAttempt,
  LifecycleOperation,
} from "#management/common/orchestration";
import type { LifecycleRequestContext } from "#management/common/schema";
import type { WorkflowRunState } from "#management/common/workflow/types";
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

/** Returns whether the request originated from the generated post-deploy hook. */
export function isPostAppDeployInvocation(
  headers: Record<string, string | undefined>,
) {
  return (
    getInstallationInvocationSource(headers) ===
    POST_APP_DEPLOY_INVOCATION_SOURCE
  );
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

/** Params for the lifecycle execution routes. */
export type LifecycleExecutionRouteParams = WorkflowRouteParams & {
  attemptId: string;
  operation: LifecycleOperation;
};

/** Shared inputs for the request handlers that plan work (start/validate). */
export type RequestHandlerArgs = {
  body: LifecycleRequestContext;
  rawParams: RuntimeActionArgs;
  logger: LifecycleContext["logger"];
};

/** Inputs for the async execution handler. */
export type ExecutionHandlerArgs = {
  params: LifecycleExecutionRouteParams;
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
 * Projects an internal lifecycle attempt onto the public workflow run state returned by the
 * status endpoints, so routing through the lifecycle path keeps the legacy response body.
 *
 * @param attempt - The lifecycle attempt to project.
 * @param config - The configuration the attempt ran under, when known.
 * @param completedAtFallback - Completion timestamp recovered from the resulting snapshot.
 */
export function toWorkflowRunState(
  attempt: LifecycleAttempt,
  config?: CommerceAppConfigOutputModel,
  completedAtFallback?: string,
): WorkflowRunState {
  const base = {
    config,
    data: attempt.data,
    id: attempt.id,
    startedAt: attempt.startedAt,
    step: attempt.progress,
  };

  // Older stored attempts record no completion time when failed, so startedAt is the last stable fallback.
  // The field is required for terminal states, so we provide a fallback. Subsequent runs will have a proper completedAt timestamp.
  const fallbackCompletedAt = completedAtFallback ?? attempt.startedAt;
  const terminal = {
    ...base,
    ...(attempt.metadata ? { metadata: attempt.metadata } : {}),
  };

  switch (attempt.status) {
    case "pending":
    case "in-progress":
      return { ...base, status: "in-progress" };
    case "succeeded":
      return {
        ...terminal,
        completedAt: attempt.completedAt ?? fallbackCompletedAt,
        status: "succeeded",
      };
    default:
      return {
        ...terminal,
        completedAt: attempt.completedAt ?? fallbackCompletedAt,
        error: attempt.failure,
        status: "failed",
      };
  }
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
  operation: LifecycleOperation,
) {
  return {
    ...(await createLifecyclePersistence()),
    lifecycleContext: buildLifecycleContext(params, appConfig, logger),
    rootStep: createLifecycleRootStep(appConfig, operation),
  };
}
