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

import { fieldValuesEqual, isUnset } from "#management/common/utils/values";

import type { SubscriptionValues } from "./types";

/** How a subscription must change to match its target. */
export type SubscriptionChangeKind = "none" | "in-place" | "replace";

/**
 * Compares a subscription with its target. Merge-update keys are field names and rule
 * `field:operator` pairs. The update merges, so it cannot drop a key, a field's `source`, or a
 * value the target leaves out: those need a `replace`. A setting the target leaves out only
 * differs when the current value is one a config of ours set (`configured`), since otherwise it
 * is Commerce's own value.
 *
 * @param current - The subscription's current settings.
 * @param target - The target event config.
 * @param configured - Settings a config of ours set for this subscription.
 */
export function getSubscriptionChangeKind(
  current: SubscriptionValues,
  target: SubscriptionValues,
  configured: readonly Partial<SubscriptionValues>[] = [],
): SubscriptionChangeKind {
  const changes = [
    compareFields(current.fields, target.fields),
    compareRules(current.rules, target.rules, configured),
    compareScalar("priority", current, target, configured),
    compareScalar("hipaa_audit_required", current, target, configured),
  ];

  if (changes.includes("replace")) {
    return "replace";
  }

  return changes.includes("in-place") ? "in-place" : "none";
}

/** Compares subscription fields, which the config always sets. */
function compareFields(
  current: SubscriptionValues["fields"],
  target: SubscriptionValues["fields"],
): SubscriptionChangeKind {
  const normalize = (fields: SubscriptionValues["fields"]) =>
    fields.map(({ name, source }) => ({ name, source }));

  if (fieldValuesEqual(normalize(current), normalize(target))) {
    return "none";
  }

  const targetByName = new Map(target.map((field) => [field.name, field]));
  const dropsField = current.some((field) => !targetByName.has(field.name));
  const dropsSource = current.some(
    (field) =>
      field.source !== undefined &&
      targetByName.get(field.name)?.source === undefined,
  );

  return dropsField || dropsSource ? "replace" : "in-place";
}

/** Compares subscription rules, which the config may leave out. */
function compareRules(
  current: SubscriptionValues["rules"],
  target: SubscriptionValues["rules"],
  configured: readonly Partial<SubscriptionValues>[],
): SubscriptionChangeKind {
  if (isUnset(target)) {
    return holdsConfiguredValue("rules", current, configured)
      ? "replace"
      : "none";
  }

  if (fieldValuesEqual(current, target)) {
    return "none";
  }

  const ruleKey = (rule: { field: string; operator: string }) =>
    `${rule.field}:${rule.operator}`;

  const targetKeys = new Set(target?.map(ruleKey));
  const dropsRule = (current ?? []).some(
    (rule) => !targetKeys.has(ruleKey(rule)),
  );

  return dropsRule ? "replace" : "in-place";
}

/** Compares a boolean subscription setting, which the config may leave out. */
function compareScalar(
  field: "priority" | "hipaa_audit_required",
  current: SubscriptionValues,
  target: SubscriptionValues,
  configured: readonly Partial<SubscriptionValues>[],
): SubscriptionChangeKind {
  if (isUnset(target[field])) {
    return holdsConfiguredValue(field, current[field], configured)
      ? "replace"
      : "none";
  }

  return current[field] === target[field] ? "none" : "in-place";
}

/** Whether a current value equals a value a config of ours set for the same setting. */
function holdsConfiguredValue<TField extends keyof SubscriptionValues>(
  field: TField,
  current: SubscriptionValues[TField],
  configured: readonly Partial<SubscriptionValues>[],
): boolean {
  return configured
    .map((values) => values[field])
    .filter((value) => !isUnset(value))
    .some((value) => fieldValuesEqual(current, value));
}
