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

import { getHeader } from "@adobe/aio-commerce-lib-core/headers";
import * as v from "valibot";

const REQUEST_ID_HEADER = "x-request-id";

/** Runtime action params that may carry the OpenWhisk HTTP headers. */
const ViewButtonWorkerParamsSchema = v.looseObject({
  __ow_headers: v.optional(
    v.record(v.string(), v.union([v.string(), v.undefined()])),
  ),
});

/**
 * Maps the params Commerce sends to a view-button worker onto the documented request shape.
 *
 * Commerce POSTs `{ <entityId>, buttonId }` and sends the request ID in the `X-Request-ID`
 * header, which App Builder exposes in `__ow_headers`. Explicit `id` and `requestId` params
 * take precedence so direct calls with the documented shape keep working. Inputs that are not
 * runtime params are returned as-is so the entity schema reports the validation error.
 */
export function normalizeViewButtonWorkerParams(input: unknown): unknown {
  if (!v.is(ViewButtonWorkerParamsSchema, input)) {
    return input;
  }

  const { __ow_headers: headers = {} } = input;
  return {
    ...input,
    id: input.id ?? input.buttonId,
    requestId: input.requestId ?? getHeader(headers, REQUEST_ID_HEADER),
  };
}
