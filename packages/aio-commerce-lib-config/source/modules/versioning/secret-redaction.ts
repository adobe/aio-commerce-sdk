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

import type { ConfigValue } from "#modules/configuration/types";
import type { ConfigDiff } from "./types";

/**
 * Sensitive field name patterns (case-insensitive).
 * Name-based redaction supplements schema-declared password fields.
 */
const SENSITIVE_FIELD_PATTERNS = [
  /password/iu,
  /secret/iu,
  /api[_-]?key/iu,
  /access[_-]?token/iu,
  /auth[_-]?token/iu,
  /private[_-]?key/iu,
  /credential/iu,
  /oauth/iu,
  /bearer/iu,
  /encryption[_-]?key/iu,
  /client[_-]?secret/iu,
];

/**
 * Redacted value indicator.
 */
export const REDACTED_VALUE = "***REDACTED***";

/**
 * Checks if a field name indicates sensitive data.
 *
 * @param fieldName - The configuration field name to check.
 * @returns True if the field should be redacted.
 */
export function isSensitiveField(
  fieldName: string,
  passwordFields: ReadonlySet<string> = new Set(),
) {
  return (
    passwordFields.has(fieldName) ||
    SENSITIVE_FIELD_PATTERNS.some((pattern) => pattern.test(fieldName))
  );
}

/**
 * Redacts sensitive values in configuration.
 *
 * @param config - Array of configuration values.
 * @returns Array with sensitive values redacted.
 */
export function redactSensitiveConfig(
  config: ConfigValue[],
  passwordFields?: ReadonlySet<string>,
): ConfigValue[] {
  return config.map((item) =>
    isSensitiveField(item.name, passwordFields)
      ? { ...item, value: REDACTED_VALUE }
      : item,
  );
}

/**
 * Redacts sensitive values in configuration diffs.
 *
 * @param diffs - Array of configuration diffs.
 * @returns Array with sensitive values redacted.
 */
export function redactSensitiveDiffs(
  diffs: ConfigDiff[],
  passwordFields?: ReadonlySet<string>,
): ConfigDiff[] {
  return diffs.map((diff) =>
    isSensitiveField(diff.name, passwordFields)
      ? {
          ...diff,
          newValue: diff.newValue === undefined ? undefined : REDACTED_VALUE,
          oldValue: diff.oldValue === undefined ? undefined : REDACTED_VALUE,
        }
      : diff,
  );
}
