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

import type { ConfigValue } from "#modules/configuration/types";
import type { ConfigDiff } from "./types";

/**
 * Sensitive field name patterns (case-insensitive).
 * These fields will be redacted in version history and audit logs for GDPR compliance.
 */
const SENSITIVE_FIELD_PATTERNS = [
  /password/i,
  /secret/i,
  /api[_-]?key/i,
  /access[_-]?token/i,
  /auth[_-]?token/i,
  /private[_-]?key/i,
  /credential/i,
  /oauth/i,
  /bearer/i,
  /encryption[_-]?key/i,
  /client[_-]?secret/i,
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
export function isSensitiveField(fieldName: string): boolean {
  return SENSITIVE_FIELD_PATTERNS.some((pattern) => pattern.test(fieldName));
}

/**
 * Redacts sensitive values in configuration.
 *
 * @param config - Array of configuration values.
 * @returns Array with sensitive values redacted.
 */
export function redactSensitiveConfig(config: ConfigValue[]): ConfigValue[] {
  return config.map((item) => redactConfigItemIfSensitive(item));
}

/**
 * Redacts a single configuration item if it's sensitive.
 */
function redactConfigItemIfSensitive(item: ConfigValue): ConfigValue {
  if (!isSensitiveField(item.name)) {
    return item;
  }

  return {
    ...item,
    value: REDACTED_VALUE,
  };
}

/**
 * Redacts sensitive values in configuration diffs.
 *
 * @param diffs - Array of configuration diffs.
 * @returns Array with sensitive values redacted.
 */
export function redactSensitiveDiffs(diffs: ConfigDiff[]): ConfigDiff[] {
  return diffs.map((diff) => redactSingleDiff(diff));
}

/**
 * Redacts a single diff if it contains sensitive data.
 */
function redactSingleDiff(diff: ConfigDiff): ConfigDiff {
  if (!isSensitiveField(diff.name)) {
    return diff;
  }

  return {
    ...diff,
    oldValue: redactValueIfPresent(diff.oldValue),
    newValue: redactValueIfPresent(diff.newValue),
  };
}

/**
 * Redacts a value if it exists, otherwise returns undefined.
 */
function redactValueIfPresent(value: unknown): unknown {
  return value !== undefined ? REDACTED_VALUE : undefined;
}
