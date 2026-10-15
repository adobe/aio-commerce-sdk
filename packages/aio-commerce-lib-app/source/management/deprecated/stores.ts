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
import { createCombinedStore } from "@aio-commerce-sdk/common-utils/storage";

import { isCompletedState } from "#management/index";

import type { ActionResponse } from "@adobe/aio-commerce-lib-core/responses";
import type { KeyValueStore } from "@aio-commerce-sdk/common-utils/storage";
import type { WorkflowRunState } from "#management/common/workflow/types";

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
