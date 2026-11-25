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

import {
  deriveScopeFromArgs,
  getSchemaDefaults,
  mergeWithSchemaDefaults,
} from "#config-utils";
import { requireGlobalSchema } from "#modules/schema/config-schema-repository";
import * as scopeTreeRepository from "#modules/scope-tree/scope-tree-repository";

import * as configRepository from "./configuration-repository";

import type { ResolvedBusinessConfigSchema } from "#modules/schema/types";
import type { GetConfigurationResponse } from "#types/index";
import type { ConfigContext, ConfigValue } from "./types";

/** Options for {@link resolveEffectiveConfig}. */
export type ResolveEffectiveConfigOptions = {
  /** Entries to use for the target scope instead of its stored entries. */
  scopeConfig?: ConfigValue[];

  /** Returns the target scope entries without inheritance when merging fails, instead of throwing. */
  ignoreMergeErrors?: boolean;
};

/**
 * Resolves the effective configuration of a scope: its entries merged with inherited values
 * and schema defaults. Password values are returned encrypted.
 *
 * @param context - Configuration context containing namespace and cache timeout.
 * @param scopeArgs - Scope identifier: `(id)`, `(code, level)`, or `(commerceScopeId, level)`.
 * @param options - Optional overrides for the target scope entries and merge error handling.
 *
 * @throws {Error} If the scope arguments are invalid or the scope is not found.
 */
export async function resolveEffectiveConfig(
  context: ConfigContext,
  scopeArgs: unknown[],
  options: ResolveEffectiveConfigOptions = {},
): Promise<{
  configData: GetConfigurationResponse;
  schema: ResolvedBusinessConfigSchema;
}> {
  const schema = requireGlobalSchema();
  const scopeTree = await scopeTreeRepository.getPersistedScopeTree(
    context.namespace,
  );
  const { scopeCode, scopeLevel, scopeId, scopePath } = deriveScopeFromArgs(
    scopeArgs,
    scopeTree,
  );
  const scope = { code: scopeCode, id: scopeId, level: scopeLevel };

  let configData: GetConfigurationResponse;
  if (options.scopeConfig) {
    configData = { config: options.scopeConfig, scope };
  } else {
    const stored = await configRepository.loadConfig(
      scopeCode,
      context.cacheTimeout,
    );
    if (stored) {
      configData = stored;
      if (!Array.isArray(configData.config)) {
        configData.config = [];
      }
    } else {
      configData = { config: getSchemaDefaults(schema).config, scope };
    }
  }

  const pending = configData;
  try {
    configData = await mergeWithSchemaDefaults({
      configData,
      getSchemaFn: async () => schema,
      loadScopeConfigFn: (code) =>
        options.scopeConfig && code === scopeCode
          ? Promise.resolve(pending)
          : configRepository.loadConfig(code, context.cacheTimeout),
      scopeCode,
      scopeLevel,
      scopePath,
    });
  } catch (error) {
    if (!options.ignoreMergeErrors) {
      throw error;
    }
  }

  return { configData, schema };
}
