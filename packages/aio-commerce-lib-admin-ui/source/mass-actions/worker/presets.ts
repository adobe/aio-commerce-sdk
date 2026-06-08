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

import { MassActionRequestSchema } from "./schema";

import type { SuccessResponse } from "@adobe/aio-commerce-lib-core/responses";
import type {
  MassActionErrorBody,
  MassActionRequest,
  MassActionSuccessBody,
} from "./types";

/**
 * Parses and validates the JSON body Commerce POSTs to a worker mass action handler.
 *
 * Throws a `CommerceSdkValidationError` if the input is malformed.
 *
 * @example
 * ```ts
 * import { parseMassActionRequest } from "@adobe/aio-commerce-lib-admin-ui/mass-actions";
 *
 * export async function main(params: unknown) {
 *   const { requestId, gridType, ids } = parseMassActionRequest(params);
 *   // process ids...
 * }
 * ```
 */
export function parseMassActionRequest(input: unknown): MassActionRequest {
  return parseOrThrow(
    MassActionRequestSchema,
    input,
    "Invalid mass action request",
  );
}

/**
 * Builds an HTTP 200 success response for a worker mass action.
 *
 * @param message - Human-readable message surfaced to the user.
 *
 * @example
 * ```ts
 * return okMassActionResponse("3 customers exported.");
 * ```
 */
export function okMassActionResponse(
  message: string,
): SuccessResponse<MassActionSuccessBody> {
  return ok<MassActionSuccessBody>({ body: { status: "success", message } });
}

/**
 * Builds an HTTP 200 response carrying a handler-level failure.
 *
 * Commerce treats any body with `"status": "error"` as a failure regardless of
 * HTTP status. The `message` is used for logging; the user sees the
 * `notifications.error` string defined in the config instead.
 *
 * @param message - Error message for logging purposes.
 *
 * @example
 * ```ts
 * return errorMassActionResponse("Could not reach export service.");
 * ```
 */
export function errorMassActionResponse(
  message: string,
): SuccessResponse<MassActionErrorBody> {
  return ok<MassActionErrorBody>({ body: { status: "error", message } });
}
