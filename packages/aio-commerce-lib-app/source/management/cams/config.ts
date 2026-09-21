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

/**
 * Action input holding an explicit Commerce App Management Service base URL.
 * When set it overrides {@link DEFAULT_CAMS_BASE_URL} — internal/stage
 * deployments point this at the stage host; customers leave it unset and get the
 * default (production) endpoint.
 */
export const CAMS_BASE_URL_INPUT = "AIO_COMMERCE_APP_MANAGEMENT_SERVICE_URL";

/** Commerce App Management Service host for apps running against the stage environment. */
export const STAGE_CAMS_BASE_URL =
  "https://commerce-app-management-stage.adobe.io";

/** Commerce App Management Service host for apps running against production. */
export const PROD_CAMS_BASE_URL = "https://commerce-app-management.adobe.io";

/**
 * Default Commerce App Management Service base URL when no override is set and the
 * environment is not stage (production). A dev/local host can be targeted via the
 * {@link CAMS_BASE_URL_INPUT} override.
 */
export const DEFAULT_CAMS_BASE_URL = PROD_CAMS_BASE_URL;

/** Adobe environment an app runs against; selects the default service host. */
export type CamsEnv = "stage" | "prod";

/** Matches a URL that already carries an `http(s)://` scheme. */
const URL_SCHEME_PATTERN = /^https?:\/\//i;

/**
 * Ensures the base URL carries an explicit scheme. A bare host (e.g. a scheme-less
 * {@link CAMS_BASE_URL_INPUT} override) makes the HTTP client throw
 * `Failed to parse URL`, so a missing scheme defaults to https. An explicit
 * `http://` is preserved (e.g. a local endpoint).
 */
function ensureScheme(url: string): string {
  return URL_SCHEME_PATTERN.test(url) ? url : `https://${url}`;
}

/**
 * Resolves the Commerce App Management Service base URL the app should talk to.
 *
 * The URL lives on the app side (not passed in by the caller) so that flows with
 * no user in the loop — such as auto-upgrade orchestration — resolve the same
 * endpoint. An explicit {@link CAMS_BASE_URL_INPUT} override always wins (used for
 * dev/local hosts); otherwise the host is selected by the app's environment — the
 * stage host for {@code stage}, the production host otherwise. The result is always
 * returned with an explicit scheme so it is a valid absolute URL for the HTTP client.
 *
 * @param params - The runtime action inputs (or {@code process.env} for the hook).
 * @param env - The Adobe environment the app runs against; defaults to production.
 */
export function resolveCamsBaseUrl(
  params: Record<string, unknown>,
  env: CamsEnv = "prod",
): string {
  const override = params[CAMS_BASE_URL_INPUT];
  if (typeof override === "string" && override.trim() !== "") {
    return ensureScheme(override.trim());
  }
  return env === "stage" ? STAGE_CAMS_BASE_URL : PROD_CAMS_BASE_URL;
}
