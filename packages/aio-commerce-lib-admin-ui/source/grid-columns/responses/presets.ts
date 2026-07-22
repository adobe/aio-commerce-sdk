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

import { buildErrorResponse, ok } from "@adobe/aio-commerce-lib-core/responses";

import type {
  ErrorResponse,
  SuccessResponse,
} from "@adobe/aio-commerce-lib-core/responses";
import type { GridErrorBody, GridRow, GridSuccessBody } from "./types";

/**
 * Builds an HTTP 200 success response carrying the grid column data envelope
 * Commerce expects on the `commerce/backend-ui/2` wire contract.
 *
 * @param data - Per-row cell values, keyed by entity ID.
 * @param defaults - Default cell values applied by Commerce to IDs missing from
 *   `data` and to cells whose value does not satisfy the declared `type` on the
 *   registration.
 *
 * @example
 * ```ts
 * return okGridResponse(
 *   {
 *     "000000001": { fulfillment_status: "shipped", risk_score: 12 },
 *     "000000002": { fulfillment_status: "pending", risk_score: 47 },
 *   },
 *   { fulfillment_status: "unknown", risk_score: 0 },
 * );
 * ```
 */
export function okGridResponse(
  data: Record<string, GridRow>,
  defaults?: GridRow,
): SuccessResponse<GridSuccessBody> {
  return ok<GridSuccessBody>({
    body: { data: defaults ? { ...data, "*": defaults } : data },
  });
}

/**
 * Builds an error response for a grid column handler with the given HTTP status code.
 *
 * Commerce uses the HTTP status code to distinguish success from failure.
 *
 * @param statusCode - The HTTP status code to return.
 * @param errorMessage - Error message included in the response body as `{ message }`.
 *
 * @example
 * ```ts
 * return errorGridResponse(500, "Could not reach inventory service");
 * ```
 */
export function errorGridResponse(
  statusCode: number,
  errorMessage: string,
): ErrorResponse<GridErrorBody> {
  return buildErrorResponse(statusCode, { body: { message: errorMessage } });
}
