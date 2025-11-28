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
  getSchemaDefaults,
  mergeWithSchemaDefaults,
} from "#config-utils";
import * as schemaRepository from "#modules/schema/config-schema-repository";
import * as scopeTreeRepository from "#modules/scope-tree/scope-tree-repository";

import * as configRepository from "./configuration-repository";

import type { GetConfigurationResponse } from "#types/index";
import type { ConfigContext } from "./types";

/**
 * Gets configuration for a scope identified by code and level or id.
 *
 * This function retrieves all configuration values for a specific scope, including
 * inherited values from parent scopes and schema defaults. The configuration is
 * merged according to the scope hierarchy, with values from more specific scopes
 * taking precedence over parent scopes.
 *
 * @param context - Configuration context containing namespace and cache timeout.
 * @param args - Scope identifier: either `(id: string)` or `(code: string, level: string)`.
 * @returns Promise resolving to configuration response with scope information and config values.
 *
 * @throws {Error} If the scope arguments are invalid or the scope is not found.
 */
export async function getConfiguration(
  { namespace }: ConfigContext,
  ...args: unknown[]
): Promise<GetConfigurationResponse> {
  // Create repositories for each domain
  const scopeTree = await scopeTreeRepository.getPersistedScopeTree(namespace);
  const { scopeCode, scopeLevel, scopeId, scopePath } = deriveScopeFromArgs(
    args,
    scopeTree,
  );

  let configData = await configRepository.loadConfig(scopeCode);
  if (!configData) {
    const cachedSchema = await schemaRepository.getCachedSchema(namespace);
    const schema =
      cachedSchema || JSON.parse(await schemaRepository.getPersistedSchema());

    const defaults = getSchemaDefaults(schema);
    configData = {
      scope: { id: scopeId, code: scopeCode, level: scopeLevel },
      config: defaults.config,
    };
  } else if (!Array.isArray(configData.config)) {
    configData.config = [];
  }

  try {
    configData = await mergeWithSchemaDefaults({
      configData,
      scopeCode,
      scopeLevel,
      scopePath,

      loadScopeConfigFn: (code: string) => configRepository.loadConfig(code),
      getSchemaFn: async () => {
        const cachedSchema = await schemaRepository.getCachedSchema(namespace);
        return (
          cachedSchema ||
          JSON.parse(await schemaRepository.getPersistedSchema())
        );
      },
    });
  } catch (_e) {
    // Continue with original configData if merging fails
  }

  return configData;
}
