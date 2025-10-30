/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import type { CommerceHttpClientParams } from "../../types";

// Core scope tree domain types
export interface ScopeNode {
  id: string;
  code: string;
  label: string;
  level: string;
  is_editable: boolean;
  is_final: boolean;
  is_removable: boolean;
  commerce_id?: number;
  children?: ScopeNode[];
}

export type ScopeTree = ScopeNode[];

// Options for getting scope tree
export interface GetScopeTreeOptions {
  remoteFetch?: boolean;
}

// Result from getting scope tree
export interface GetScopeTreeResult {
  scopeTree: ScopeNode[];
  isCachedData: boolean;
  fallbackError?: string;
}

// Context needed for scope tree operations
export interface ScopeTreeContext {
  namespace: string;
  cacheTimeout: number;
  commerceConfig?: CommerceHttpClientParams | undefined;
}
