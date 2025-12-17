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

import {
  buildSuccessResponse,
  HTTP_OK,
} from "@adobe/aio-commerce-lib-core/responses";

import type { SuccessResponse } from "@adobe/aio-commerce-lib-core/responses";
import type { WebhookOperationResponse } from "~/operations";

/**
 * Creates an HTTP 200 OK response with webhook operation(s)
 * Webhook-optimized version of ok() that automatically wraps operations in the response body.
 *
 * This function shadows the core library's ok() to provide a cleaner API for webhook actions.
 * Instead of `ok({ body: operation })`, you can simply use `ok(operation)`.
 *
 * @param operations - Single webhook operation or array of operations
 * @returns Success response with operations in body
 *
 * @example
 * ```typescript
 * import { ok, successOperation } from "@adobe/aio-commerce-lib-webhooks";
 *
 * // Single operation
 * return ok(successOperation());
 *
 * // Array of operations
 * return ok([
 *   addOperation("result", data),
 *   removeOperation("result/old_field")
 * ]);
 * ```
 */
export function ok(
  operations: WebhookOperationResponse | WebhookOperationResponse[],
): SuccessResponse {
  return buildSuccessResponse(HTTP_OK, {
    // biome-ignore lint/suspicious/noExplicitAny: body does not support array type
    body: operations as any,
  });
}
