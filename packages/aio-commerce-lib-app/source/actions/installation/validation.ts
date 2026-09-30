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
  badRequest,
  internalServerError,
  ok,
} from "@adobe/aio-commerce-lib-core/responses";

import { validateCommerceAppConfig } from "#config/lib/validate";
import { runValidation } from "#management/index";

import { buildWorkflowParams } from "./common";

import type { ValidationContext } from "#management/index";
import type { RequestHandlerArgs } from "./common";

/** Runs pre-installation validation over the step tree. */
export async function validateInstallation({
  body,
  logger,
  rawParams,
}: RequestHandlerArgs) {
  logger.debug("Running pre-installation validation...");

  const rawAppConfig = rawParams.appConfig;
  if (!rawAppConfig) {
    return internalServerError(
      "The app config is missing. Does the action receive it as a parameter?",
    );
  }

  const { commerceBaseUrl } = body;
  if (!commerceBaseUrl) {
    return badRequest("commerceBaseUrl is required to validate the app.");
  }

  const appConfig = validateCommerceAppConfig(rawAppConfig);
  const { appData, ...params } = buildWorkflowParams(
    { ...body, commerceBaseUrl },
    rawParams,
  );

  const validationContext: ValidationContext = {
    appData,
    logger,
    params,
  };

  const result = await runValidation({
    config: appConfig,
    validationContext,
  });

  logger.debug(
    `Validation complete. Valid: ${result.valid}, Errors: ${result.summary.errors}, Warnings: ${result.summary.warnings}`,
  );

  return ok({ body: result });
}
