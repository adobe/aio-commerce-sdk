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

import { DEFAULT_CUSTOM_SCOPE_LEVEL } from "../../utils";

import type { CustomScopeInput, SetCustomScopeTreeRequest } from "../../types";

export const COMMERCE_SCOPE_CODE = "commerce";
export const GLOBAL_SCOPE_CODE = "global";

/**
 * Helper to create validation errors with consistent property
 */
export function createValidationError(message: string) {
  const error = new Error(message);
  return Object.assign(error, { isValidationError: true });
}

/**
 * Validate and normalize the complete request structure, field types, and business rules
 */
export function validateCustomScopeRequest(
  request: SetCustomScopeTreeRequest,
): CustomScopeInput[] {
  if (!(request.scopes && Array.isArray(request.scopes))) {
    throw createValidationError("Request must include a scopes array");
  }

  const validatedScopes: CustomScopeInput[] = [];
  for (const scope of request.scopes) {
    const validatedScope = validateAndNormalizeSingleScope(scope);
    validatedScopes.push(validatedScope);
  }

  checkForDuplicateCodeLevelCombinations(validatedScopes);

  return validatedScopes;
}

/**
 * Validate field types for a scope
 */
export function validateFieldTypes(scope: CustomScopeInput): void {
  // Validate code field
  if (typeof scope.code !== "string" || scope.code.trim() === "") {
    throw createValidationError(`Field 'code' must be a non-empty string`);
  }

  // Validate label field
  if (typeof scope.label !== "string" || scope.label.trim() === "") {
    throw createValidationError(`Field 'label' must be a non-empty string`);
  }

  // Validate level field
  if (isProvidedButInvalidString(scope.level)) {
    throw createValidationError(
      `Field 'level' must be a non-empty string if provided`,
    );
  }

  // Validate boolean fields
  if (typeof scope.is_editable !== "boolean") {
    throw createValidationError(`Field 'is_editable' must be a boolean`);
  }
  if (typeof scope.is_final !== "boolean") {
    throw createValidationError(`Field 'is_final' must be a boolean`);
  }
}

/**
 * Validate and normalize a single scope recursively including structure, types, and business rules
 * Returns the scope with default values applied
 */
export function validateAndNormalizeSingleScope(
  scope: CustomScopeInput,
): CustomScopeInput {
  if (!scope || typeof scope !== "object") {
    throw createValidationError("Scope must be an object");
  }

  const requiredFields = ["code", "label", "is_editable", "is_final"];
  for (const field of requiredFields) {
    if (
      scope[field as keyof CustomScopeInput] === undefined ||
      scope[field as keyof CustomScopeInput] === null
    ) {
      throw createValidationError(`Missing required field '${field}'`);
    }
  }

  validateFieldTypes(scope);

  if (isProvidedButInvalidString(scope.id)) {
    throw createValidationError(
      `Field 'id' must be a non-empty string if provided`,
    );
  }

  const trimmedCode = scope.code.trim();
  const normalizedLevel = scope.level?.trim() || DEFAULT_CUSTOM_SCOPE_LEVEL;

  if (
    trimmedCode === COMMERCE_SCOPE_CODE ||
    trimmedCode === GLOBAL_SCOPE_CODE
  ) {
    throw createValidationError(
      `Scope code '${trimmedCode}' is reserved and cannot be used in custom scopes`,
    );
  }

  const normalizedScope: CustomScopeInput = {
    ...scope,
    code: trimmedCode,
    label: scope.label.trim(),
    level: normalizedLevel,
  };

  if (scope.id?.trim()) {
    normalizedScope.id = scope.id.trim();
  }

  // Validate and normalize children if present
  if (scope.children !== undefined) {
    if (!Array.isArray(scope.children)) {
      throw createValidationError(
        `Field 'children' must be an array if provided`,
      );
    }

    // Recursively validate and normalize children
    normalizedScope.children = scope.children.map((child) =>
      validateAndNormalizeSingleScope(child),
    );
  }

  return normalizedScope;
}

/**
 * Check for duplicate code-level combinations across all scopes (including nested children)
 */
function checkForDuplicateCodeLevelCombinations(
  scopes: CustomScopeInput[],
): void {
  const combinations = new Set<string>();

  function collectCombinations(scopeList: CustomScopeInput[]): void {
    for (const scope of scopeList) {
      const combination = `${scope.code}:${scope.level}`;
      if (combinations.has(combination)) {
        throw createValidationError(
          `Duplicate code-level combination '${combination}' found in custom scope tree. Custom scope code must be unique.`,
        );
      }
      combinations.add(combination);

      if (scope.children && scope.children.length > 0) {
        collectCombinations(scope.children);
      }
    }
  }

  collectCombinations(scopes);
}

/**
 * Check if an optional string field is provided but invalid
 */
function isProvidedButInvalidString(value: string | undefined): boolean {
  return value !== undefined && value.trim() === "";
}
