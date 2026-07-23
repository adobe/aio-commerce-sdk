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

import { isWebhookSuccessResponse } from "./types";

/**
 * Determines whether a webhook action's result represents a successful outcome.
 * Adobe Commerce webhooks always respond with HTTP 200, even when the handler
 * wants to block the triggering process, so the actual outcome is only visible
 * in the response body's `op` field (`op: "exception"` signals a failure).
 *
 * @param result - The result of the instrumented webhook action.
 * @returns True if the webhook response is successful, false otherwise.
 *
 * @example
 * ```typescript
 * import { isWebhookSuccessful } from "@adobe/aio-commerce-lib-webhooks/responses";
 *
 * const result = await runWebhookAction(params);
 * span.setStatus(isWebhookSuccessful(result) ? { code: SpanStatusCode.OK } : { code: SpanStatusCode.ERROR });
 * ```
 */
export function isWebhookSuccessful(result: unknown): boolean {
  if (!isWebhookSuccessResponse(result)) {
    return false;
  }

  if (!result.body) {
    return true;
  }

  if (Array.isArray(result.body)) {
    return result.body.every((operation) => operation.op !== "exception");
  }

  return result.body.op !== "exception";
}
