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
} from "#config-utils";
import { logChange } from "#modules/audit/audit-logger";
import * as scopeTreeRepository from "#modules/scope-tree/scope-tree-repository";
import { createVersion } from "#modules/versioning/version-manager";

import * as configRepository from "./configuration-repository";

import type {
  SetConfigurationRequest,
  SetConfigurationResponse,
} from "#types/index";
import type { ConfigContext } from "./types";

// loadScopeConfig and persistConfiguration are now repository methods

import {
  DEFAULT_MAX_VERSIONS,
  MAX_VERSIONS_ENV_VAR,
  MIN_VERSION_COUNT,
} from "#utils/versioning-constants";

/**
 * Retrieves the maximum number of versions to retain from environment configuration.
 *
 * @returns Configured maximum versions or default if not set/invalid.
 */
function getMaxVersions(): number {
  const envValue = process.env[MAX_VERSIONS_ENV_VAR];

  if (!envValue) {
    return DEFAULT_MAX_VERSIONS;
  }

  const parsedValue = Number.parseInt(envValue, 10);

  return isValidVersionCount(parsedValue) ? parsedValue : DEFAULT_MAX_VERSIONS;
}

/**
 * Validates if a version count is within acceptable range.
 *
 * @param count - Version count to validate.
 * @returns True if count is valid (>= 1 and not NaN).
 */
function isValidVersionCount(count: number): boolean {
  return !Number.isNaN(count) && count >= MIN_VERSION_COUNT;
}

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
  // 1. Load current configuration
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

  const scope = { id: String(scopeId), code: scopeCode, level: scopeLevel };

  // 2. Create version with diff calculation
  const versionContext = {
    namespace: context.namespace,
    maxVersions: getMaxVersions(),
  };

  const { version } = await createVersion(versionContext, {
    scope,
    newConfig: mergedScopeConfig,
    oldConfig: existingEntries,
    actor: request.metadata?.actor,
  });

  // 3. Log change to audit log
  const auditContext = {
    namespace: context.namespace,
  };

  // Determine action type (default to create/update based on existing entries)
  const action =
    (request.metadata as { action?: "rollback" })?.action ??
    (existingEntries.length === 0 ? "create" : "update");

  await logChange(auditContext, {
    scope,
    versionId: version.id,
    actor: request.metadata?.actor ?? {},
    changes: version.diff,
    action,
  });

  // 4. Update current configuration
  const payload = {
    scope,
    config: mergedScopeConfig,
  };

  await configRepository.persistConfig(scopeCode, payload);

  const responseConfig = sanitizedEntries.map((entry) => ({
    name: entry.name,
    value: entry.value,
  }));

  // 5. Return success with version info
  return {
    message: "Configuration values updated successfully",
    timestamp: new Date().toISOString(),
    scope,
    config: responseConfig,
    versionInfo: {
      versionId: version.id,
      versionNumber: version.versionNumber,
    },
  };
}
