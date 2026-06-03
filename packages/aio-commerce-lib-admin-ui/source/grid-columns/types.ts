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
import type { GridRequestSchema, GridTypeSchema } from "./schema";

/** Grid identifier sent on the wire. */
export type GridType = v.InferOutput<typeof GridTypeSchema>;

/** Parsed request body sent by Commerce to a grid column handler. */
export type GridRequest = v.InferOutput<typeof GridRequestSchema>;

/** Cell values returned for a single row, keyed by `columnId`. */
export type GridRow = Record<string, unknown>;

/**
 * Success body returned to Commerce.
 *
 * The `"*"` entry supplies default cell values that Commerce applies to IDs
 * missing from `data` and to cells whose returned value does not satisfy the
 * declared `type` on the registration.
 */
export type GridSuccessBody = {
  data: Record<string, GridRow> & { "*"?: GridRow };
};

/** Failure body returned to Commerce. */
export type GridErrorBody = {
  errorStatus: string;
  errorMessage?: string;
};
