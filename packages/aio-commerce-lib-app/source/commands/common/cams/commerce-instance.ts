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

/** The Commerce instance an extension is associated with, as the service expects it in headers. */
export type CommerceInstance = {
  /** The base URL of the instance, without the environment suffix. */
  url: string;

  /** The environment of the instance. */
  env: "paas" | "saas";
};

/** The decoded form of a commerce id: the URL of the instance followed by its environment. */
const COMMERCE_ID_PATTERN = /^(https?:\/\/\S+)\/env\/(paas|saas)$/i;

/**
 * Reads the Commerce instance out of the `scope.commerceId` of an extension.
 *
 * @param commerceId - The Base64 or Base64URL form of `<instance URL>/env/<paas|saas>`.
 * @returns The instance, or `undefined` when the id is missing or has another format.
 */
export function decodeCommerceInstance(
  commerceId: string | undefined,
): CommerceInstance | undefined {
  if (!commerceId) {
    return;
  }

  const decoded = Buffer.from(commerceId, "base64url").toString("utf8");
  const [, url, env] = COMMERCE_ID_PATTERN.exec(decoded) ?? [];

  return url && env
    ? { env: env.toLowerCase() as CommerceInstance["env"], url }
    : undefined;
}
