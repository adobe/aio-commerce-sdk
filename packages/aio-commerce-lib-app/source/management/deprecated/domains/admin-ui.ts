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

import { defineLeafStep } from "#management/common/workflow/step";
import {
  deleteExtensionRegistration,
  enableAdminUiSdk,
  getExtensionName,
  registerExtension,
} from "#management/domains/admin-ui/helpers";

import type {
  AdminUiConfig,
  AdminUiExecutionContext,
} from "#management/domains/admin-ui/utils";

/**
 * Unregisters the extension from Commerce via DELETE /V1/adminuisdk/extension/:workspace_name/:extension_name.
 * Best-effort: errors are logged as warnings and do not stop the uninstall workflow.
 *
 * @param context - The execution context providing the Admin UI client and logger.
 */
export async function unregisterExtension(
  context: AdminUiExecutionContext,
): Promise<void> {
  const { logger } = context;
  const extensionName = getExtensionName();

  if (!extensionName) {
    logger.warn(
      "__OW_NAMESPACE environment variable is not set; skipping Admin UI extension unregistration. Continuing uninstall.",
    );
    return;
  }

  try {
    await deleteExtensionRegistration(context, extensionName);
  } catch (error: unknown) {
    const msg = await unwrapHttpError(error);
    logger.warn(
      `Failed to unregister Admin UI extension "${extensionName}": ${msg}. Continuing uninstall.`,
    );
  }
}

/**
 * Legacy leaf step that enables the Admin UI SDK (PUT) on install, before the
 * extension registration leaf. Install-only: it has no uninstall handler.
 * Deleted in the next major.
 */
const enableAdminUiSdkStep = defineLeafStep({
  install: (_: AdminUiConfig, context: AdminUiExecutionContext) =>
    enableAdminUiSdk(context),
  meta: {
    install: {
      description: "Enables the Admin UI SDK in Adobe Commerce",
      label: "Enable Admin UI SDK",
    },
  },
  name: "enable-admin-ui-sdk",
});

/** Legacy leaf steps of the Admin UI branch. Deleted in the next major. */
export const deprecatedAdminUiSteps: [typeof enableAdminUiSdkStep] = [
  enableAdminUiSdkStep,
];

/** Legacy install/uninstall handlers for the extension registration leaf. Deleted in the next major. */
export const deprecatedRegisterExtensionStep = {
  install: (_: AdminUiConfig, context: AdminUiExecutionContext) =>
    registerExtension(context),

  uninstall: (_: AdminUiConfig, context: AdminUiExecutionContext) =>
    unregisterExtension(context),
};
