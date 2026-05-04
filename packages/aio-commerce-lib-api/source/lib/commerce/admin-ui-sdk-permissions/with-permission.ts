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

import type { AdminUiSdkPermissionClient } from "./types";

const DENIED_RESPONSE = {
  statusCode: 403,
  body: { error: "Forbidden" },
} as const;

/** Wraps an App Builder action handler with an Admin UI SDK permission check. */
export function withAdminUiSdkPermission<
  TParams = Record<string, unknown>,
  TResult = unknown,
>(
  resource: string,
  client: AdminUiSdkPermissionClient,
  handler: (params: TParams) => Promise<TResult>,
): (params: TParams) => Promise<TResult | typeof DENIED_RESPONSE> {
  return async (params: TParams) => {
    try {
      await client.require(resource);
    } catch {
      return DENIED_RESPONSE;
    }

    return handler(params);
  };
}
