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
  CURRENT_STATE_KEY,
  normalizeExpiredAttempt,
} from "#management/lifecycle/state";

import {
  createInstallationStore,
  createLifecyclePersistence,
  createUninstallationStore,
  getStorageKey,
  toWorkflowRunState,
} from "./common";

import type {
  LifecycleOperation,
  OrchestrationState,
} from "#management/common/orchestration";
import type { LifecycleContext } from "#management/common/workflow/step";
import type { LifecycleStore } from "#management/lifecycle/state";

type StatusHandlerArgs = {
  logger: LifecycleContext["logger"];
};

/** Returns the current installation or upgrade status; the raw lifecycle attempt for post-deploy invocations. */
export async function getInstallationStatus({
  logger,
  postDeploy,
}: StatusHandlerArgs & { postDeploy: boolean }) {
  if (postDeploy) {
    return readRawLifecycleAttempt(logger);
  }

  logger.debug("Getting installation execution status...");
  return readLifecycleOrLegacyState(
    await createInstallationStore(),
    ["install", "upgrade"],
    logger,
  );
}

/** Returns the current uninstallation status. */
export async function getUninstallationStatus({ logger }: StatusHandlerArgs) {
  logger.debug("Getting uninstallation execution status...");
  return readLifecycleOrLegacyState(
    await createUninstallationStore(),
    ["uninstall"],
    logger,
  );
}

/** Clears the legacy uninstallation record and any uninstall lifecycle state, without offboarding. */
export async function clearUninstallationState({ logger }: StatusHandlerArgs) {
  logger.debug("Clearing uninstallation state...");

  // The legacy key is cleared too, otherwise a pre-lifecycle record would resurface here.
  const store = await createUninstallationStore();
  await store.delete(getStorageKey());

  const { stateStore } = await createLifecyclePersistence();
  const state = await stateStore.get(CURRENT_STATE_KEY);
  if (state) {
    await stateStore.put(CURRENT_STATE_KEY, {
      ...state,
      latestAttempt:
        state.latestAttempt?.operation === "uninstall"
          ? null
          : state.latestAttempt,
      pendingPlan:
        state.pendingPlan?.operation === "uninstall" ? null : state.pendingPlan,
    });
  }

  logger.debug("Uninstallation state cleared");
  return noContent();
}

/** Returns the matching lifecycle attempt when present, otherwise the legacy workflow state. */
async function readLifecycleOrLegacyState(
  legacyStore: Awaited<ReturnType<typeof createInstallationStore>>,
  operations: LifecycleOperation[],
  logger: LifecycleContext["logger"],
) {
  // Completed legacy records are persisted permanently, so they must not shadow a newer run.
  const lifecycleState = await readLifecycleAttempt(operations, logger);
  if (lifecycleState) {
    return lifecycleState;
  }

  const state = await legacyStore.get(getStorageKey());
  if (state) {
    logger.debug(`Found state: ${state.status}`);
    return ok({ body: state });
  }

  logger.debug("No state found");
  return noContent();
}

/** Reads the latest lifecycle attempt, normalizing it first when its execution has expired. */
async function readLatestAttempt(
  stateStore: LifecycleStore<OrchestrationState>,
) {
  const state = await stateStore.get(CURRENT_STATE_KEY);
  if (!state?.latestAttempt) {
    return null;
  }

  return (await normalizeExpiredAttempt(stateStore, state)).latestAttempt;
}

/** Reads the raw lifecycle attempt shape consumed by the post-deploy poller. */
async function readRawLifecycleAttempt(logger: LifecycleContext["logger"]) {
  logger.debug("Getting lifecycle execution status...");
  const { stateStore } = await createLifecyclePersistence();
  const attempt = await readLatestAttempt(stateStore);
  if (!attempt) {
    logger.debug("No lifecycle state found");
    return noContent();
  }

  const { plan: _plan, ...attemptState } = attempt;
  logger.debug(`Found ${attempt.operation} state: ${attemptState.status}`);
  return ok({ body: attemptState });
}

/** Reads the latest attempt as legacy workflow state when it matches the requested operations, otherwise `null`. */
async function readLifecycleAttempt(
  operations: LifecycleOperation[],
  logger: LifecycleContext["logger"],
) {
  const { snapshotStore, stateStore } = await createLifecyclePersistence();
  const attempt = await readLatestAttempt(stateStore);
  if (!(attempt && operations.includes(attempt.operation))) {
    return null;
  }

  const sourceSnapshot = attempt.plan.source
    ? await snapshotStore.get(attempt.plan.source.snapshotId)
    : null;
  const resultSnapshot =
    attempt.status === "succeeded" && attempt.result.snapshotId
      ? await snapshotStore.get(attempt.result.snapshotId)
      : null;

  logger.debug(`Found state: ${attempt.status}`);
  return ok({
    body: toWorkflowRunState(
      attempt,
      attempt.plan.target?.config ?? sourceSnapshot?.config,
      resultSnapshot?.createdAt,
    ),
  });
}
