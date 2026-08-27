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

import * as v from "valibot";

import {
  RecordedSchemaBusinessConfigSchema,
  SchemaBusinessConfigSchema,
} from "./fields";

/** The schema used to validate the business configuration settings. */
export const SchemaBusinessConfig = v.object({
  schema: v.optional(SchemaBusinessConfigSchema, []),
});

/** Defines the shape of the business configuration settings. */
export type BusinessConfig = v.InferInput<typeof SchemaBusinessConfig>;

/**
 * The schema used to validate business configuration settings recovered from
 * a persisted lifecycle snapshot, where `dynamicList` fields may be missing
 * their `options`/`default` functions.
 */
export const RecordedSchemaBusinessConfig = v.object({
  schema: v.optional(RecordedSchemaBusinessConfigSchema, []),
});

/** Defines the shape of a recorded business configuration settings object. */
export type RecordedBusinessConfig = v.InferInput<
  typeof RecordedSchemaBusinessConfig
>;

export {
  hasDynamicSchema,
  resolveBusinessConfigSchema,
} from "./utils";

export type * from "./types";
