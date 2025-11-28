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

import {
  deriveScopeFromArgs,
  mergeScopes,
  sanitizeRequestEntries,
} from "../../config-utils";
import * as scopeTreeRepository from "../scope-tree/scope-tree-repository";
import * as configRepository from "./configuration-repository";

import type {
  SetConfigurationRequest,
  SetConfigurationResponse,
} from "../../types";
import type { ConfigContext } from "./types";
// loadScopeConfig and persistConfiguration are now repository methods

/**
 * Sets configuration values for a scope identified by code and level or id.
 *
 * This function updates configuration values for a specific scope. The provided values
 * are merged with existing configuration, and the origin is set to the current scope.
 * Configuration values are inherited from parent scopes unless explicitly overridden.
 *
 * @param context - Configuration context containing namespace and cache timeout.
 * @param request - Configuration set request containing the config values to set.
 * @param args - Scope identifier: either `(id: string)` or `(code: string, level: string)`.
 * @returns Promise resolving to configuration response with updated scope and config values.
 *
 * @throws {Error} If the scope arguments are invalid or the scope is not found.
 */
export async function setConfiguration(
  context: ConfigContext,
  request: SetConfigurationRequest,
  ...args: unknown[]
): Promise<SetConfigurationResponse> {
  // Create repositories for each domain
  // Get scope tree
  const scopeTree = await scopeTreeRepository.getPersistedScopeTree(
    context.namespace,
  );
  const { scopeCode, scopeLevel, scopeId } = deriveScopeFromArgs(
    args,
    scopeTree,
  );

  const sanitizedEntries = sanitizeRequestEntries(request?.config);
  const existingPersisted = await configRepository.loadConfig(scopeCode);
  const existingEntries = Array.isArray(existingPersisted?.config)
    ? (existingPersisted?.config ?? [])
    : [];

  const mergedScopeConfig = mergeScopes(
    existingEntries,
    sanitizedEntries,
    scopeCode,
    scopeLevel,
  );

  const payload = {
    scope: { id: scopeId, code: scopeCode, level: scopeLevel },
    config: mergedScopeConfig,
  };

  await configRepository.persistConfig(scopeCode, payload);

  const responseConfig = sanitizedEntries.map((entry) => ({
    name: entry.name,
    value: entry.value,
  }));

  return {
    message: "Configuration values updated successfully",
    timestamp: new Date().toISOString(),
    scope: { id: String(scopeId), code: scopeCode, level: scopeLevel },
    config: responseConfig,
  };
}
