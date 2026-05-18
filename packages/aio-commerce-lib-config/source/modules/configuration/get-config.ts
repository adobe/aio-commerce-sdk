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
import { requireGlobalSchema } from "#modules/schema/config-schema-repository";
import { getPasswordFields } from "#modules/schema/utils";
import * as scopeTreeRepository from "#modules/scope-tree/scope-tree-repository";
import { decrypt } from "#utils/encryption";

import * as configRepository from "./configuration-repository";

import type { GetConfigurationResponse } from "#types/index";
import type { ConfigContext } from "./types";

/**
 * Fetches and merges configuration for a scope without decrypting password fields.
 *
 * @internal
 */
export async function fetchRawConfiguration(
  context: ConfigContext,
  ...args: unknown[]
): Promise<{
  configData: GetConfigurationResponse;
  passwordFields: Set<string>;
}> {
  const schema = requireGlobalSchema();
  const scopeTree = await scopeTreeRepository.getPersistedScopeTree(
    context.namespace,
  );

  const { scopeCode, scopeLevel, scopeId, scopePath } = deriveScopeFromArgs(
    args,
    scopeTree,
  );

  let configData = await configRepository.loadConfig(scopeCode);
  if (!configData) {
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
      getSchemaFn: async () => Promise.resolve(schema),
    });
  } catch {
    // Continue with original configData if merging fails
  }

  return { configData, passwordFields: getPasswordFields(schema) };
}

/**
 * Gets configuration for a scope identified by code and level or id.
 *
 * This function retrieves all configuration values for a specific scope, including
 * inherited values from parent scopes and schema defaults. The configuration is
 * merged according to the scope hierarchy, with values from more specific scopes
 * taking precedence over parent scopes. Password-type fields are automatically
 * decrypted before being returned.
 *
 * @param context - Configuration context containing namespace and cache timeout.
 * @param args - Scope identifier: either `(id: string)` or `(code: string, level: string)`.
 * @returns Promise resolving to configuration response with scope information and config values.
 *
 * @throws {Error} If the scope arguments are invalid or the scope is not found.
 */
export async function getConfiguration(
  context: ConfigContext,
  ...args: unknown[]
): Promise<GetConfigurationResponse> {
  const { configData, passwordFields } = await fetchRawConfiguration(
    context,
    ...args,
  );
  return decryptPasswordFields(
    configData,
    passwordFields,
    context.encryptionKey,
  );
}

/**
 * Decrypts password fields in the configuration data.
 *
 * @param configData - Configuration data to process.
 * @param passwordFields - Set of field names that should be decrypted.
 * @returns Configuration data with password fields decrypted.
 */
function decryptPasswordFields(
  configData: GetConfigurationResponse,
  passwordFields: Set<string>,
  encryptionKey?: string,
): GetConfigurationResponse {
  if (!Array.isArray(configData.config)) {
    return configData;
  }

  return {
    ...configData,
    config: configData.config.map((entry) => {
      if (
        passwordFields.has(entry.name) &&
        typeof entry.value === "string" &&
        entry.value.length > 0
      ) {
        if (!encryptionKey) {
          throw new Error("Encryption key has not been given");
        }

        return {
          ...entry,
          value: decrypt(entry.value, encryptionKey),
        };
      }

      return entry;
    }),
  };
}
