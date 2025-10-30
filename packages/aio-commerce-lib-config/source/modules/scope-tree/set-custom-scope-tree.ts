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

import { generateUUID } from "../../utils";
import {
  COMMERCE_SCOPE_CODE,
  GLOBAL_SCOPE_CODE,
  validateCustomScopeRequest,
} from "./custom-scope-tree-validation";
import { ScopeTreeRepository } from "./scope-tree-repository";

import type {
  CustomScopeInput,
  CustomScopeOutput,
  SetCustomScopeTreeRequest,
  SetCustomScopeTreeResponse,
} from "../../types";
import type { ScopeNode, ScopeTree, ScopeTreeContext } from "./types";

/**
 * Set custom scope tree. Replaces all custom scopes with provided ones
 */
export async function setCustomScopeTree(
  context: ScopeTreeContext,
  request: SetCustomScopeTreeRequest,
): Promise<SetCustomScopeTreeResponse> {
  const repository = new ScopeTreeRepository();

  const validatedScopes = validateCustomScopeRequest(request);

  const completeCurrentTree = await repository.getPersistedScopeTree(
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
  await repository.saveScopeTree(context.namespace, updatedCompleteTree);

  // Clear cache to ensure fresh data on next get-scope-tree call
  await repository.setCachedScopeTree(
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
 * Extract existing custom scopes from the complete tree
 */
function getExistingCustomScopes(completeTree: ScopeTree): ScopeNode[] {
  return completeTree.filter(
    (scope) =>
      scope.code !== GLOBAL_SCOPE_CODE && scope.code !== COMMERCE_SCOPE_CODE,
  );
}

/**
 * Build updated complete tree by preserving system scopes and replacing custom scopes
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
 * Process custom scopes, preserving existing IDs where possible
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
 * Helper to process a single scope recursively
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
    level: inputScope.level!,
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
 * Find existing ID for a scope based on code and level match
 */
function findExistingId(
  inputScope: CustomScopeInput,
  existingScopes: ScopeNode[],
): string | undefined {
  if (inputScope.id) {
    return inputScope.id;
  }

  return findInScopeTree(inputScope.code, inputScope.level!, existingScopes);
}

/**
 * Helper to recursively search for a scope by code and level in a tree
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
      if (foundId) return foundId;
    }
  }
  return undefined;
}

/**
 * Convert processed scopes to response format
 */
function convertToResponseFormat(scopes: ScopeNode[]): CustomScopeOutput[] {
  return scopes.map(convertSingleScopeToOutput);
}

/**
 * Helper to convert a single scope to response format recursively
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
