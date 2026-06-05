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

import { parseOrThrow } from "@aio-commerce-sdk/common-utils/valibot";

import { GridRequestSchema } from "./schema";

import type { GridRequest } from "./types";

/**
 * Parses and validates the JSON body Commerce POSTs to a grid column handler.
 *
 * Throws a `CommerceSdkValidationError` if the input is malformed.
 *
 * @example
 * ```ts
 * import { parseGridRequest } from "@adobe/aio-commerce-lib-admin-ui/grid-columns";
 *
 * export async function main(params: unknown) {
 *   const { requestId, gridType, ids } = parseGridRequest(params);
 *   // ...
 * }
 * ```
 */
export function parseGridRequest(input: unknown): GridRequest {
  return parseOrThrow(GridRequestSchema, input, "Invalid grid column request");
}
