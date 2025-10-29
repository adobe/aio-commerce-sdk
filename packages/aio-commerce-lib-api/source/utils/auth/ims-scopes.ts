/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import type { ImsAuthParams } from "@adobe/aio-commerce-lib-auth";
import type { SetOptional } from "type-fest";

/** Defines the IMS authentication parameters with optional scopes. */
export type ImsAuthParamsWithOptionalScopes = SetOptional<
  ImsAuthParams,
  "scopes"
>;

/**
 * Ensures the correct scopes are set for the given IMS authentication parameters.
 * @param imsAuth - The IMS authentication parameters.
 * @param requiredScopes - The required scopes.
 */
export function ensureImsScopes(
  imsAuth: ImsAuthParamsWithOptionalScopes,
  requiredScopes: string[],
): ImsAuthParams {
  const scopes = new Set([...(imsAuth.scopes ?? []), ...requiredScopes]);
  return {
    ...imsAuth,
    scopes: Array.from(scopes),
  };
}
