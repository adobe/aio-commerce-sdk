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

import type * as v from "valibot";
import type {
  MassActionGridTypeSchema,
  MassActionRequestSchema,
} from "./schema";

/** Grid identifier sent on the wire by a worker mass action request. */
export type MassActionGridType = v.InferOutput<typeof MassActionGridTypeSchema>;

/** Parsed request body sent by Commerce to a worker mass action handler. */
export type MassActionRequest = v.InferOutput<typeof MassActionRequestSchema>;

/** Response body returned to Commerce after a worker mass action completes. */
export type MassActionResponseBody = Record<string, unknown>;
