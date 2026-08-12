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
import { HTTPError } from "ky";

import { throwHttpError } from "#management/common/utils/http-error";

import type { ApplyContext } from "#management/common/workflow/resource";
import type { ValidationExecutionContext } from "#management/common/workflow/step";
import type { AdminUiIdentity } from "./types";
import type { AdminUiExecutionContext, AdminUiStepContext } from "./utils";

/** HTTP status Commerce returns when the extension to delete no longer exists. */
const HTTP_NOT_FOUND = 404;

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
  return { extensionId };
}

/**
 * Refreshes an existing extension's registrations from the App Registry.
 *
 * Interim implementation: re-POSTs the registration, which is idempotent and
 * re-syncs the registrations without duplicating the extension. Swap to the
 * dedicated `POST .../refresh` endpoint (CEXT-6559) once it ships to instances.
 *
 * @param context - The execution context providing the Admin UI client and logger.
 */
export function refreshExtension(context: AdminUiExecutionContext) {
  return registerExtension(context);
}

/**
 * Performs the DELETE against Commerce for the given extension, logging the start
 * and success. Throws the raw client error on failure so callers can apply their
 * own error policy (best-effort warn vs. strict 404-tolerant throw).
 *
 * @param context - The execution context providing the Admin UI client and logger.
 * @param extensionName - The resolved extension name (the deployment namespace).
 */
async function deleteExtensionRegistration(
  context: AdminUiExecutionContext,
  extensionName: string,
): Promise<void> {
  const { adminUiClient, appData, logger } = context;

  logger.info(
    `Unregistering Admin UI extension "${extensionName}" from workspace "${appData.workspaceName}"...`,
  );

  await adminUiClient.unregisterExtension({
    extensionName,
    workspaceName: appData.workspaceName,
  });

  logger.info(
    `Admin UI extension "${extensionName}" unregistered successfully.`,
  );
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
  const { logger } = context;
  const extensionName = process.env.__OW_NAMESPACE;

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
 * Unregisters the extension during an upgrade removal. Unlike the best-effort
 * {@link unregisterExtension} used on uninstall, this validates the removal: a
 * missing extension (404) is treated as already removed, but any other failure
 * is enriched and thrown so the upgrade attempt reports it.
 *
 * @param context - The execution context providing the Admin UI client and logger.
 */
export async function unregisterExtensionForUpgrade(
  context: AdminUiExecutionContext,
): Promise<void> {
  const { logger } = context;
  const extensionName = process.env.__OW_NAMESPACE;

  if (!extensionName) {
    throw new Error("__OW_NAMESPACE environment variable is not set");
  }

  try {
    await deleteExtensionRegistration(context, extensionName);
  } catch (error: unknown) {
    if (
      error instanceof HTTPError &&
      error.response.status === HTTP_NOT_FOUND
    ) {
      logger.info(
        `Admin UI extension "${extensionName}" was already absent; treating removal as complete.`,
      );
      return;
    }

    await throwHttpError(
      logger,
      error,
      "Failed to unregister Admin UI extension",
    );
  }
}

/**
 * Resolves the identity of this app's Admin UI extension from context, or `null`
 * when the deployment namespace (`__OW_NAMESPACE`) is not available. Used by
 * `plan`, which must not throw — a missing namespace is surfaced as a blocking
 * issue instead of crashing the whole planning pass.
 */
export function tryResolveExtensionIdentity(
  context:
    | ValidationExecutionContext<AdminUiStepContext>
    | ApplyContext<AdminUiStepContext>,
): AdminUiIdentity | null {
  const extensionName = process.env.__OW_NAMESPACE;
  if (!extensionName) {
    return null;
  }

  return { extensionName, workspaceName: context.appData.workspaceName };
}

/**
 * Resolves the extension identity, throwing when the namespace is unavailable.
 * Used by `apply`, where a throw is reported as the attempt's failure.
 */
export function resolveExtensionIdentity(
  context:
    | ValidationExecutionContext<AdminUiStepContext>
    | ApplyContext<AdminUiStepContext>,
): AdminUiIdentity {
  const identity = tryResolveExtensionIdentity(context);
  if (!identity) {
    throw new Error("__OW_NAMESPACE environment variable is not set");
  }

  return identity;
}
