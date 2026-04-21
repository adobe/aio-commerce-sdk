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
  throwHttpError,
  unwrapHttpError,
} from "@adobe/aio-commerce-lib-api/utils";

import type { AdminUiSdkExecutionContext } from "./utils";

/** The response shape returned by POST /V1/adminuisdk/extension. */
export type RegisterExtensionResponse = {
  extensionId: string;
};

/**
 * Registers the extension with Commerce via POST /V1/adminuisdk/extension.
 *
 * @param context - The execution context providing the Commerce HTTP client and logger.
 * @returns The response from the Commerce API.
 */
export async function registerExtension(context: AdminUiSdkExecutionContext) {
  const { commerceClient, appData, logger } = context;

  logger.info(`Registering Admin UI SDK extension: ${appData.projectName}`);

  const response = await commerceClient
    .post("adminuisdk/extension", {
      json: {
        extension: {
          extensionName: process.env.__OW_NAMESPACE,
          extensionTitle: appData.projectTitle,
          extensionUrl: `https://${process.env.__OW_NAMESPACE}.adobeio-static.net/index.html`,
          extensionWorkspace: appData.workspaceName,
        },
      },
    })
    .json<RegisterExtensionResponse>()
    .catch((error: unknown) =>
      throwHttpError(
        logger,
        error,
        "Failed to register Admin UI SDK extension",
      ),
    );

  logger.info(
    `Admin UI SDK extension registered successfully: ${response.extensionId}`,
  );

  return response;
}

/**
 * Unregisters the extension from Commerce via DELETE /V1/adminuisdk/extension/:workspace_name/:extension_name.
 * Best-effort: errors are logged as warnings and do not stop the uninstall workflow.
 *
 * @param context - The execution context providing the Commerce HTTP client and logger.
 */
export async function uninstallExtension(
  context: AdminUiSdkExecutionContext,
): Promise<void> {
  const { commerceClient, appData, logger } = context;
  const extensionName = process.env.__OW_NAMESPACE;
  const endpoint = `adminuisdk/extension/${appData.workspaceName}/${extensionName}`;

  logger.info(
    `Unregistering Admin UI SDK extension "${extensionName}" from workspace "${appData.workspaceName}"...`,
  );

  try {
    await commerceClient.delete(endpoint);
    logger.info(
      `Admin UI SDK extension "${extensionName}" unregistered successfully.`,
    );
  } catch (error: unknown) {
    const msg = await unwrapHttpError(error);
    logger.warn(
      `Failed to unregister Admin UI SDK extension "${extensionName}": ${msg}. Continuing uninstall.`,
    );
  }
}
