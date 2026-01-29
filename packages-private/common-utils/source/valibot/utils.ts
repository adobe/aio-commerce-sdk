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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import * as v from "valibot";

import type { BaseIssue, BaseSchema, InferOutput } from "valibot";

/**
 * Parses the input using the provided schema and throws a {@link CommerceSdkValidationError} error if the input is invalid.
 * @param schema - The schema to use for parsing.
 * @param input - The input to parse.
 * @param message - Optional custom error message for the validation error.
 */
export function parseOrThrow<
  const TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
>(schema: TSchema, input: unknown, message?: string): InferOutput<TSchema> {
  const result = v.safeParse(schema, input);
  if (!result.success) {
    throw new CommerceSdkValidationError(message ?? "Invalid input", {
      issues: result.issues,
    });
  }

  return result.output;
}
