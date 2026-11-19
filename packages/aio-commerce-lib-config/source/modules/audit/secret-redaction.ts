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

import { ENCRYPTED_PREFIX } from "#utils/encryption";

import type { ConfigDiff } from "./types";

const EncryptedValueSchema = v.pipe(v.string(), v.startsWith(ENCRYPTED_PREFIX));

/**
 * Redacted value indicator.
 */
export const REDACTED_VALUE = "***REDACTED***";

/**
 * Redacts sensitive values in configuration diffs.
 *
 * @param diffs - Array of configuration diffs.
 * @param redactedFields - Schema password fields and fields absent from the schema.
 * @returns Array with sensitive values redacted.
 */
export function redactSensitiveDiffs(
  diffs: ConfigDiff[],
  redactedFields: ReadonlySet<string>,
): ConfigDiff[] {
  return diffs.map((diff) =>
    redactedFields.has(diff.name) ||
    v.is(EncryptedValueSchema, diff.old?.value) ||
    v.is(EncryptedValueSchema, diff.new?.value)
      ? {
          ...diff,
          new: diff.new
            ? {
                ...diff.new,
                value:
                  diff.new.value === undefined ? undefined : REDACTED_VALUE,
              }
            : undefined,
          old: diff.old
            ? {
                ...diff.old,
                value:
                  diff.old.value === undefined ? undefined : REDACTED_VALUE,
              }
            : undefined,
        }
      : diff,
  );
}
