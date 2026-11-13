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
import { parseOrThrow } from "@aio-commerce-sdk/common-utils/valibot";

import { normalizeViewButtonWorkerParams } from "../lib/view-button-request";
import { CreditMemoViewButtonRequestSchema } from "./schema";

import type {
  ErrorResponse,
  SuccessResponse,
} from "@adobe/aio-commerce-lib-core/responses";
import type {
  CreditMemoViewButtonErrorBody,
  CreditMemoViewButtonRequest,
  CreditMemoViewButtonSuccessBody,
} from "./types";

/**
 * Parses a credit memo view-button worker request.
 * Throws `CommerceSdkValidationError` when the input is malformed.
 * @example
 * ```ts
 * const { requestId, id, creditMemoId } = parseCreditMemoViewButtonRequest(params);
 * ```
 */
export function parseCreditMemoViewButtonRequest(
  input: unknown,
): CreditMemoViewButtonRequest {
  return parseOrThrow(
    CreditMemoViewButtonRequestSchema,
    normalizeViewButtonWorkerParams(input),
    "Invalid credit memo view button request",
  );
}

/** Builds an HTTP 200 response with an empty body for a credit memo view-button worker. */
export function okCreditMemoViewButtonResponse(): SuccessResponse<CreditMemoViewButtonSuccessBody> {
  return ok<CreditMemoViewButtonSuccessBody>({ body: {} });
}

/**
 * Builds an error response for a credit memo view-button worker.
 * @param statusCode - The HTTP status code to return.
 * @param errorMessage - The message included in the response body.
 * @example
 * ```ts
 * return creditMemoViewButtonErrorResponse(500, "Could not refund the credit memo");
 * ```
 */
export function creditMemoViewButtonErrorResponse(
  statusCode: number,
  errorMessage: string,
): ErrorResponse<CreditMemoViewButtonErrorBody> {
  return buildErrorResponse(statusCode, { body: { message: errorMessage } });
}
