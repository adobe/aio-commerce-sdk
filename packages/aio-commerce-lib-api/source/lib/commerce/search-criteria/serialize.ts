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

import type {
  ConditionType,
  SearchCriteria,
  SearchFilter,
  SearchFilterValue,
} from "./types";

const DEFAULT_CONDITION_TYPE: ConditionType = "eq";

/**
 * Serializes a single filter value to its query-string representation.
 *
 * Booleans map to `1`/`0` rather than `true`/`false` because that is how Commerce stores boolean attributes.
 */
function serializeValue(value: SearchFilterValue): string {
  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }

  return String(value);
}

/**
 * Serializes a filter value, comma-joining arrays as the `in` and `nin` conditions expect.
 */
function serializeFilterValue(
  value: SearchFilterValue | SearchFilterValue[],
): string {
  return Array.isArray(value)
    ? value.map(serializeValue).join(",")
    : serializeValue(value);
}

/** Builds the query-string entries for a single filter within a group. */
function toFilterEntries(
  filter: SearchFilter,
  groupIndex: number,
  filterIndex: number,
): [string, string][] {
  const prefix = `searchCriteria[filterGroups][${groupIndex}][filters][${filterIndex}]`;
  const conditionType = filter.conditionType ?? DEFAULT_CONDITION_TYPE;

  const entries: [string, string][] = [[`${prefix}[field]`, filter.field]];

  // Every supplied value is forwarded, including for the nullness conditions
  if (filter.value !== undefined) {
    entries.push([`${prefix}[value]`, serializeFilterValue(filter.value)]);
  }

  entries.push([`${prefix}[conditionType]`, conditionType]);
  return entries;
}

/**
 * Builds the full set of query-string entries for the given search criteria.
 *
 * Indices are derived from array position, so the emitted groups, filters and sort orders are always
 * numbered from zero regardless of the input.
 */
function toEntries(criteria: SearchCriteria): [string, string][] {
  const entries: [string, string][] = [];

  // Empty groups are dropped so that conditionally-built filter lists can't produce a group Commerce would reject.
  const groups = (criteria.filterGroups ?? []).filter(
    (group) => group.length > 0,
  );

  for (const [groupIndex, group] of groups.entries()) {
    for (const [filterIndex, filter] of group.entries()) {
      entries.push(...toFilterEntries(filter, groupIndex, filterIndex));
    }
  }

  for (const [index, sortOrder] of (criteria.sortOrders ?? []).entries()) {
    const prefix = `searchCriteria[sortOrders][${index}]`;
    entries.push([`${prefix}[field]`, sortOrder.field]);
    entries.push([`${prefix}[direction]`, sortOrder.direction]);
  }

  if (criteria.pageSize !== undefined) {
    entries.push(["searchCriteria[pageSize]", String(criteria.pageSize)]);
  }

  if (criteria.currentPage !== undefined) {
    entries.push(["searchCriteria[currentPage]", String(criteria.currentPage)]);
  }

  return entries;
}

/**
 * Serializes {@link SearchCriteria} into the `searchCriteria[...]` query parameters that
 * Adobe Commerce REST search endpoints expect.
 *
 * The result can be passed straight to the `searchParams` option of any request made with the SDK's HTTP clients.
 *
 * @param criteria The search criteria to serialize.
 * @example
 * ```typescript
 * const searchParams = buildSearchCriteria({
 *   filterGroups: [[{ field: "sku", value: "24-MB01" }]],
 *   pageSize: 20,
 * });
 *
 * await client.get("products", { searchParams }).json();
 * ```
 */
export function buildSearchCriteria(criteria: SearchCriteria): URLSearchParams {
  return new URLSearchParams(toEntries(criteria));
}

/**
 * Serializes {@link SearchCriteria} into a plain record of query parameters.
 *
 * Prefer {@link buildSearchCriteria}; this variant exists for the case where the search criteria has to be
 * merged with unrelated query parameters, which `URLSearchParams` does not make convenient.
 *
 * @param criteria The search criteria to serialize.
 */
export function buildSearchCriteriaRecord(
  criteria: SearchCriteria,
): Record<string, string> {
  return Object.fromEntries(toEntries(criteria));
}
