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

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";

/** The Commerce system configuration populated during app association. */
export type CommerceSystemConfig = {
  /** The Commerce API base URL for the associated instance. */
  baseUrl: string;
  /** The deployment type of the associated Commerce instance. */
  env: "saas" | "paas";
};

/**
 * Returns the Commerce system configuration populated when the app was associated
 * with a Commerce instance, or `null` if the app is not currently associated.
 *
 * The values are available as the reserved package parameters `AIO_COMMERCE_BASE_URL`
 * and `AIO_COMMERCE_ENV`, set automatically by the SDK during association.
 *
 * @example
 * ```ts
 * const config = getCommerceSystemConfig(params);
 * if (!config) {
 *   return { statusCode: 400, body: { error: "Not associated with a Commerce instance" } };
 * }
 * // config.baseUrl — Commerce API base URL
 * // config.env — "saas" | "paas"
 * ```
 */
export function getCommerceSystemConfig(
  params: RuntimeActionParams,
): CommerceSystemConfig | null {
  const p = params as Record<string, unknown>;
  const baseUrl = p.AIO_COMMERCE_BASE_URL;
  const env = p.AIO_COMMERCE_ENV;
  if (typeof baseUrl !== "string" || typeof env !== "string") {
    return null;
  }
  return { baseUrl, env: env as "saas" | "paas" };
}
