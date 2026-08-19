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
  unregisterExtensionForUpgrade,
} from "./helpers";

import type {
  ApplyContext,
  ApplyResult,
} from "#management/common/workflow/resource";
import type { RegisterExtensionStepData } from "./branch";
import type { AdminUiDomainPlan } from "./types";
import type { AdminUiStepContext } from "./utils";

/**
 * Applies the Admin UI plan against Commerce. The per-component operations
 * collapse to one whole-extension action (Commerce has no per-component API):
 *
 * - `register`: enable the SDK (its install-only step is skipped during upgrade
 *   planning), then register the extension.
 * - `refresh`: enable the SDK (idempotent) as a safeguard, then call the dedicated
 *   refresh endpoint to re-sync the extension's components from the App Registry.
 *   Falls back to re-registering when that endpoint is unavailable on this
 *   Commerce instance (see {@link refreshExtension}).
 * - `unregister`: remove the extension, validating that the removal succeeded.
 *
 * The calls throw on failure, so a failed attempt never reports partial success.
 */
export async function applyAdminUi(
  plan: AdminUiDomainPlan,
  context: ApplyContext<AdminUiStepContext>,
): Promise<ApplyResult<RegisterExtensionStepData>> {
  if (plan.extensionAction === "register") {
    await enableAdminUiSdk(context);
    const { extensionId } = await registerExtension(context);
    return { snapshotData: { extensionId } };
  }

  if (plan.extensionAction === "refresh") {
    // Enable defensively: refresh (and the re-register fallback) require the SDK
    // to be enabled, and Commerce rejects them otherwise. Enabling is an
    // idempotent PUT, so it guards against the SDK being disabled out-of-band at
    // no meaningful cost.
    await enableAdminUiSdk(context);
    const refreshed = await refreshExtension(context);
    // The dedicated refresh endpoint returns no id (and there is no read endpoint
    // to fetch one), so carry the baseline's id forward when there is nothing
    // fresher to record. Always persist a snapshot here, even with a null id:
    // `extensionAction` is only "refresh" when the baseline block was present,
    // so the extension is registered regardless of whether its id is known —
    // persisting no snapshot at all would misrepresent that as unregistered.
    const extensionId = refreshed?.extensionId ?? plan.baselineExtensionId;
    return { snapshotData: { extensionId } };
  }

  if (plan.extensionAction === "unregister") {
    await unregisterExtensionForUpgrade(context);
    return { snapshotData: null };
  }

  return { snapshotData: null };
}
