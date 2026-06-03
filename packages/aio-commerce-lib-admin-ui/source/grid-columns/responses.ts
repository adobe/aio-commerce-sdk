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

import {
  buildSuccessResponse,
  HTTP_OK,
} from "@adobe/aio-commerce-lib-core/responses";

import type { SuccessResponse } from "@adobe/aio-commerce-lib-core/responses";
import type { GridErrorBody, GridRow, GridSuccessBody } from "./types";

/** Input shape for {@link okGridResponse}. */
export type GridResponseInput = {
  /** Per-row cell values, keyed by ID. */
  rows: Record<string, GridRow>;

  /**
   * Default cell values applied by Commerce to IDs missing from `rows` and to
   * cells whose value does not satisfy the declared `type` on the registration.
   */
  defaults?: GridRow;
};

/**
 * Builds an HTTP 200 success response carrying the grid column data envelope
 * Commerce expects on the `commerce/backend-ui/2` wire contract.
 *
 * @example
 * ```ts
 * return okGridResponse({
 *   rows: {
 *     "000000001": { fulfillment_status: "shipped", risk_score: 12 },
 *     "000000002": { fulfillment_status: "pending", risk_score: 47 },
 *   },
 *   defaults: { fulfillment_status: "unknown", risk_score: 0 },
 * });
 * ```
 */
export function okGridResponse(
  input: GridResponseInput,
): SuccessResponse<GridSuccessBody> {
  const data: GridSuccessBody["data"] = { ...input.rows };
  if (input.defaults) {
    data["*"] = input.defaults;
  }

  return buildSuccessResponse<GridSuccessBody>(HTTP_OK, { body: { data } });
}

/**
 * Builds an HTTP 200 response carrying a handler-level failure envelope.
 *
 * Commerce treats any decoded body containing `errorStatus` as a failure
 * regardless of HTTP status, so returning 200 lets the handler convey a
 * specific error code and message that Commerce can log.
 *
 * @example
 * ```ts
 * return errorGridResponse("INTERNAL_ERROR", "Could not reach inventory service");
 * ```
 */
export function errorGridResponse(
  errorStatus: string,
  errorMessage?: string,
): SuccessResponse<GridErrorBody> {
  const body: GridErrorBody =
    errorMessage === undefined
      ? { errorStatus }
      : { errorStatus, errorMessage };

  return buildSuccessResponse<GridErrorBody>(HTTP_OK, { body });
}
