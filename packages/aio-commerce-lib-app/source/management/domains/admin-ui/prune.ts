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

import { unwrapHttpError } from "@adobe/aio-commerce-lib-api/utils";

import { unregisterExtensionForUpgrade } from "./helpers";

import type { ApplyContext } from "#management/common/workflow/resource";
import type { AdminUiDomainPlan } from "./types";
import type { AdminUiStepContext } from "./utils";

/**
 * Best-effort removal of a leftover Admin UI extension when neither side declares admin UI. A 404
 * counts as clean, any other error is logged, never rethrown.
 */
export async function pruneAdminUi(
  plan: AdminUiDomainPlan,
  context: ApplyContext<AdminUiStepContext>,
): Promise<void> {
  if (!(plan.extensionAction === null && !context.targetConfig)) {
    return;
  }

  try {
    await unregisterExtensionForUpgrade(context);
  } catch (error) {
    context.logger.warn(
      `Failed to prune Admin UI extension: ${await unwrapHttpError(error)}. Continuing.`,
    );
  }
}
