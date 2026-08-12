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
  enableAdminUiSdk,
  refreshExtension,
  registerExtension,
  resolveExtensionIdentity,
  unregisterExtensionForUpgrade,
} from "./helpers";

import type {
  ApplyContext,
  ApplyResult,
} from "#management/common/workflow/resource";
import type {
  AdminUiDomainPlan,
  AdminUiIdentity,
  AdminUiSnapshotData,
} from "./types";
import type { AdminUiStepContext } from "./utils";

/**
 * Applies the Admin UI plan against Commerce. The per-component operations
 * collapse to one whole-extension action (Commerce has no per-component API):
 *
 * - `register`: enable the SDK (its install-only step is skipped during upgrade
 *   planning), then register the extension.
 * - `refresh`: enable the SDK (idempotent) as a safeguard, then re-register to
 *   re-sync the extension's components from the App Registry (component adds and
 *   removes converge in one call).
 * - `unregister`: remove the extension, validating that the removal succeeded.
 *
 * The calls throw on failure, so a failed attempt never reports partial success.
 */
export async function applyAdminUi(
  plan: AdminUiDomainPlan,
  context: ApplyContext<AdminUiStepContext>,
): Promise<ApplyResult<AdminUiSnapshotData, AdminUiIdentity>> {
  if (plan.extensionAction === "register") {
    await enableAdminUiSdk(context);
    const { extensionId } = await registerExtension(context);
    // Reuse the plan's cleanup resource so its key matches the entry seeded into
    // unresolvedCleanupResources; recomputing the identity risks a mismatch that
    // would flag a successful upgrade as a cleanup failure.
    return {
      resolvedCleanupResources: plan.possibleCleanupResources,
      snapshotData: { extensionId },
    };
  }

  if (plan.extensionAction === "refresh") {
    // Enable defensively: refresh re-POSTs the registration, which Commerce
    // rejects unless the SDK is enabled. Enabling is an idempotent PUT, so it
    // guards against the SDK being disabled out-of-band at no meaningful cost.
    await enableAdminUiSdk(context);
    const { extensionId } = await refreshExtension(context);
    return { resolvedCleanupResources: [], snapshotData: { extensionId } };
  }

  if (plan.extensionAction === "unregister") {
    await unregisterExtensionForUpgrade(context);
    return {
      resolvedCleanupResources: [
        { identity: resolveExtensionIdentity(context), path: plan.path },
      ],
      snapshotData: null,
    };
  }

  return { resolvedCleanupResources: [], snapshotData: null };
}
