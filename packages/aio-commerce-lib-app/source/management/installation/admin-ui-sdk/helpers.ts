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

import type { AdminUiSdkExecutionContext } from "./utils";

/** The response shape returned by POST /V1/adminuisdk/extension. */
export type RegisterExtensionResponse = {
  extensionId: string;
};

/**
 * Registers the extension with Commerce via POST /V1/adminuisdk/extension.
 *
 * `extensionName` and `extensionTitle` are derived from `metadata.id` and
 * `metadata.displayName` respectively so they don't need to be duplicated
 * inside the `adminUiSdk` config section.
 *
 * @param config - The validated app config containing the Admin UI SDK settings.
 * @param context - The execution context providing the Commerce HTTP client and logger.
 * @returns The response from the Commerce API containing the registered extension ID.
 */
export async function registerExtension(
  context: AdminUiSdkExecutionContext,
): Promise<RegisterExtensionResponse> {
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
    .json<RegisterExtensionResponse>();

  logger.info(
    `Admin UI SDK extension registered successfully: ${response.extensionId}`,
  );

  return response;
}
