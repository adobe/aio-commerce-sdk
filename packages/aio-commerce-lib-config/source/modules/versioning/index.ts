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

import * as v from "valibot";

import {
  deriveScopeFromArgs,
  deriveScopeFromCodeAndLevel,
  deriveScopeFromId,
} from "#config-utils";
import { requireGlobalSchema } from "#modules/schema/config-schema-repository";
import { getPersistedScopeTree } from "#modules/scope-tree/index";
import { DEFAULT_CACHE_TIMEOUT, DEFAULT_NAMESPACE } from "#utils/constants";
import { decrypt } from "#utils/encryption";

import {
  assertLatestVersion,
  listVersionIds,
  parseVersionPage,
  persistVersionedConfig,
  readCurrentSnapshot,
  readVersionRecord,
  toVersionMetadata,
} from "./version-repository";

import type { SelectorBy } from "#config-utils";
import type { ResolvedBusinessConfigSchema } from "#modules/schema/types";
import type { ScopeNode } from "#modules/scope-tree/index";
import type {
  ConfigOptions,
  ConfigurationVersionValue,
  GetConfigurationVersionsParams,
  GetConfigurationVersionsResponse,
  RestoreConfigurationVersionRequest,
  RestoreConfigurationVersionResponse,
} from "#types/index";

const RestoreRequestSchema = v.object({
  expectedLatestVersionId: v.optional(v.pipe(v.string(), v.uuid())),
  fields: v.optional(v.array(v.pipe(v.string(), v.trim(), v.nonEmpty()))),
  versionId: v.pipe(v.string(), v.uuid()),
});

async function resolveScope(selector: SelectorBy) {
  const tree = await getPersistedScopeTree(DEFAULT_NAMESPACE);
  const { by } = selector;
  if (by._tag === "scopeId") {
    return deriveScopeFromId(by.scopeId, tree);
  }
  if (by._tag === "codeAndLevel") {
    return deriveScopeFromCodeAndLevel(by.code, by.level, tree);
  }
  if (by._tag === "commerceScopeId") {
    return deriveScopeFromArgs([by.commerceScopeId, by.level], tree);
  }
  const matches: ScopeNode[] = [];
  const visit = (nodes: ScopeNode[]) => {
    for (const node of nodes) {
      if (node.code === by.code.trim()) {
        matches.push(node);
      }
      visit(node.children ?? []);
    }
  };
  visit(tree);
  if (matches.length > 1) {
    throw new Error(
      "AMBIGUOUS_SCOPE_CODE: select a scope by id or code and level",
    );
  }
  const [match] = matches;
  if (!match) {
    throw new Error(`INVALID_SCOPE: Unknown scope code='${by.code}'`);
  }
  return deriveScopeFromCodeAndLevel(match.code, match.level, tree);
}

/** Rejects historical values incompatible with the current schema or encryption key. */
function assertRestorableValue(
  field: ResolvedBusinessConfigSchema[number],
  entry: ConfigurationVersionValue,
  password: boolean,
  encryptionKey?: string,
) {
  if (
    password !== (field.type === "password") ||
    (typeof entry.value === "boolean") !== (field.type === "boolean") ||
    Array.isArray(entry.value) !==
      (field.type === "list" && field.selectionMode === "multiple")
  ) {
    throw new Error(
      `VERSION_SNAPSHOT_INVALID: incompatible schema for field '${entry.name}'`,
    );
  }
  if (field.type === "list") {
    const allowed = new Set(field.options.map((option) => option.value));
    const values = Array.isArray(entry.value) ? entry.value : [entry.value];
    if (
      values.some((value) => typeof value !== "string" || !allowed.has(value))
    ) {
      throw new Error(
        `VERSION_SNAPSHOT_INVALID: unavailable list option for field '${entry.name}'`,
      );
    }
  }
  if (password && typeof entry.value === "string" && entry.value.length > 0) {
    if (!encryptionKey) {
      throw new Error("Encryption key has not been given");
    }
    decrypt(entry.value, encryptionKey);
  }
}

/**
 * Lists configuration history, newest first, with password values masked.
 *
 * History contains explicit scope overrides, not inherited values or defaults.
 * A code-only selector must identify exactly one scope across all levels.
 *
 * @param selector - Scope to inspect.
 * @param params - Page size (1-200) and non-negative offset.
 * @returns Version history and pagination.
 * @example
 * ```typescript
 * const history = await getConfigurationVersions(byScopeId(scopeId), { limit: 20 });
 * ```
 */
export async function getConfigurationVersions(
  selector: SelectorBy,
  params?: GetConfigurationVersionsParams,
): Promise<GetConfigurationVersionsResponse> {
  requireGlobalSchema();
  const { scopeId, scopeCode, scopeLevel } = await resolveScope(selector);
  const scope = { code: scopeCode, id: scopeId, level: scopeLevel };
  const { limit, offset } = parseVersionPage(params);
  const ids = await listVersionIds(scopeId);
  const records = await Promise.all(
    ids.slice(offset, offset + limit).map((id) => readVersionRecord(scope, id)),
  );
  if (records.some((record) => record === null)) {
    throw new Error("VERSION_SNAPSHOT_INVALID: a listed snapshot is missing");
  }
  return {
    pagination: { limit, offset, total: ids.length },
    scope,
    versions: records.flatMap((record) =>
      record ? [toVersionMetadata(record)] : [],
    ),
  };
}

/**
 * Reapplies selected historical field values and records a new version.
 *
 * Without `fields`, restores only keys changed by the selected version.
 * A field absent from that snapshot is unset, restoring inheritance.
 * Unselected fields remain unchanged. The latest-version check runs before
 * writing but does not serialize concurrent writers across runtime instances.
 *
 * @param selector - Scope to restore.
 * @param request - Source version, optional field subset, and latest-version precondition.
 * @param options - Cache timeout and key for verifying encrypted password values.
 * @returns Restored values (passwords masked) and removed override names.
 * @example
 * ```typescript
 * await restoreConfigurationVersion(byScopeId(scopeId), {
 *   versionId,
 *   fields: ["enabled"],
 *   expectedLatestVersionId: latestVersionId,
 * });
 * ```
 */
export async function restoreConfigurationVersion(
  selector: SelectorBy,
  request: RestoreConfigurationVersionRequest,
  options?: ConfigOptions,
): Promise<RestoreConfigurationVersionResponse> {
  const schema = requireGlobalSchema();
  const parsed = v.safeParse(RestoreRequestSchema, request);
  if (!parsed.success) {
    throw new Error("INVALID_PARAMS: invalid restore request");
  }
  const { scopeId, scopeCode, scopeLevel } = await resolveScope(selector);
  const scope = { code: scopeCode, id: scopeId, level: scopeLevel };
  const source = await readVersionRecord(scope, parsed.output.versionId);
  if (!source) {
    throw new Error(
      "VERSION_NOT_FOUND: version not found for the selected scope",
    );
  }
  const fields = new Set(
    parsed.output.fields ?? [
      ...source.change.added,
      ...source.change.updated,
      ...source.change.removed,
    ],
  );
  if (fields.size === 0) {
    throw new Error("INVALID_PARAMS: no fields selected for restore");
  }
  const schemaFields = new Map(schema.map((field) => [field.name, field]));
  const selected = new Map(
    source.snapshot.config.map((entry) => [entry.name, entry]),
  );
  const previous = await readCurrentSnapshot(scope);
  const next = new Map(previous.config.map((entry) => [entry.name, entry]));
  const restored: RestoreConfigurationVersionResponse["config"] = [];
  const removed: string[] = [];
  for (const name of fields) {
    const field = schemaFields.get(name);
    if (!field) {
      throw new Error(
        `INVALID_PARAMS: field '${name}' is not in the current schema`,
      );
    }
    const entry = selected.get(name);
    if (!entry) {
      next.delete(name);
      removed.push(name);
      continue;
    }
    const password = source.passwordFields.includes(name);
    assertRestorableValue(field, entry, password, options?.encryptionKey);
    next.set(name, {
      ...entry,
      origin: { code: scopeCode, level: scopeLevel },
    });
    restored.push({ name, value: password ? "*****" : entry.value });
  }
  await assertLatestVersion(scopeId, parsed.output.expectedLatestVersionId);
  await persistVersionedConfig(
    {
      cacheTimeout: options?.cacheTimeout ?? DEFAULT_CACHE_TIMEOUT,
      encryptionKey: options?.encryptionKey,
      namespace: DEFAULT_NAMESPACE,
    },
    previous,
    { config: [...next.values()], scope },
    { reason: "restore", restoredFromVersionId: source.id },
  );
  return {
    config: restored,
    message: "Configuration version restored successfully",
    removed,
    restoredFromVersionId: source.id,
    scope,
    timestamp: new Date().toISOString(),
  };
}
