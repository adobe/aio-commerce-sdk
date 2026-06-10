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

import type {
  ErrorResponse,
  SuccessResponse,
} from "@adobe/aio-commerce-lib-core/responses";
import type { MassActionRequest, MassActionResponseBody } from "./types";

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
 * Commerce determines success from the HTTP status code. You may optionally
 * include any fields in `body` for your own logging or auditing purposes.
 *
 * @example
 * ```ts
 * return okMassActionResponse();
 * return okMassActionResponse({ exported: ids.length });
 * ```
 */
export function okMassActionResponse(
  body: MassActionResponseBody = {},
): SuccessResponse<MassActionResponseBody> {
  return ok<MassActionResponseBody>({ body });
}

/**
 * Builds an error response for a worker mass action with the given HTTP status code.
 *
 * Use this when none of the typed helpers (`badRequestMassActionResponse`, etc.) match
 * your use case.
 *
 * @param statusCode - The HTTP status code to return.
 * @param errorMessage - Error message included in the response body as `{ error }`.
 *
 * @example
 * ```ts
 * return massActionErrorResponse(422, "Request entity is unprocessable");
 * ```
 */
export function massActionErrorResponse(
  statusCode: number,
  errorMessage: string,
): ErrorResponse {
  // @ts-expect-error — Commerce's wire contract uses `{ error }` only; lib-core requires `message`, which is not part of this format.
  return {
    type: "error",
    error: { statusCode, body: { error: errorMessage } },
  };
}

/**
 * Builds an HTTP 400 Bad Request error response for a worker mass action.
 *
 * @param errorMessage - Error message included in the response body as `{ error }`.
 *
 * @example
 * ```ts
 * return badRequestMassActionResponse("Missing required field: orderId");
 * ```
 */
export function badRequestMassActionResponse(
  errorMessage: string,
): ErrorResponse {
  return massActionErrorResponse(400, errorMessage);
}

/**
 * Builds an HTTP 401 Unauthorized error response for a worker mass action.
 *
 * @param errorMessage - Error message included in the response body as `{ error }`.
 *
 * @example
 * ```ts
 * return unauthorizedMassActionResponse("Invalid or expired token");
 * ```
 */
export function unauthorizedMassActionResponse(
  errorMessage: string,
): ErrorResponse {
  return massActionErrorResponse(401, errorMessage);
}

/**
 * Builds an HTTP 403 Forbidden error response for a worker mass action.
 *
 * @param errorMessage - Error message included in the response body as `{ error }`.
 *
 * @example
 * ```ts
 * return forbiddenMassActionResponse("Insufficient permissions to export orders");
 * ```
 */
export function forbiddenMassActionResponse(
  errorMessage: string,
): ErrorResponse {
  return massActionErrorResponse(403, errorMessage);
}

/**
 * Builds an HTTP 404 Not Found error response for a worker mass action.
 *
 * @param errorMessage - Error message included in the response body as `{ error }`.
 *
 * @example
 * ```ts
 * return notFoundMassActionResponse("No matching records found for the given IDs");
 * ```
 */
export function notFoundMassActionResponse(
  errorMessage: string,
): ErrorResponse {
  return massActionErrorResponse(404, errorMessage);
}

/**
 * Builds an HTTP 500 Internal Server Error response for a worker mass action.
 *
 * @param errorMessage - Error message included in the response body as `{ error }`.
 *
 * @example
 * ```ts
 * return internalServerErrorMassActionResponse("Could not reach the export service");
 * ```
 */
export function internalServerErrorMassActionResponse(
  errorMessage: string,
): ErrorResponse {
  return massActionErrorResponse(500, errorMessage);
}
