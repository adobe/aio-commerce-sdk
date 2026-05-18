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

type CreateRuntimeActionParamsArgs = RuntimeActionParams & {
  method?: RuntimeActionParams["__ow_method"];
  path?: string;
  body?: unknown;
  query?: string;
  headers?: Record<string, string | undefined>;
};

/** Builds OpenWhisk-style runtime action params for handler tests. */
export function createRuntimeActionParams(
  args: CreateRuntimeActionParamsArgs = {},
): RuntimeActionParams {
  const { method = "get", path = "/", body, query, headers, ...params } = args;

  return {
    ...params,
    __ow_method: method,
    __ow_path: path,
    ...(body === undefined ? {} : { __ow_body: JSON.stringify(body) }),
    ...(query ? { __ow_query: query } : {}),
    ...(headers ? { __ow_headers: headers } : {}),
  };
}
