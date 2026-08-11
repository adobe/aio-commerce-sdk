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

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  ConfigDiff,
  DomainCollector,
  DomainRule,
  ResourceChange,
} from "./types";

/** Marks a serialized function value so it stays distinguishable from an equivalent string literal. */
const FUNCTION_VALUE_MARKER = "__function__:";

/**
 * Recursively normalizes a value into a deterministically comparable form: object keys are
 * sorted and functions are serialized to their source text.
 *
 * `JSON.stringify` silently drops function-valued properties (e.g. a `dynamicList` field's
 * `options`/`default` factory), which would make a function-only change invisible. Serializing
 * to source keeps the comparison deterministic: identical sources stay equal, a changed source
 * is detected.
 */
function sortKeys(value: unknown): unknown {
  if (typeof value === "function") {
    return `${FUNCTION_VALUE_MARKER}${value.toString()}`;
  }

  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([x], [y]) => x.localeCompare(y))
        .map(([k, v]) => [k, sortKeys(v)]),
    );
  }

  return value;
}

/** Structural equality that is stable across key ordering and detects function-body changes. */
function stableEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));
}

/**
 * Diffs a single resource domain between the installed snapshot and the target config.
 * Emits one {@link ResourceChange} per identity present in either map.
 *
 * @param domain - The domain label stamped onto every emitted change.
 * @param oldMap - Resources collected from the installed-snapshot config.
 * @param newMap - Resources collected from the target config.
 * @param rule - Classification for this domain's removals and in-place changes.
 */
export function diffDomain(
  domain: string,
  oldMap: Map<string, unknown>,
  newMap: Map<string, unknown>,
  rule: DomainRule,
): ResourceChange[] {
  const changes: ResourceChange[] = [];
  const identities = new Set([...oldMap.keys(), ...newMap.keys()]);

  for (const identity of identities) {
    const before = oldMap.get(identity);
    const after = newMap.get(identity);
    const inOld = oldMap.has(identity);
    const inNew = newMap.has(identity);

    if (inOld && !inNew) {
      changes.push({
        before,
        destructive: rule.destructiveOnRemove,
        domain,
        identity,
        kind: "removed",
        supported: true,
      });
    } else if (!inOld && inNew) {
      changes.push({
        after,
        destructive: false,
        domain,
        identity,
        kind: "added",
        supported: true,
      });
    } else if (stableEqual(before, after)) {
      changes.push({
        after,
        before,
        destructive: false,
        domain,
        identity,
        kind: "unchanged",
        supported: true,
      });
    } else {
      changes.push({
        after,
        before,
        destructive: false,
        domain,
        identity,
        kind: "changed",
        supported: !rule.unsupportedOnChange,
      });
    }
  }

  return changes;
}

/**
 * Computes the full resource-level diff between the installed snapshot and the target config,
 * across every registered domain. Pure: it only reasons about the two config objects, with no
 * I/O and no knowledge of what is actually deployed.
 *
 * Domain-agnostic — every domain is supplied as a {@link DomainCollector}, so new domains plug
 * in without modifying the engine.
 *
 * @param oldConfig - The config the current installation snapshot was built from.
 * @param newConfig - The target config to diff against.
 * @param collectors - The domain collectors to run over both configs.
 */
export function diffConfig(
  oldConfig: CommerceAppConfigOutputModel,
  newConfig: CommerceAppConfigOutputModel,
  collectors: DomainCollector[],
): ConfigDiff {
  const changes = collectors.flatMap(({ domain, collect, rule }) =>
    diffDomain(domain, collect(oldConfig), collect(newConfig), rule),
  );

  return { changes };
}

/** The kinds a reconcile would actually apply (everything except `unchanged`). */
const OPERATIVE: ReadonlySet<ResourceChange["kind"]> = new Set([
  "added",
  "removed",
  "changed",
]);

/** True when the diff has no `added`, `removed`, or `changed` entries (i.e. nothing to apply). */
export function isEmptyPlan(diff: ConfigDiff): boolean {
  return !diff.changes.some((change) => OPERATIVE.has(change.kind));
}

/** The `added`/`removed`/`changed` entries a diff would actually apply (excludes `unchanged`). */
export function getOperativeChanges(diff: ConfigDiff): ResourceChange[] {
  return diff.changes.filter((change) => OPERATIVE.has(change.kind));
}

/** The operative changes belonging to a single domain. */
export function getChangesForDomain(
  diff: ConfigDiff,
  domain: string,
): ResourceChange[] {
  return getOperativeChanges(diff).filter((change) => change.domain === domain);
}

/** True when applying the diff would lose merchant data or silently remove merchant-visible behavior. */
export function configHasDestructiveChange(diff: ConfigDiff): boolean {
  return diff.changes.some(
    (change) => change.destructive && OPERATIVE.has(change.kind),
  );
}

/** True when the diff contains a change the reconcile engine cannot apply today. */
export function configHasUnsupportedChange(diff: ConfigDiff): boolean {
  return diff.changes.some(
    (change) => !change.supported && OPERATIVE.has(change.kind),
  );
}
