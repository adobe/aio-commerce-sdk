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

import type { CommerceHttpClientParams } from "@adobe/aio-commerce-lib-api";

/**
 * Represents a single node in the scope tree hierarchy.
 */
export type ScopeNode = {
  /** Unique identifier for the scope. */
  id: string;
  /** Unique code identifier for the scope. */
  code: string;
  /** Human-readable label for the scope. */
  label: string;
  /** The level of the scope (e.g., "global", "website", "store", "store_view"). */
  level: string;
  /** Whether the scope configuration can be edited. */
  is_editable: boolean;
  /** Whether this is a final (leaf) scope that cannot have children. */
  is_final: boolean;
  /** Whether the scope can be removed. */
  is_removable: boolean;
  /** Optional Commerce API ID for system scopes. */
  commerce_id?: number;
  /** Optional child scopes for hierarchical structures. */
  children?: ScopeNode[];
};

/**
 * Represents the complete scope tree as an array of root scope nodes.
 */
export type ScopeTree = ScopeNode[];

/**
 * Options for getting the scope tree.
 */
export type GetScopeTreeOptions = {
  /** Whether to fetch fresh data from Commerce API instead of using cache. */
  remoteFetch?: boolean;
};

/**
 * Result from getting the scope tree.
 */
export type GetScopeTreeResult = {
  /** The scope tree as an array of root scope nodes. */
  scopeTree: ScopeNode[];
  /** Whether the returned data came from cache. */
  isCachedData: boolean;
  /** Optional error message if fallback data was used. */
  fallbackError?: string;
};

/**
 * Context needed for scope tree operations.
 */
export type ScopeTreeContext = {
  /** The namespace for isolating scope tree data. */
  namespace: string;
  /** Cache timeout in milliseconds. */
  cacheTimeout: number;
  /** Optional Commerce API client configuration for fetching fresh data. */
  commerceConfig?: CommerceHttpClientParams;
};
