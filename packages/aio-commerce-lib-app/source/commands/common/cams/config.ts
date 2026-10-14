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

/** The CAMS host for the stage environment. */
export const STAGE_CAMS_URL = "https://commerce-app-management-stage.adobe.io";

/** The CAMS host for the production environment. */
export const PROD_CAMS_URL = "https://commerce-app-management.adobe.io";

const URL_SCHEME_PATTERN = /^https?:\/\//i;

/**
 * Resolves the base URL of the Commerce App Management Service (CAMS).
 *
 * The override variable wins. A value without a scheme is read as an https URL.
 *
 * @param env - The AIO CLI environment, which selects the default host.
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

  return env === "stage" ? STAGE_CAMS_URL : PROD_CAMS_URL;
}
