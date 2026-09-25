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

import { migrateLegacyInstallationState } from "#management/deprecated/migration";
import { createInstallationStore } from "#management/deprecated/stores";
import { createRootInstallationStep } from "#management/installation/root";
import { createLifecycleBaselineProvider } from "#management/lifecycle/baseline";
import {
  createAppStateSnapshotStore,
  createOrchestrationStateStore,
} from "#management/lifecycle/storage";

import type { BaseContext } from "@aio-commerce-sdk/common-utils/actions";
import type {
  CommerceAppConfig,
  CommerceAppConfigOutputModel,
} from "#config/schema/app";
import type { LifecycleRequestContext } from "#management/common/schema";
import type {
  InProgressWorkflowState,
  WorkflowData,
} from "#management/common/workflow/types";
import type {
  CustomInstallationSnapshotData,
  CustomInstallationStepIdentity,
} from "#management/domains/custom-installation/index";
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

/** Params for the installation/uninstallation execution routes. */
export type ExecutionRouteParams = WorkflowRouteParams & {
  initialState: InProgressWorkflowState;

  /** Same as {@link getExecutedCustomInstallationSteps}'s return value, passed through from `startUninstallation`. */
  executedCustomInstallationSteps?: CustomInstallationStepIdentity[];
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
 * Reads the persisted custom installation step history from a lifecycle snapshot's data. Returns
 * `[]` when there's no snapshot or none was recorded (e.g. an install from before this feature).
 */
export function getExecutedCustomInstallationSteps(
  data: WorkflowData | null | undefined,
): CustomInstallationStepIdentity[] {
  const snapshot = (
    data as
      | {
          installation?: {
            customInstallationSteps?: {
              reconciliation?: CustomInstallationSnapshotData;
            };
          };
        }
      | null
      | undefined
  )?.installation?.customInstallationSteps?.reconciliation;

  return snapshot?.executedSteps ?? [];
}

/** Creates the shared storage read/write dependencies used by lifecycle orchestration. */
export async function createLifecyclePersistence() {
  const [stateStore, snapshotStore, installationStore] = await Promise.all([
    createOrchestrationStateStore(),
    createAppStateSnapshotStore(),
    createInstallationStore(),
  ]);

  await migrateLegacyInstallationState({
    installationStore,
    snapshotStore,
    stateStore,
  });

  return {
    baselineProvider: createLifecycleBaselineProvider(snapshotStore),
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
    rootStep: createRootInstallationStep(appConfig, { forUpgrade: true }),
  };
}
