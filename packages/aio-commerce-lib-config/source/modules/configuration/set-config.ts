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

import { parseOrThrow } from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

import {
  deriveScopeFromArgs,
  hasRequiredValue,
  mergeScopes,
  mergeWithSchemaDefaults,
  sanitizeRequestEntries,
} from "#config-utils";
import { requireGlobalSchema } from "#modules/schema/config-schema-repository";
import { getPasswordFields } from "#modules/schema/utils";
import * as scopeTreeRepository from "#modules/scope-tree/scope-tree-repository";
import { encrypt } from "#utils/encryption";

import * as configRepository from "./configuration-repository";

import type {
  SetConfigurationRequest,
  SetConfigurationResponse,
} from "#types/index";
import type { ConfigContext, SetConfigValue } from "./types";

const RequiredSaveValueSchema = v.nullable(
  v.union([v.string(), v.boolean(), v.array(v.string())]),
);

/**
 * Sets configuration values for a scope identified by code and level or id.
 *
 * This function updates configuration values for a specific scope. The provided values
 * are merged with existing configuration, and the origin is set to the current scope.
 * Configuration values are inherited from parent scopes unless explicitly overridden.
 * Password-type fields are automatically encrypted before storage.
 *
 * @param context - Configuration context containing namespace and cache timeout.
 * @param request - Configuration set request containing the config values to set.
 * @param args - Scope identifier: `(id: string)`, `(code: string, level: string)`, or `(commerceScopeId: number, level: string)`.
 * @returns Promise resolving to configuration response with updated scope and config values.
 *
 * @throws {Error} If the scope arguments are invalid or the scope is not found.
 */
export async function setConfiguration(
  context: ConfigContext,
  request: SetConfigurationRequest,
  ...args: unknown[]
): Promise<SetConfigurationResponse> {
  const schema = requireGlobalSchema();
  const scopeTree = await scopeTreeRepository.getPersistedScopeTree(
    context.namespace,
  );

  const { scopeCode, scopeLevel, scopeId, scopePath } = deriveScopeFromArgs(
    args,
    scopeTree,
  );

  const requiredForSave = new Set(
    schema
      .filter((field) => field.requiredFor?.includes("save"))
      .map((field) => field.name),
  );
  for (const entry of request.config) {
    if (
      typeof entry.name === "string" &&
      requiredForSave.has(entry.name.trim())
    ) {
      parseOrThrow(
        RequiredSaveValueSchema,
        entry.value,
        `Field "${entry.name.trim()}" required for save must have a valid value`,
      );
    }
  }
  const sanitizedEntries = sanitizeRequestEntries(request.config);
  const passwordFields = getPasswordFields(schema);

  const existingPersisted = await configRepository.loadConfig(
    scopeCode,
    context.cacheTimeout,
  );
  const existingEntries = Array.isArray(existingPersisted?.config)
    ? (existingPersisted?.config ?? [])
    : [];

  const pendingScopeConfig = mergeScopes(
    existingEntries,
    sanitizedEntries,
    scopeCode,
    scopeLevel,
  );

  const touchedRequiredForSave = sanitizedEntries.filter((entry) =>
    requiredForSave.has(entry.name),
  );
  if (touchedRequiredForSave.length > 0) {
    const scope = scopePath.find(
      (node) => node.code === scopeCode && node.level === scopeLevel,
    );
    if (!scope) {
      throw new Error(`INVALID_SCOPE: Unknown scope id='${scopeId}'`);
    }

    const pending = { config: pendingScopeConfig, scope };
    const effective = await mergeWithSchemaDefaults({
      configData: pending,
      getSchemaFn: async () => schema,
      loadScopeConfigFn: (code) =>
        code === scopeCode
          ? Promise.resolve(pending)
          : configRepository.loadConfig(code, context.cacheTimeout),
      scopeCode,
      scopeLevel,
      scopePath,
    });

    for (const { name } of touchedRequiredForSave) {
      const value = effective.config.find(
        (entry) => entry.name === name,
      )?.value;
      parseOrThrow(
        v.pipe(
          v.unknown(),
          v.check(
            hasRequiredValue,
            `Field "${name}" required for save must have a value`,
          ),
        ),
        value,
        `Field "${name}" required for save must have a value`,
      );
    }
  }

  const encryptedEntries = encryptPasswordFields(
    sanitizedEntries,
    passwordFields,
    context.encryptionKey,
  );
  const mergedScopeConfig = mergeScopes(
    existingEntries,
    encryptedEntries,
    scopeCode,
    scopeLevel,
  );

  const payload = {
    config: mergedScopeConfig,
    scope: { code: scopeCode, id: scopeId, level: scopeLevel },
  };

  await configRepository.persistConfig(
    scopeCode,
    payload,
    context.cacheTimeout,
  );

  return {
    config: mergedScopeConfig.map(({ name, value }) => ({ name, value })),
    message: "Configuration values updated successfully",
    scope: { code: scopeCode, id: String(scopeId), level: scopeLevel },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Encrypts password fields in the configuration entries.
 * Entries with a `null` value (unset) are passed through unchanged.
 *
 * @param entries - Configuration entries to process.
 * @param passwordFields - Set of field names that should be encrypted.
 * @returns Configuration entries with password fields encrypted.
 */
function encryptPasswordFields(
  entries: SetConfigValue[],
  passwordFields: Set<string>,
  encryptionKey?: string,
): SetConfigValue[] {
  return entries.map((entry) => {
    if (
      entry.value !== null &&
      passwordFields.has(entry.name) &&
      typeof entry.value === "string" &&
      entry.value.length > 0
    ) {
      if (!encryptionKey) {
        throw new Error("Encryption key has not been given");
      }

      return {
        ...entry,
        value: encrypt(entry.value, encryptionKey),
      };
    }

    return entry;
  });
}
