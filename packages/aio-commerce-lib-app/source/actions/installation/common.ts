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
import { conflict } from "@adobe/aio-commerce-lib-core/responses";

import { getAssociationData } from "#management/association/repository";
import { getAtPath } from "#management/common/workflow/utils";
import { migrateLegacyInstallationState } from "#management/deprecated/migration";
import { createInstallationStore } from "#management/deprecated/stores";
import { readRunHistory } from "#management/domains/custom-installation/index";
import { createRootInstallationStep } from "#management/installation/root";
import { createLifecycleBaselineProvider } from "#management/lifecycle/baseline";
import { CURRENT_STATE_KEY } from "#management/lifecycle/state";
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
import type { AssociatedCommerceData } from "#management/association/types";
import type {
  AppStateSnapshot,
  LifecycleOperation,
  OrchestrationState,
} from "#management/common/orchestration";
import type { LifecycleRequestContext } from "#management/common/schema";
import type { CustomInstallationStepIdentity } from "#management/domains/custom-installation/index";
import type { LifecycleContext } from "#management/index";

/** Action name for async invocation. */
export const DEFAULT_ACTION_NAME = "app-management/installation";

/** Path of the custom installation steps' data in the lifecycle data. */
export const CUSTOM_INSTALLATION_STEPS_PATH = [
  "installation",
  "customInstallationSteps",
];

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

/** The params of a lifecycle request, and the Commerce instance the request supplied for an app with no record. */
export type ResolvedWorkflowParams = {
  params: WorkflowRouteParams;

  /** The Commerce instance taken from the request body because the app has no record, or `null`. */
  commerceFromBody: AssociatedCommerceData | null;
};

/**
 * Merges the runtime params with the request body and the Commerce instance the app is
 * associated with. Returns `null` when the app has no Commerce instance to use.
 *
 * An uninstall without an association record uses the Commerce instance of the request body and
 * returns it as `commerceFromBody`. Any other operation needs the record.
 */
export async function resolveWorkflowParams(
  body: LifecycleRequestContext,
  rawParams: RuntimeActionArgs,
  operation?: LifecycleOperation,
): Promise<ResolvedWorkflowParams | null> {
  const association = await getAssociationData();

  // The record wins. An app installed before the association action existed has no record, and
  // its uninstall must still work, so the request body stands in for it. Any other operation
  // keeps requiring the record, because the checks after it would plan an install over an
  // installed app that has no baseline.
  const commerceFromBody =
    !association && operation === "uninstall" ? getBodyCommerce(body) : null;

  const commerce = association?.commerce ?? commerceFromBody;
  if (!commerce) {
    return null;
  }

  return {
    commerceFromBody,
    params: {
      ...rawParams,
      AIO_COMMERCE_API_BASE_URL: commerce.baseUrl,
      AIO_COMMERCE_API_FLAVOR: commerce.env,
      AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: body.ioEventsEnv,
      AIO_EVENTS_API_BASE_URL: body.ioEventsUrl,
      appData: body.appData,
    },
  };
}

/** The Commerce instance the request body names, or `null` when it lacks the URL or the env. */
function getBodyCommerce(body: LifecycleRequestContext) {
  const { commerceBaseUrl, commerceEnv } = body;
  return commerceBaseUrl && commerceEnv
    ? { baseUrl: commerceBaseUrl, env: commerceEnv }
    : null;
}

/** The response for a request on an app that is not associated with a Commerce instance. */
export function notAssociatedConflict() {
  return conflict({
    body: {
      code: "not-associated",
      message: "The app is not associated with a Commerce instance.",
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

/**
 * Reads which custom installation steps ran from the data of the latest attempt when it did not
 * succeed, or from the baseline snapshot otherwise. Returns `null` when neither is stored.
 */
export function getExecutedCustomInstallationSteps(
  state: OrchestrationState | null,
  baseline: AppStateSnapshot | null,
): CustomInstallationStepIdentity[] | null {
  const attempt = state?.latestAttempt;
  if (!(attempt || baseline)) {
    return null;
  }

  // Steps that ran in an attempt that did not succeed are only in its data, not in the baseline.
  const data =
    attempt && attempt.status !== "succeeded" ? attempt.data : baseline?.data;

  return readRunHistory(
    getAtPath(data ?? {}, CUSTOM_INSTALLATION_STEPS_PATH),
    baseline?.config ?? null,
  );
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

/**
 * Creates the shared dependencies used by lifecycle orchestration. The step tree includes the
 * custom installation steps that ran, read from the stored state, and a new attempt keeps the
 * custom installation steps' data of a failed latest attempt.
 */
export async function createLifecycleRuntime(
  params: WorkflowRouteParams,
  appConfig: CommerceAppConfigOutputModel,
  logger: LifecycleContext["logger"],
) {
  const persistence = await createLifecyclePersistence();
  const state = await persistence.stateStore.get(CURRENT_STATE_KEY);
  const baseline = await persistence.baselineProvider.get(
    state?.baselineSnapshotId ?? null,
  );

  return {
    ...persistence,

    // Custom installation steps have no live state to plan from, so only the failed attempt's
    // records show which of them ran.
    failedAttemptDataPaths: [CUSTOM_INSTALLATION_STEPS_PATH],
    lifecycleContext: buildLifecycleContext(params, appConfig, logger),
    rootStep: createRootInstallationStep(appConfig, {
      executedCustomInstallationSteps: getExecutedCustomInstallationSteps(
        state,
        baseline,
      ),
      forLifecycle: true,
    }),
  };
}
