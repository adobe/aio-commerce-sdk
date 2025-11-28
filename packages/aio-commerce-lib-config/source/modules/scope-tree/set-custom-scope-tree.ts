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

import { DEFAULT_CUSTOM_SCOPE_LEVEL } from "../../utils/constants";
import { generateUUID } from "../../utils/uuid";
import {
  COMMERCE_SCOPE_CODE,
  GLOBAL_SCOPE_CODE,
  validateCustomScopeRequest,
} from "./custom-scope-tree-validation";
import * as scopeTreeRepository from "./scope-tree-repository";

import type {
  CustomScopeInput,
  CustomScopeOutput,
  SetCustomScopeTreeRequest,
  SetCustomScopeTreeResponse,
} from "../../types";
import type { ScopeNode, ScopeTree, ScopeTreeContext } from "./types";

/**
 * Sets the custom scope tree, replacing all existing custom scopes with the provided ones.
 *
 * Custom scopes allow you to define additional configuration scopes beyond the standard
 * Commerce scopes (global, website, store, store_view). This function replaces all
 * custom scopes, preserving system scopes (global and commerce).
 *
 * **Important:** If a scope with the same `code` and `level` already exists, its ID
 * will be preserved. If `id` is provided in the input, it will be used; otherwise, a
 * new UUID will be generated for new scopes.
 *
 * @param context - Scope tree context containing namespace and cache timeout.
 * @param request - Custom scope tree request containing the scopes to set.
 * @returns Promise resolving to response with updated custom scopes.
 *
 * @throws {Error} If the request validation fails (invalid scope structure, missing required fields, duplicate codes, etc.).
 *
 * @example
 * ```typescript
 * import { setCustomScopeTree } from "./modules/scope-tree";
 *
 * const context = { namespace: "my-app", cacheTimeout: 300000 };
 *
 * // Replace all custom scopes with new ones
 * const result = await setCustomScopeTree(context, {
 *   scopes: [
 *     {
 *       code: "region_us",
 *       label: "US Region",
 *       level: "custom",
 *       is_editable: true,
 *       is_final: false,
 *       children: [
 *         {
 *           code: "region_us_west",
 *           label: "US West",
 *           level: "custom",
 *           is_editable: true,
 *           is_final: true,
 *         },
 *       ],
 *     },
 *   ],
 * });
 *
 * // Existing scopes with matching code+level will preserve their IDs
 * // New scopes will get new UUIDs assigned
 * ```
 */
export async function setCustomScopeTree(
  context: ScopeTreeContext,
  request: SetCustomScopeTreeRequest,
): Promise<SetCustomScopeTreeResponse> {
  const validatedScopes = validateCustomScopeRequest(request);

  const completeCurrentTree = await scopeTreeRepository.getPersistedScopeTree(
    context.namespace,
  );
  const existingCustomScopes = getExistingCustomScopes(completeCurrentTree);
  const processedCustomScopes = processCustomScopes(
    validatedScopes,
    existingCustomScopes,
  );
  const updatedCompleteTree = buildUpdatedCompleteTree(
    completeCurrentTree,
    processedCustomScopes,
  );
  await scopeTreeRepository.saveScopeTree(
    context.namespace,
    updatedCompleteTree,
  );

  // Clear cache to ensure fresh data on next get-scope-tree call
  await scopeTreeRepository.setCachedScopeTree(
    context.namespace,
    updatedCompleteTree,
    0,
  );

  return {
    message: "Custom scope tree updated successfully",
    timestamp: new Date().toISOString(),
    scopes: convertToResponseFormat(processedCustomScopes),
  };
}

/**
 * Extracts existing custom scopes from the complete tree.
 *
 * @param completeTree - Complete scope tree including system and custom scopes.
 * @returns Array of custom scope nodes (excluding global and commerce scopes).
 */
function getExistingCustomScopes(completeTree: ScopeTree): ScopeNode[] {
  return completeTree.filter(
    (scope) =>
      scope.code !== GLOBAL_SCOPE_CODE && scope.code !== COMMERCE_SCOPE_CODE,
  );
}

/**
 * Builds updated complete tree by preserving system scopes and replacing custom scopes.
 *
 * @param currentCompleteTree - Current complete scope tree.
 * @param newCustomScopes - New custom scopes to replace existing ones.
 * @returns Updated complete scope tree with new custom scopes.
 */
function buildUpdatedCompleteTree(
  currentCompleteTree: ScopeTree,
  newCustomScopes: ScopeNode[],
): ScopeTree {
  const systemScopes = currentCompleteTree.filter(
    (scope) =>
      scope.code === GLOBAL_SCOPE_CODE || scope.code === COMMERCE_SCOPE_CODE,
  );

  return [...systemScopes, ...newCustomScopes];
}

/**
 * Processes custom scopes, preserving existing IDs where possible.
 *
 * @param inputScopes - Custom scope inputs to process.
 * @param existingCustomScopes - Existing custom scopes to match against.
 * @returns Array of processed scope nodes with preserved IDs.
 */
function processCustomScopes(
  inputScopes: CustomScopeInput[],
  existingCustomScopes: ScopeNode[],
): ScopeNode[] {
  return inputScopes.map((scope) =>
    processSingleScope(scope, existingCustomScopes),
  );
}

/**
 * Processes a single scope recursively, preserving ID if found.
 *
 * @param inputScope - Custom scope input to process.
 * @param existingCustomScopes - Existing custom scopes to match against.
 * @returns Processed scope node with preserved or generated ID.
 */
function processSingleScope(
  inputScope: CustomScopeInput,
  existingCustomScopes: ScopeNode[],
): ScopeNode {
  const id = findExistingId(inputScope, existingCustomScopes) || generateUUID();
  const baseCustomScope = {
    id,
    code: inputScope.code,
    label: inputScope.label,
    level: inputScope.level ?? DEFAULT_CUSTOM_SCOPE_LEVEL,

    is_editable: inputScope.is_editable,
    is_final: inputScope.is_final,
    is_removable: true, // Custom scopes are always removable
  };

  if (inputScope.children && inputScope.children.length > 0) {
    return {
      ...baseCustomScope,
      children: inputScope.children.map((child) =>
        processSingleScope(child, existingCustomScopes),
      ),
    };
  }

  return baseCustomScope;
}

/**
 * Finds existing ID for a scope based on code and level match.
 *
 * @param inputScope - Custom scope input to find ID for.
 * @param existingScopes - Existing scope nodes to search.
 * @returns Existing scope ID if found, undefined otherwise.
 */
function findExistingId(
  inputScope: CustomScopeInput,
  existingScopes: ScopeNode[],
): string | undefined {
  if (inputScope.id) {
    return inputScope.id;
  }

  return findInScopeTree(
    inputScope.code,
    inputScope.level ?? DEFAULT_CUSTOM_SCOPE_LEVEL,
    existingScopes,
  );
}

/**
 * Recursively searches for a scope by code and level in a tree.
 *
 * @param targetCode - Scope code to find.
 * @param targetLevel - Scope level to find.
 * @param scopes - Array of scope nodes to search.
 * @returns Scope ID if found, undefined otherwise.
 */
function findInScopeTree(
  targetCode: string,
  targetLevel: string,
  scopes: ScopeNode[],
): string | undefined {
  for (const scope of scopes) {
    if (scope.code === targetCode && scope.level === targetLevel) {
      return scope.id;
    }
    if (scope.children) {
      const foundId = findInScopeTree(targetCode, targetLevel, scope.children);
      if (foundId) {
        return foundId;
      }
    }
  }
}

/**
 * Converts processed scopes to response format.
 *
 * @param scopes - Processed scope nodes to convert.
 * @returns Array of custom scope outputs.
 */
function convertToResponseFormat(scopes: ScopeNode[]): CustomScopeOutput[] {
  return scopes.map(convertSingleScopeToOutput);
}

/**
 * Converts a single scope to response format recursively.
 *
 * @param scope - Scope node to convert.
 * @returns Custom scope output.
 */
function convertSingleScopeToOutput(scope: ScopeNode): CustomScopeOutput {
  const baseScope = {
    id: scope.id,
    code: scope.code,
    label: scope.label,
    level: scope.level,
    is_editable: scope.is_editable,
    is_final: scope.is_final,
  };

  // Only include children if they exist and are not empty
  if (scope.children && scope.children.length > 0) {
    return {
      ...baseScope,
      children: scope.children.map(convertSingleScopeToOutput),
    };
  }

  return baseScope;
}
