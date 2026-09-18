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

// TODO: replace with the public production URL once the Commerce App Management
// Service is provisioned in production. Until then this points at the stage host
// (mirrors the same placeholder in the Commerce App Management frontend's
// `useCommerceAppManagementApi`).
/** Default Commerce App Management Service base URL used when no override is set. */
export const DEFAULT_CAMS_BASE_URL =
  "https://commerce-app-management-dev.adobe.io";

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
 * no user in the loop — such as auto-upgrade status writes — resolve the same
 * endpoint. Uses the {@link CAMS_BASE_URL_INPUT} override when present, otherwise
 * {@link DEFAULT_CAMS_BASE_URL}. The result is always returned with an explicit
 * scheme so it is a valid absolute URL for the HTTP client.
 *
 * @param params - The runtime action inputs.
 */
export function resolveCamsBaseUrl(params: Record<string, unknown>): string {
  const override = params[CAMS_BASE_URL_INPUT];
  const baseUrl =
    typeof override === "string" && override.trim() !== ""
      ? override.trim()
      : DEFAULT_CAMS_BASE_URL;
  return ensureScheme(baseUrl);
}
