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

import { resolveImsAuthParams } from "@adobe/aio-commerce-lib-auth";
import { getHeader } from "@adobe/aio-commerce-lib-core/headers";
import { conflict } from "@adobe/aio-commerce-lib-core/responses";

import { getAssociationData } from "#management/association/repository";
import { migrateLegacyInstallationState } from "#management/deprecated/migration";
import { createInstallationStore } from "#management/deprecated/stores";
import { createRootInstallationStep } from "#management/installation/root";
import { createLifecycleBaselineProvider } from "#management/lifecycle/baseline";
import {
  createAppStateSnapshotStore,
  createLifecycleAttemptStore,
  createLifecyclePlanStore,
  createOrchestrationStateStore,
} from "#management/lifecycle/storage";

import type { BaseContext } from "@aio-commerce-sdk/common-utils/actions";
import type {
  CommerceAppConfig,
  CommerceAppConfigOutputModel,
} from "#config/schema/app";
import type { LifecycleRequestContext } from "#management/common/schema";
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

/** Params for the lifecycle execution route. */
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
export type ExecutionHandlerArgs<TParams = LifecycleExecutionRouteParams> = {
  params: TParams;
  logger: LifecycleContext["logger"];
};

/**
 * Merges the runtime params with the request body and the Commerce instance the app is
 * associated with. Returns `null` when the app is not associated.
 */
export async function resolveWorkflowParams(
  body: LifecycleRequestContext,
  rawParams: RuntimeActionArgs,
): Promise<WorkflowRouteParams | null> {
  const association = await getAssociationData();
  if (!association) {
    return null;
  }

  return {
    ...rawParams,
    AIO_COMMERCE_API_BASE_URL: association.commerce.baseUrl,
    AIO_COMMERCE_API_FLAVOR: association.commerce.env,
    AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: body.ioEventsEnv,
    AIO_EVENTS_API_BASE_URL: body.ioEventsUrl,
    appData: body.appData,
  };
}

/** The response for a request on an app that is not associated with a Commerce instance. */
export function notAssociatedConflict() {
  return conflict({
    body: {
      message: "The app is not associated with a Commerce instance.",
      reason: "not-associated",
    },
  });
}

/**
 * Returns the deprecated `AIO_COMMERCE_AUTH_IMS_*` params resolved from the
 * given runtime params, or an empty object if no IMS credentials can be resolved.
 */
function getLegacyImsParams(params: Record<string, unknown>) {
  try {
    const {
      clientId,
      clientSecrets,
      imsOrgId,
      scopes,
      technicalAccountEmail,
      technicalAccountId,
    } = resolveImsAuthParams(params);

    return Object.fromEntries(
      Object.entries({
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: clientId,
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: clientSecrets,
        AIO_COMMERCE_AUTH_IMS_ORG_ID: imsOrgId,
        AIO_COMMERCE_AUTH_IMS_SCOPES: scopes,
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: technicalAccountEmail,
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: technicalAccountId,
      }).filter(([, value]) => value !== undefined),
    );
  } catch {
    return {};
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
    appId: appConfig.metadata.id,
    customScripts: params.customScriptsLoader?.(appConfig, logFn) ?? {},
    logger: logFn,

    // Keeps custom scripts that still read the deprecated `AIO_COMMERCE_AUTH_IMS_*`
    // params working when credentials are injected via `include-ims-credentials`.
    params: { ...getLegacyImsParams(params), ...params },
  };
}

/** Creates the shared storage read/write dependencies used by lifecycle orchestration. */
export async function createLifecyclePersistence() {
  const [
    stateStore,
    snapshotStore,
    attemptStore,
    planStore,
    installationStore,
  ] = await Promise.all([
    createOrchestrationStateStore(),
    createAppStateSnapshotStore(),
    createLifecycleAttemptStore(),
    createLifecyclePlanStore(),
    createInstallationStore(),
  ]);

  await migrateLegacyInstallationState({
    installationStore,
    snapshotStore,
    stateStore,
  });

  return {
    attemptStore,
    baselineProvider: createLifecycleBaselineProvider(snapshotStore),
    planStore,
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
