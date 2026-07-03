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

import { throwHttpError } from "../utils/http-error";

import type { AdminUiExecutionContext } from "./utils";

/**
 * Enables the Admin UI SDK in Commerce via PUT /V1/adminuisdk/config.
 * Must run before {@link registerExtension} so Commerce accepts the extension.
 *
 * @param context - The execution context providing the Admin UI client and logger.
 */
export async function enableAdminUiSdk(context: AdminUiExecutionContext) {
  const { adminUiClient, logger } = context;

  logger.info("Enabling Admin UI SDK in Adobe Commerce...");

  await adminUiClient
    .enableAdminUiSdk()
    .catch((error: unknown) =>
      throwHttpError(logger, error, "Failed to enable Admin UI SDK"),
    );

  logger.info("Admin UI SDK enabled successfully.");
}

/**
 * Registers the extension with Commerce via POST /V1/adminuisdk/extension.
 *
 * @param context - The execution context providing the Admin UI client and logger.
 */
export async function registerExtension(context: AdminUiExecutionContext) {
  const { adminUiClient, appData, logger } = context;
  const extensionName = process.env.__OW_NAMESPACE;

  if (!extensionName) {
    throw new Error("__OW_NAMESPACE environment variable is not set");
  }

  logger.info(`Registering Admin UI extension: ${appData.projectName}`);

  const { extensionId } = await adminUiClient
    .registerExtension({
      extensionName,
      extensionTitle: appData.projectTitle,
      extensionWorkspace: appData.workspaceName,
    })
    .catch((error: unknown) =>
      throwHttpError(logger, error, "Failed to register Admin UI extension"),
    );

  logger.info(`Admin UI extension registered successfully: ${extensionId}`);
}

/**
 * Unregisters the extension from Commerce via DELETE /V1/adminuisdk/extension/:workspace_name/:extension_name.
 * Best-effort: errors are logged as warnings and do not stop the uninstall workflow.
 *
 * @param context - The execution context providing the Admin UI client and logger.
 */
export async function unregisterExtension(
  context: AdminUiExecutionContext,
): Promise<void> {
  const { adminUiClient, appData, logger } = context;
  const extensionName = process.env.__OW_NAMESPACE;

  if (!extensionName) {
    logger.warn(
      "__OW_NAMESPACE environment variable is not set; skipping Admin UI extension unregistration. Continuing uninstall.",
    );
    return;
  }

  logger.info(
    `Unregistering Admin UI extension "${extensionName}" from workspace "${appData.workspaceName}"...`,
  );

  try {
    await adminUiClient.unregisterExtension({
      workspaceName: appData.workspaceName,
      extensionName,
    });
    logger.info(
      `Admin UI extension "${extensionName}" unregistered successfully.`,
    );
  } catch (error: unknown) {
    const msg = await unwrapHttpError(error);
    logger.warn(
      `Failed to unregister Admin UI extension "${extensionName}": ${msg}. Continuing uninstall.`,
    );
  }
}
