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

const REQUEST_ID_HEADER = "x-request-id";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Maps the params Commerce sends to a view-button worker onto the documented request shape.
 *
 * Commerce POSTs `{ <entityId>, buttonId }` and sends the request ID in the `X-Request-ID`
 * header, which App Builder exposes as `__ow_headers["x-request-id"]`. Explicit `id` and
 * `requestId` params take precedence so direct calls with the documented shape keep working.
 */
export function normalizeViewButtonWorkerParams(input: unknown): unknown {
  if (!isRecord(input)) {
    return input;
  }

  const headers = isRecord(input.__ow_headers) ? input.__ow_headers : {};
  return {
    ...input,
    id: input.id ?? input.buttonId,
    requestId: input.requestId ?? headers[REQUEST_ID_HEADER],
  };
}
