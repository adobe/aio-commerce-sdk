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

import * as v from "valibot";

import type { LifecycleOperation } from "#management/common/orchestration";

/** The lifecycle operations an attempt can have. */
const OPERATIONS = [
  "install",
  "upgrade",
  "uninstall",
] as const satisfies readonly LifecycleOperation[];

const OperationSchema = v.optional(v.picklist(OPERATIONS));

/** Query params that read the latest attempt or its history. */
const HistoryQuerySchema = v.object({
  attemptId: v.optional(v.never()),
  history: v.optional(v.picklist(["true", "false"]), "false"),
  limit: v.optional(
    v.pipe(v.string(), v.toNumber(), v.integer(), v.minValue(1)),
  ),
  operation: OperationSchema,
});

/** Query params that read one attempt by id. */
const AttemptQuerySchema = v.object({
  attemptId: v.pipe(v.string(), v.minLength(1)),
  history: v.optional(v.never()),
  limit: v.optional(v.never()),
  operation: OperationSchema,
});

/**
 * Query params of `GET /`. Query values arrive as strings.
 *
 * Unknown keys are accepted: with an empty query string the router falls back to every other
 * action param, such as `appConfig`.
 */
export const StatusQuerySchema = v.union([
  AttemptQuerySchema,
  HistoryQuerySchema,
]);
