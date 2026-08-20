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

/**
 * The condition applied by a {@link SearchFilter}. Defaults to `eq` when omitted.
 *
 * - `eq` / `neq` — equals, not equals
 * - `like` / `nlike` — SQL `LIKE`; the value must include its own `%` wildcards
 * - `in` / `nin` — membership; array values are comma-joined on serialization
 * - `gt` / `gteq` / `lt` / `lteq` — numeric and date comparisons
 * - `from` / `to` — the bounds of a range, normally used as a pair
 * - `finset` / `nfinset` — a value within a set (Commerce multi-select attributes)
 * - `regexp` — matches a MySQL regular expression
 * - `seq` / `sneq` — string equals; Commerce turns these into a null check when the value is an empty string,
 *    and into `eq` / `neq` otherwise
 * - `null` / `notnull` — nullness; the SQL ignores the value, but supplying one is what makes `null` work on a
 *    non-static EAV attribute
 */
// Three conditions Commerce accepts are deliberately absent. This union is closed, so widening it later is a
// minor release while narrowing it is a major one.
//
// `moreq` is listed in the REST search documentation's condition type table, but no Commerce condition map
// implements it for database-backed collections, so it falls through to `eq` rather than erroring.
// This returns wrong results instead of a 400. Callers should use `gteq`.
// https://developer.adobe.com/commerce/webapi/rest/use-rest/performing-searches
//
// `fulltext` is an admin grid condition type, applied over a FULLTEXT index by the UI component filter pool.
// Repositories reach it only through a fallback that rewrites it to `like` with the value wrapped in wildcards,
// so over REST it is indistinguishable from `like` while implying a relevance-ranked search that is not performed.
//
// `ntoa` matches `INET_NTOA(field)`, which requires an IPv4 address stored as an integer.
// No core table does that — `sales_order.remote_ip` is a varchar, where INET_NTOA yields null and the filter
// silently matches nothing. The function also appears nowhere else in Commerce.
export type ConditionType =
  | "eq"
  | "neq"
  | "like"
  | "nlike"
  | "in"
  | "nin"
  | "gt"
  | "gteq"
  | "lt"
  | "lteq"
  | "from"
  | "to"
  | "finset"
  | "nfinset"
  | "regexp"
  | "seq"
  | "sneq"
  | "null"
  | "notnull";

/** A scalar value a {@link SearchFilter} can compare against. */
export type SearchFilterValue = string | number | boolean;

/** A single condition applied to a field of the searched entity. */
export type SearchFilter = {
  /**
   * The field to filter on. Kept as a bare `string` because Commerce attributes are per-installation and no exported
   * union could be complete.
   */
  field: string;

  /**
   * The value to compare against. Arrays are comma-joined, which is what the `in` and `nin` conditions expect.
   */
  value?: SearchFilterValue | SearchFilterValue[];

  /** @default "eq" */
  conditionType?: ConditionType;
};

/** The direction a {@link SortOrder} sorts in. */
export type SortDirection = "ASC" | "DESC";

/** A sort applied to the search results. */
export type SortOrder = {
  /** The field to sort by. */
  field: string;

  /** The direction to sort in. */
  direction: SortDirection;
};

/** The pagination applied to the search results. */
export type Pagination = {
  /** The number of items to return per page. */
  pageSize?: number;

  /** The page to return, 1-based. */
  currentPage?: number;
};

/**
 * A declarative description of an Adobe Commerce REST search query.
 *
 * Serialize it with {@link buildSearchCriteria}, or build it up fluently with
 * {@link searchCriteria}.
 */
export type SearchCriteria = Pagination & {
  /**
   * The filters to apply. The outer array is AND-ed together, while the filters in each inner array are OR-ed.
   */
  filterGroups?: SearchFilter[][];

  /** The sorts to apply, in order of precedence. */
  sortOrders?: SortOrder[];
};
