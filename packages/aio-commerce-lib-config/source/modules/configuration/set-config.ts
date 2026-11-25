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
  mergeScopes,
  sanitizeRequestEntries,
} from "#config-utils";
import { prepareAuditEntry } from "#modules/audit/audit-logger";
import { saveAuditEntry } from "#modules/audit/audit-repository";
import { requireGlobalSchema } from "#modules/schema/config-schema-repository";
import { RequiredValueSchema, ValueSchema } from "#modules/schema/fields";
import { getPasswordFields } from "#modules/schema/utils";
import * as scopeTreeRepository from "#modules/scope-tree/scope-tree-repository";
import { encrypt } from "#utils/encryption";

import * as configRepository from "./configuration-repository";
import { resolveEffectiveConfig } from "./resolve-effective-config";

import type {
  SetConfigurationRequest,
  SetConfigurationResponse,
} from "#types/index";
import type { ConfigContext, ConfigValue, SetConfigValue } from "./types";

const SaveValueSchema = v.nullable(ValueSchema);

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

  const scopeInfo = deriveScopeFromArgs(args, scopeTree);
  const { scopeCode, scopeLevel, scopeId } = scopeInfo;
  const requiredForSave = new Set(
    schema
      .filter((field) => field.requiredFor?.includes("save"))
      .map((field) => field.name),
  );
  validateRequiredSaveEntries(request.config, requiredForSave);
  const sanitizedEntries = sanitizeRequestEntries(request.config);
  const passwordFields = getPasswordFields(schema);

  const existingPersisted = await configRepository.loadConfig(
    scopeCode,
    context.cacheTimeout,
  );
  const existingEntries = Array.isArray(existingPersisted?.config)
    ? (existingPersisted?.config ?? [])
    : [];

  await validateRequiredSaveConfiguration({
    context,
    entries: sanitizedEntries,
    existingEntries,
    requiredForSave,
    scopeArgs: args,
    scopeInfo,
  });

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

  const knownFields = new Set(schema.map((field) => field.name));
  const redactedFields = new Set([
    ...passwordFields,
    ...[...existingEntries, ...mergedScopeConfig]
      .filter((entry) => !knownFields.has(entry.name))
      .map((entry) => entry.name),
  ]);
  const audit = prepareAuditEntry(
    payload.scope,
    existingEntries,
    mergedScopeConfig,
    redactedFields,
    request.metadata?.actor,
  );

  await configRepository.persistConfig(
    scopeCode,
    payload,
    context.cacheTimeout,
  );

  if (audit) {
    try {
      await saveAuditEntry(context.namespace, audit);
    } catch (error) {
      throw new Error(
        "CONFIGURATION_SAVED_WITHOUT_AUDIT: live configuration was saved, but its audit record could not be stored",
        { cause: error },
      );
    }
  }

  return {
    config: mergedScopeConfig.map(({ name, value }) => ({ name, value })),
    message: "Configuration values updated successfully",
    scope: { code: scopeCode, id: String(scopeId), level: scopeLevel },
    timestamp: new Date().toISOString(),
  };
}

/** Validates the types of request values for fields required on save. */
function validateRequiredSaveEntries(
  entries: SetConfigValue[],
  requiredForSave: Set<string>,
) {
  // Runs before sanitization, so malformed entries must be skipped here rather than crash.
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (typeof entry?.name !== "string") {
      continue;
    }
    const name = entry.name.trim();
    if (requiredForSave.has(name)) {
      parseOrThrow(
        SaveValueSchema,
        entry.value,
        `Field "${name}" required for save must have a valid value`,
      );
    }
  }
}

/** Validates effective values after applying a partial scope update. */
async function validateRequiredSaveConfiguration({
  context,
  entries,
  existingEntries,
  requiredForSave,
  scopeArgs,
  scopeInfo,
}: {
  context: ConfigContext;
  entries: SetConfigValue[];
  existingEntries: ConfigValue[];
  requiredForSave: Set<string>;
  scopeArgs: unknown[];
  scopeInfo: ReturnType<typeof deriveScopeFromArgs>;
}) {
  const touchedRequiredForSave = entries.filter((entry) =>
    requiredForSave.has(entry.name),
  );
  if (touchedRequiredForSave.length === 0) {
    return;
  }

  const { configData } = await resolveEffectiveConfig(context, scopeArgs, {
    scopeConfig: mergeScopes(
      existingEntries,
      entries,
      scopeInfo.scopeCode,
      scopeInfo.scopeLevel,
    ),
  });

  for (const { name } of touchedRequiredForSave) {
    parseOrThrow(
      RequiredValueSchema,
      configData.config.find((entry) => entry.name === name)?.value,
      `Field "${name}" required for save must have a value`,
    );
  }
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
