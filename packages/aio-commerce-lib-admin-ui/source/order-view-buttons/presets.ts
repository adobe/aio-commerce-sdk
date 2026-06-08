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

import { ok } from "@adobe/aio-commerce-lib-core/responses";
import { parseOrThrow } from "@aio-commerce-sdk/common-utils/valibot";

import { OrderViewButtonRequestSchema } from "./schema";

import type { SuccessResponse } from "@adobe/aio-commerce-lib-core/responses";
import type {
  OrderViewButtonErrorBody,
  OrderViewButtonRequest,
  OrderViewButtonSuccessBody,
} from "./types";

/**
 * Parses and validates the JSON body Commerce POSTs to an order view button handler.
 *
 * Throws a `CommerceSdkValidationError` if the input is malformed.
 *
 * @example
 * ```ts
 * import { parseOrderViewButtonRequest } from "@adobe/aio-commerce-lib-admin-ui/order-view-buttons";
 *
 * export async function main(params: unknown) {
 *   const { requestId, id, orderId } = parseOrderViewButtonRequest(params);
 *   // id identifies which button was clicked
 *   // orderId is the order currently being viewed
 *   // ...
 * }
 * ```
 */
export function parseOrderViewButtonRequest(
  input: unknown,
): OrderViewButtonRequest {
  return parseOrThrow(
    OrderViewButtonRequestSchema,
    input,
    "Invalid order view button request",
  );
}

/**
 * Builds an HTTP 200 success response for an order view button handler.
 *
 * Commerce renders `notifications.success` from the registration as the
 * toast body when present, and a default success toast otherwise.
 *
 * @example
 * ```ts
 * return okOrderViewButtonResponse();
 * ```
 */
export function okOrderViewButtonResponse(): SuccessResponse<OrderViewButtonSuccessBody> {
  return ok<OrderViewButtonSuccessBody>({ body: {} });
}

/**
 * Builds an HTTP 200 response carrying a handler-level failure envelope.
 *
 * Commerce treats any decoded body containing `errorStatus` as a failure
 * regardless of HTTP status. Commerce renders `notifications.error` from
 * the registration as the toast body when present; if absent it falls back
 * to `errorMessage`, and to a generic error message if neither is provided.
 *
 * @example
 * ```ts
 * return errorOrderViewButtonResponse("INTERNAL_ERROR", "Could not reach inventory service");
 * ```
 */
export function errorOrderViewButtonResponse(
  errorStatus: string,
  errorMessage?: string,
): SuccessResponse<OrderViewButtonErrorBody> {
  const body: OrderViewButtonErrorBody =
    errorMessage === undefined
      ? { errorStatus }
      : { errorStatus, errorMessage };

  return ok<OrderViewButtonErrorBody>({ body });
}
