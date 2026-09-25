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
  conflict,
  internalServerError,
} from "@adobe/aio-commerce-lib-core/responses";

import {
  validateCommerceAppConfig,
  validateRecordedCommerceAppConfig,
} from "#config/lib/validate";
import { getAssociationData } from "#management/association/repository";
import {
  isInProgressState,
  isSucceededState,
} from "#management/common/workflow/types";
import { nowIsoString } from "#management/common/workflow/utils";
import { getCurrentLifecycleBaseline } from "#management/lifecycle/baseline";
import { CURRENT_STATE_KEY } from "#management/lifecycle/state";

import {
  createInstallationStore,
  createLifecyclePersistence,
  createUninstallationStore,
  getStorageKey,
} from "./common";
import { startLifecycleChange } from "./lifecycle";

import type { ErrorResponse } from "@adobe/aio-commerce-lib-core/responses";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { AppStateSnapshot } from "#management/common/orchestration";
import type { InstallationActionContext, RequestHandlerArgs } from "./common";

/** Starts a change toward the request's app config: an install without a baseline, otherwise an upgrade. */
export async function startInstallation({
  postDeploy,
  ...args
}: RequestHandlerArgs & { postDeploy: boolean }) {
  const resolved = await resolveLifecycleTarget(args.rawParams, {
    requireBaseline: postDeploy,
  });
  if ("response" in resolved) {
    return resolved.response;
  }

  return startLifecycleChange({
    ...args,
    baseline: resolved.baseline,
    targetConfig: resolved.appConfig,
  });
}

/** Starts uninstallation of the recorded baseline, or of the request's app config when none is recorded. */
export async function startUninstallation(args: RequestHandlerArgs) {
  const store = await createUninstallationStore();
  // Same as the legacy guard on POST /: only a pre-lifecycle uninstall still in flight lands
  // here, and that state is cache-only (10 minute TTL), so the guard is deletable once no such
  // run can remain.
  const existing = await store.get(getStorageKey());
  if (existing && isInProgressState(existing)) {
    return conflict(
      "Uninstallation is already in progress. Wait for it to complete.",
    );
  }

  const { baseline } = await resolveLifecycleBaseline(
    args.rawParams.appConfig,
    true,
  );
  if (!(baseline || args.rawParams.appConfig)) {
    return internalServerError(
      "Cannot determine what to uninstall: no recorded lifecycle baseline and no app config was provided.",
    );
  }

  return startLifecycleChange({ ...args, baseline, targetConfig: null });
}

/**
 * Validates the request's app config and resolves the baseline a change toward it starts from.
 * Returns the error response instead when the change can't be planned. `requireBaseline` rejects
 * an app that isn't installed yet.
 */
async function resolveLifecycleTarget(
  rawParams: InstallationActionContext["rawParams"],
  { requireBaseline = false } = {},
): Promise<
  | { response: ErrorResponse }
  | {
      appConfig: CommerceAppConfigOutputModel;
      baseline: AppStateSnapshot | null;
    }
> {
  const rawAppConfig = rawParams.appConfig;
  if (!rawAppConfig) {
    return {
      response: internalServerError(
        "The app config is missing. Does the action receive it as a parameter?",
      ),
    };
  }

  const appConfig = validateCommerceAppConfig(rawAppConfig);
  const resolved = await resolveLifecycleBaseline(rawAppConfig);

  // Only a deployed app that still holds in-flight state written before the lifecycle path
  // can reach this. That state is cache-only (10 minute TTL), so the guard can be deleted once
  // no pre-lifecycle run can still be in flight.
  if (resolved.legacyInProgress) {
    return {
      response: conflict(
        "Installation is already in progress. Wait for it to complete.",
      ),
    };
  }

  if (requireBaseline && !resolved.baseline) {
    // A post-deploy upgrade reports a missing version or association before a missing install.
    if (!process.env.__OW_ACTION_VERSION) {
      return {
        response: internalServerError(
          "The OpenWhisk action version is required to plan an upgrade",
        ),
      };
    }

    if (!(await getAssociationData())) {
      return {
        response: conflict({
          body: {
            message: "The app is not associated with a Commerce instance.",
            reason: "not-associated",
          },
        }),
      };
    }

    return {
      response: conflict({
        body: {
          message: "The app is not installed.",
          reason: "not-installed",
        },
      }),
    };
  }

  if (resolved.legacyConfigMissing) {
    return {
      response: conflict(
        "The existing installation does not include its original config and cannot be upgraded safely. Uninstall and reinstall the app.",
      ),
    };
  }

  return { appConfig, baseline: resolved.baseline };
}

/**
 * Resolves the lifecycle baseline. When `allowConfigFallback` is set (uninstallation), a legacy
 * install that recorded no usable config is adopted from the request config, so it can still be
 * torn down through the lifecycle path.
 */
async function resolveLifecycleBaseline(
  rawAppConfig: InstallationActionContext["rawParams"]["appConfig"],
  allowConfigFallback = false,
): Promise<{
  baseline: AppStateSnapshot | null;
  legacyConfigMissing: boolean;
  legacyInProgress: boolean;
}> {
  const defaults = {
    baseline: null,
    legacyConfigMissing: false,
    legacyInProgress: false,
  };
  const persistence = await createLifecyclePersistence();
  const baseline = await getCurrentLifecycleBaseline(
    persistence.stateStore,
    persistence.baselineProvider,
  );
  if (baseline) {
    return { ...defaults, baseline };
  }

  const existingState = await persistence.stateStore.get(CURRENT_STATE_KEY);
  if (existingState) {
    return defaults;
  }

  const legacyStore = await createInstallationStore();
  const legacy = await legacyStore.get(getStorageKey());
  const legacyInProgress = Boolean(legacy && isInProgressState(legacy));
  const legacyConfigMissing = Boolean(
    legacy && isSucceededState(legacy) && !legacy.config,
  );

  if (!(allowConfigFallback && rawAppConfig)) {
    return { ...defaults, legacyConfigMissing, legacyInProgress };
  }

  const adopted: AppStateSnapshot = {
    config: validateRecordedCommerceAppConfig(rawAppConfig),
    createdAt:
      legacy && isSucceededState(legacy) ? legacy.completedAt : nowIsoString(),
    data: legacy?.data ?? null,
    id: legacy?.id ?? crypto.randomUUID(),
  };

  await persistence.snapshotStore.put(adopted.id, adopted);
  await persistence.stateStore.put(CURRENT_STATE_KEY, {
    baselineSnapshotId: adopted.id,
    latestAttempt: null,
    pendingPlan: null,
  });

  return { ...defaults, baseline: adopted };
}
