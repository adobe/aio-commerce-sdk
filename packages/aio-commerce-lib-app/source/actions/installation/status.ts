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

import { ok } from "@adobe/aio-commerce-lib-core/responses";

import {
  createInstallationStore,
  createUninstallationStore,
  readStateFromStore,
} from "#management/deprecated/stores";
import {
  CURRENT_STATE_KEY,
  normalizeExpiredAttempt,
} from "#management/lifecycle/state";

import { createLifecyclePersistence } from "./common";

import type { LifecycleContext } from "#management/index";

/**
 * Reads the latest lifecycle attempt, without its plan. Falls back to the recorded
 * pre-lifecycle installation state when there is no attempt, and answers 204 only when
 * the app has neither.
 */
export async function getLifecycleStatus(logger: LifecycleContext["logger"]) {
  logger.debug("Getting lifecycle execution status...");

  const { stateStore } = await createLifecyclePersistence();
  const state = await stateStore.get(CURRENT_STATE_KEY);
  const attempt = state
    ? (await normalizeExpiredAttempt(stateStore, state)).latestAttempt
    : null;

  if (!attempt) {
    return getLegacyInstallationStatus(logger);
  }

  const { plan: _plan, ...attemptState } = attempt;
  logger.debug(`Found lifecycle attempt: ${attemptState.status}`);

  return ok({ body: attemptState });
}

/** Reads the pre-lifecycle installation state, or 204 when there is none. */
async function getLegacyInstallationStatus(logger: LifecycleContext["logger"]) {
  // An app migrated from the legacy engine has no lifecycle attempt until it next reconciles,
  // and keeps its legacy record until it is uninstalled, so this keeps answering with it.
  // Removed together with `#management/deprecated` in the next major.
  const store = await createInstallationStore();
  return readStateFromStore(store, (message) => logger.debug(message));
}

/** Reads the current uninstallation workflow state, or 204 when there is none. */
export async function getUninstallationStatus(
  logger: LifecycleContext["logger"],
) {
  logger.debug("Getting uninstallation execution status...");

  const store = await createUninstallationStore();
  return readStateFromStore(store, (message) => logger.debug(message));
}
