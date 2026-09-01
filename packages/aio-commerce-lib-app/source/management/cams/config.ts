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
  "https://commerce-app-management.corp.ethos506-stage-va6.ethos.adobe.net";

/**
 * Resolves the Commerce App Management Service base URL the app should talk to.
 *
 * The URL lives on the app side (not passed in by the caller) so that flows with
 * no user in the loop — such as auto-upgrade status writes — resolve the same
 * endpoint. Uses the {@link CAMS_BASE_URL_INPUT} override when present, otherwise
 * {@link DEFAULT_CAMS_BASE_URL}.
 *
 * @param params - The runtime action inputs.
 */
export function resolveCamsBaseUrl(params: Record<string, unknown>): string {
  const override = params[CAMS_BASE_URL_INPUT];
  if (typeof override === "string" && override.trim() !== "") {
    return override;
  }
  return DEFAULT_CAMS_BASE_URL;
}
