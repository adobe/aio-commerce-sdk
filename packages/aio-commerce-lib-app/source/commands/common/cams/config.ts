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

import type { AioCliEnv } from "@aio-commerce-sdk/scripting-utils/aio";

/** Environment variable that overrides the CAMS base URL. */
export const CAMS_URL_ENV_VAR = "AIO_COMMERCE_APP_MANAGEMENT_SERVICE_URL";

/** Environment variable that selects the AIO CLI environment. */
export const AIO_CLI_ENV_VAR = "AIO_CLI_ENV";

/** The CAMS host for the stage environment. */
export const STAGE_CAMS_URL =
  "https://app-management-stage.api.commerce.adobe.com";

/** The CAMS host for the production environment. */
export const PROD_CAMS_URL = "https://app-management.api.commerce.adobe.com";

const URL_SCHEME_PATTERN = /^https?:\/\//i;

/**
 * Resolves the base URL of the Commerce App Management Service (CAMS).
 *
 * The override variable wins. A value without a scheme is read as an https URL.
 * Otherwise `AIO_CLI_ENV` (`stage` or `prod`) selects the host, falling back to `env`.
 *
 * @param env - The configured AIO CLI environment, used when `AIO_CLI_ENV` is unset or unknown.
 * @param variables - The environment variables to read the override from.
 */
export function resolveCamsBaseUrl(
  env: AioCliEnv,
  variables: Record<string, string | undefined> = process.env,
) {
  const override = variables[CAMS_URL_ENV_VAR]?.trim();
  if (override) {
    return URL_SCHEME_PATTERN.test(override) ? override : `https://${override}`;
  }

  const cliEnv = variables[AIO_CLI_ENV_VAR]?.trim();
  const effectiveEnv = cliEnv === "stage" || cliEnv === "prod" ? cliEnv : env;

  return effectiveEnv === "stage" ? STAGE_CAMS_URL : PROD_CAMS_URL;
}
