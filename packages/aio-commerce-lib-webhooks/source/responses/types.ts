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

import { HTTP_OK } from "@adobe/aio-commerce-lib-api/utils";

import {
  isWebhookOperationResponse,
  isWebhookOperationResponseArray,
} from "./operations/types";

import type { SuccessResponse } from "@adobe/aio-commerce-lib-core/responses";
import type { WebhookOperationResponse } from "./operations/types";

/**
 * Successful SDK response containing webhook operation response body data.
 */
export type WebhookSuccessResponse = Omit<
  SuccessResponse,
  "body" | "statusCode"
> & {
  body?: WebhookOperationResponse | WebhookOperationResponse[];
  statusCode: typeof HTTP_OK;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Determines whether a value is a successful SDK response containing webhook operation response body data.
 *
 * @param response - Value to inspect.
 * @returns True when the value matches the webhook success response shape.
 */
export function isWebhookSuccessResponse(
  response: unknown,
): response is WebhookSuccessResponse {
  return (
    isRecord(response) &&
    response.type === "success" &&
    response.statusCode === HTTP_OK &&
    (response.body === undefined ||
      isWebhookOperationResponse(response.body) ||
      isWebhookOperationResponseArray(response.body))
  );
}
