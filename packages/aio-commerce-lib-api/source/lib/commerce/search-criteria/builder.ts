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

import { buildSearchCriteria, buildSearchCriteriaRecord } from "./serialize";

import type {
  Pagination,
  SearchCriteria,
  SearchFilter,
  SortDirection,
  SortOrder,
} from "./types";

const DEFAULT_SORT_DIRECTION: SortDirection = "ASC";

/**
 * A fluent, immutable builder for {@link SearchCriteria}.
 *
 * Every method returns a new builder, so a partially-applied builder can be shared as a base
 * and specialized per call site without the callers affecting one another.
 */
export type SearchCriteriaBuilder = {
  /**
   * Adds a filter as its own group, AND-ed with everything added before it.
   * @param filter The filter to add.
   */
  filter: (filter: SearchFilter) => SearchCriteriaBuilder;

  /**
   * Adds a group of filters that are OR-ed with one another, the group as a whole being AND-ed
   * with everything added before it.
   * @param filters The filters to OR together.
   */
  filterGroup: (...filters: SearchFilter[]) => SearchCriteriaBuilder;

  /**
   * Adds a sort order, applied after any previously added ones.
   * @param field The field to sort by.
   * @param direction The direction to sort in. Defaults to `ASC`.
   */
  sort: (field: string, direction?: SortDirection) => SearchCriteriaBuilder;

  /**
   * Replaces the pagination of the search criteria.
   * @param pagination The pagination to apply.
   */
  paginate: (pagination: Pagination) => SearchCriteriaBuilder;

  /** Serializes the search criteria to `URLSearchParams`. */
  toSearchParams: () => URLSearchParams;

  /** Serializes the search criteria to a plain record of query parameters. */
  toRecord: () => Record<string, string>;

  /** Returns the underlying {@link SearchCriteria}. */
  toJSON: () => SearchCriteria;
};

/** Copies a search criteria so that a builder can never be mutated through it. */
function copy(criteria: SearchCriteria): SearchCriteria {
  return {
    ...criteria,
    filterGroups: criteria.filterGroups?.map((group) => [...group]),
    sortOrders: criteria.sortOrders?.map((sortOrder) => ({ ...sortOrder })),
  };
}

/**
 * Creates a fluent, immutable builder for Adobe Commerce REST search criteria.
 *
 * Use `filter` for conditions that must all hold, and `filterGroup` for alternatives.
 * The former AND-s, the latter OR-s within the group.
 *
 * @param initial The search criteria to start from. Defaults to an empty one.
 * @example
 * ```typescript
 * const searchParams = searchCriteria()
 *   // status is 1 OR status is 2...
 *   .filterGroup({ field: "status", value: 1 }, { field: "status", value: 2 })
 *   // ...AND created on or after 2026-01-01
 *   .filter({ field: "created_at", value: "2026-01-01", conditionType: "gteq" })
 *   .sort("created_at", "DESC")
 *   .paginate({ pageSize: 50, currentPage: 1 })
 *   .toSearchParams();
 *
 * await client.get("products", { searchParams }).json();
 * ```
 */
export function searchCriteria(
  initial: SearchCriteria = {},
): SearchCriteriaBuilder {
  const criteria = copy(initial);

  const withGroup = (group: SearchFilter[]) =>
    searchCriteria({
      ...criteria,
      filterGroups: [...(criteria.filterGroups ?? []), group],
    });

  const withSortOrder = (sortOrder: SortOrder) =>
    searchCriteria({
      ...criteria,
      sortOrders: [...(criteria.sortOrders ?? []), sortOrder],
    });

  return {
    filter: (filter) => withGroup([filter]),
    filterGroup: (...filters) => withGroup(filters),
    paginate: ({ currentPage, pageSize }) =>
      searchCriteria({ ...criteria, currentPage, pageSize }),
    sort: (field, direction = DEFAULT_SORT_DIRECTION) =>
      withSortOrder({ direction, field }),

    toJSON: () => copy(criteria),
    toRecord: () => buildSearchCriteriaRecord(criteria),
    toSearchParams: () => buildSearchCriteria(criteria),
  };
}
