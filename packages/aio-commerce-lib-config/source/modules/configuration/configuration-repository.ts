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

import stringify from "safe-stable-stringify";

import { createVersionRecord } from "#modules/versioning/version-repository";
import { getLogger } from "#utils/logger";
import { getSharedFiles, getSharedState } from "#utils/repository";

import type { ConfigValue } from "./types";

type PersistConfigOptions = {
  reason?: "set" | "restore";
  restoredFromVersionId?: string;
  expectedLatestVersionId?: string;
  /** Password field names to exclude from "updated" in version change (avoids always-marked-changed due to re-encryption). */
  passwordFieldNames?: Set<string>;
};

type PersistedConfigPayload = {
  scope: {
    id: string;
    code: string;
    level: string;
  };
  config: ConfigValue[];
};

/**
 * Gets cached configuration payload from state store.
 *
 * @param scopeCode - Scope code identifier.
 * @returns Promise resolving to cached configuration payload or null if not found.
 */
export async function getCachedConfig(
  scopeCode: string,
): Promise<string | null> {
  try {
    const state = await getSharedState();
    const key = getConfigStateKey(scopeCode);
    const result = await state.get(key);

    if (result.value) {
      const parsed = JSON.parse(result.value);
      return parsed.data || null;
    }
    return null;
  } catch (_) {
    return null;
  }
}

/**
 * Caches configuration payload in state store.
 *
 * @param scopeCode - Scope code identifier.
 * @param payload - Configuration payload as JSON string.
 */
export async function setCachedConfig(
  scopeCode: string,
  payload: string,
): Promise<void> {
  const logger = getLogger(
    "@adobe/aio-commerce-lib-config:configuration-repository",
  );
  try {
    const state = await getSharedState();
    const key = getConfigStateKey(scopeCode);
    await state.put(key, stringify({ data: payload }) ?? "");
  } catch (error) {
    logger.debug(
      "Failed to cache configuration:",
      error instanceof Error ? error.message : String(error),
    );
    // Don't throw - caching failure shouldn't break functionality
  }
}

/**
 * Gets persisted configuration payload from files.
 *
 * @param scopeCode - Scope code identifier.
 * @returns Promise resolving to configuration payload as string or null if not found.
 */
export async function getPersistedConfig(
  scopeCode: string,
): Promise<string | null> {
  try {
    const files = await getSharedFiles();
    const filePath = getConfigFilePath(scopeCode);
    const content = await files.read(filePath);
    return content ? content.toString("utf8") : null;
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    return null;
  }
}

/**
 * Saves configuration payload to files.
 *
 * @param scopeCode - Scope code identifier.
 * @param payload - Configuration payload as JSON string.
 */
export async function saveConfig(
  scopeCode: string,
  payload: string,
): Promise<void> {
  const files = await getSharedFiles();
  const filePath = getConfigFilePath(scopeCode);
  await files.write(filePath, payload);
}

/**
 * Persists configuration with caching strategy (files + state cache).
 *
 * @param scopeCode - The scope code to persist configuration for.
 * @param payload - The configuration payload object.
 */
export async function persistConfig(
  scopeCode: string,
  payload: unknown,
  options: PersistConfigOptions = {},
): Promise<{ id: string } | null> {
  const normalizedPayload = normalizePersistedPayload(payload, scopeCode);
  const payloadString = stringify(normalizedPayload) ?? "";
  const logger = getLogger(
    "@adobe/aio-commerce-lib-config:configuration-repository",
  );

  // Always save to files (primary persistence)
  await saveConfig(scopeCode, payloadString);

  // Try to cache in state for faster reads
  try {
    await setCachedConfig(scopeCode, payloadString);
  } catch (e) {
    logger.debug("Failed to cache configuration in state", {
      scopeCode,
      error: e instanceof Error ? e.message : String(e),
    });
  }

  const createdVersion = await createVersionRecord(
    scopeCode,
    normalizedPayload,
    {
      reason: options.reason ?? "set",
      restoredFromVersionId: options.restoredFromVersionId,
      expectedLatestVersionId: options.expectedLatestVersionId,
      passwordFieldNames: options.passwordFieldNames,
    },
  );
  const createdVersionId = createdVersion.id;

  return createdVersionId ? { id: createdVersionId } : null;
}

function normalizePersistedPayload(
  payload: unknown,
  scopeCode: string,
): PersistedConfigPayload {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("scope" in payload) ||
    !("config" in payload) ||
    typeof payload.scope !== "object" ||
    payload.scope === null ||
    !Array.isArray(payload.config)
  ) {
    return {
      scope: { id: scopeCode, code: scopeCode, level: "unknown" },
      config: [],
    };
  }

  const scope = payload.scope as {
    id?: unknown;
    code?: unknown;
    level?: unknown;
  };
  const configEntries = payload.config
    .filter(
      (
        entry,
      ): entry is {
        name: unknown;
        value: unknown;
        origin?: { code?: unknown; level?: unknown };
      } =>
        typeof entry === "object" &&
        entry !== null &&
        "name" in entry &&
        "value" in entry,
    )
    .map((entry) => {
      let originCode = scopeCode;
      if (typeof scope.code === "string") {
        originCode = scope.code;
      }
      if (entry.origin && typeof entry.origin.code === "string") {
        originCode = entry.origin.code;
      }
      let originLevel = "unknown";
      if (entry.origin && typeof entry.origin.level === "string") {
        originLevel = entry.origin.level;
      } else if (typeof scope.level === "string") {
        originLevel = scope.level;
      }

      return {
        name: typeof entry.name === "string" ? entry.name : String(entry.name),
        value: normalizeConfigValue(entry.value),
        origin: {
          code: originCode,
          level: originLevel,
        },
      };
    });

  return {
    scope: {
      id: typeof scope.id === "string" ? scope.id : scopeCode,
      code: typeof scope.code === "string" ? scope.code : scopeCode,
      level: typeof scope.level === "string" ? scope.level : "unknown",
    },
    config: configEntries,
  };
}

function normalizeConfigValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

/**
 * Tries to load configuration from state cache.
 *
 * @param scopeCode - The scope code to load configuration for.
 * @returns Promise resolving to parsed configuration or null if not found.
 */
async function loadFromStateCache(
  scopeCode: string,
): Promise<PersistedConfigPayload | null> {
  const logger = getLogger(
    "@adobe/aio-commerce-lib-config:configuration-repository",
  );
  try {
    const statePayload = await getCachedConfig(scopeCode);
    if (statePayload) {
      return JSON.parse(statePayload);
    }
  } catch (err) {
    logger.debug("Failed to load configuration from state cache", {
      scopeCode,
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return null;
}

/**
 * Tries to load configuration from persisted files.
 *
 * @param scopeCode - The scope code to load configuration for.
 * @returns Promise resolving to parsed configuration or null if not found.
 */
async function loadFromPersistedFiles(
  scopeCode: string,
): Promise<PersistedConfigPayload | null> {
  const logger = getLogger(
    "@adobe/aio-commerce-lib-config:configuration-repository",
  );
  try {
    const filePayload = await getPersistedConfig(scopeCode);
    if (!filePayload) {
      return null;
    }

    const parsed = JSON.parse(filePayload);

    // Try to cache the file data for future reads
    try {
      await setCachedConfig(scopeCode, filePayload);
    } catch (err) {
      logger.debug("Failed to cache configuration in state", {
        scopeCode,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return parsed;
  } catch (err) {
    if (isNotFoundError(err)) {
      logger.debug(
        `No persisted configuration file found for scope ${scopeCode}.`,
      );
    } else {
      logger.debug(
        `Failed to retrieve configuration from files for scope ${scopeCode}:`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }
  return null;
}

/**
 * Loads configuration with smart fallback strategy (state -> files -> cache).
 *
 * @param scopeCode - The scope code to load configuration for.
 * @returns Promise resolving to configuration payload or null if not found.
 */
export async function loadConfig(
  scopeCode: string,
): Promise<PersistedConfigPayload | null> {
  const fromState = await loadFromStateCache(scopeCode);
  if (fromState) {
    return fromState;
  }

  const fromFiles = await loadFromPersistedFiles(scopeCode);
  if (fromFiles) {
    return fromFiles;
  }

  return null;
}

/**
 * Gets the state key for a given scope code.
 *
 * @param scopeCode - The scope code to get the state key for.
 * @returns State key string.
 */
function getConfigStateKey(scopeCode: string): string {
  return `configuration.${scopeCode}`;
}

/**
 * Gets the file path for a given scope code.
 *
 * @param scopeCode - The scope code to get the file path for.
 * @returns File path string.
 */
function getConfigFilePath(scopeCode: string): string {
  return `scope/${scopeCode.toLowerCase()}/configuration.json`;
}

/**
 * Checks if error is a not-found error.
 *
 * @param err - Error to check.
 * @returns True if error is a not-found error (404 or ENOENT), false otherwise.
 */
function isNotFoundError(err: unknown): boolean {
  const statusNotFound = 404;
  return (
    typeof err === "object" &&
    err !== null &&
    (("statusCode" in err && err.statusCode === statusNotFound) ||
      ("code" in err && err.code === "ENOENT"))
  );
}
