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

import {
  deriveScopeFromArgs,
  getSchemaDefaults,
  mergeWithSchemaDefaults,
} from "../../config-utils";
import { ConfigSchemaRepository } from "../schema/config-schema-repository";
import { ScopeTreeRepository } from "../scope-tree/scope-tree-repository";
import { ConfigurationRepository } from "./configuration-repository";

import type { GetConfigurationResponse } from "../../types";
import type { ConfigContext } from "./types";

/**
 * Get configuration for a scope identified by code and level or id.
 * @param context - Configuration context
 * @param args - either (id) or (code, level)
 * @returns Promise resolving to configuration response
 */
export async function getConfiguration(
  context: ConfigContext,
  ...args: unknown[]
): Promise<GetConfigurationResponse> {
  // Create repositories for each domain
  const scopeTreeRepository = new ScopeTreeRepository();
  const schemaRepository = new ConfigSchemaRepository();
  const configRepository = new ConfigurationRepository();

  // Get scope tree
  const scopeTree = await scopeTreeRepository.getPersistedScopeTree(
    context.namespace,
  );
  const { scopeCode, scopeLevel, scopeId, scopePath } = deriveScopeFromArgs(
    args,
    scopeTree,
  );

  let configData: any = await configRepository.loadConfig(scopeCode);
  if (!configData) {
    const cachedSchema = await schemaRepository.getCachedSchema(
      context.namespace,
    );
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
    configData = await mergeWithSchemaDefaults(
      async (code: string) => configRepository.loadConfig(code),
      async () => {
        const cachedSchema = await schemaRepository.getCachedSchema(
          context.namespace,
        );
        return (
          cachedSchema ||
          JSON.parse(await schemaRepository.getPersistedSchema())
        );
      },
      configData,
      scopeCode,
      scopeLevel,
      scopePath,
    );
  } catch (_e) {
    // Continue with original configData if merging fails
  }

  return configData;
}
