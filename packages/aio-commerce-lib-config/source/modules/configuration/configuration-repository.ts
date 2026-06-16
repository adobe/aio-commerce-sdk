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

import { getLogger } from "#utils/logger";
import { getSharedFiles, getSharedState } from "#utils/repository";

/**
 * Describes where a record lives in the two-layer store: how an id maps to its
 * `aio-lib-state` cache key and its `aio-lib-files` path. Parameterising this
 * lets the same storage logic back distinct namespaces (Business Configuration
 * under `configuration.*` / `scope/`, SDK system config under `system.*` /
 * `system/`) without duplicating the cache/file fallback machinery.
 */
export type RepositoryNamespace = {
  /** Builds the `aio-lib-state` cache key for an id. */
  stateKey: (id: string) => string;
  /** Builds the `aio-lib-files` path for an id. */
  filePath: (id: string) => string;
  /** Prefix used to list the namespace's files. */
  filesPrefix: string;
};

/** Storage layout for scope-keyed Business Configuration. */
const CONFIGURATION_NAMESPACE: RepositoryNamespace = {
  stateKey: (scopeCode) => `configuration.${scopeCode}`,
  filePath: (scopeCode) =>
    `scope/${scopeCode.toLowerCase()}/configuration.json`,
  filesPrefix: "scope/",
};

/**
 * Storage layout for SDK-managed system config. The key already carries the
 * `system.` prefix (e.g. `system.association`), so it doubles as the cache key
 * and keeps these entries cleanly separated from `configuration.*`.
 */
export const SYSTEM_NAMESPACE: RepositoryNamespace = {
  stateKey: (key) => key,
  filePath: (key) => `system/${key}.json`,
  filesPrefix: "system/",
};

/**
 * Gets cached configuration payload from state store.
 *
 * @param scopeCode - Scope code identifier.
 * @param namespace - Storage namespace to read from.
 * @returns Promise resolving to cached configuration payload or null if not found.
 */
export async function getCachedConfig(
  scopeCode: string,
  namespace: RepositoryNamespace = CONFIGURATION_NAMESPACE,
) {
  try {
    const state = await getSharedState();
    const key = namespace.stateKey(scopeCode);
    const result = await state.get(key);

    if (result.value) {
      const parsed = JSON.parse(result.value);
      return parsed.data || null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Caches configuration payload in state store.
 *
 * @param scopeCode - Scope code identifier.
 * @param payload - Configuration payload as JSON string.
 * @param ttlSeconds - Time to live for the cached configuration value.
 * @param namespace - Storage namespace to write to.
 */
export async function setCachedConfig(
  scopeCode: string,
  payload: string,
  ttlSeconds: number,
  namespace: RepositoryNamespace = CONFIGURATION_NAMESPACE,
) {
  const logger = getLogger(
    "@adobe/aio-commerce-lib-config:configuration-repository",
  );
  try {
    const state = await getSharedState();
    const key = namespace.stateKey(scopeCode);
    await state.put(key, stringify({ data: payload }) as string, {
      ttl: ttlSeconds,
    });
  } catch (error) {
    logger.debug(
      "Failed to cache configuration; invalidating cache entry:",
      error instanceof Error ? error.message : String(error),
    );
    // The read path trusts a cache hit unconditionally, so a stale entry must
    // never be left behind to shadow the freshly persisted source of truth.
    await deleteCachedConfig(scopeCode, namespace);
  }
}

/**
 * Removes a configuration entry from the state cache. Failures are swallowed
 * (logged at debug) since `aio-lib-files` remains the source of truth.
 *
 * @param scopeCode - Scope code identifier.
 * @param namespace - Storage namespace to delete from.
 */
async function deleteCachedConfig(
  scopeCode: string,
  namespace: RepositoryNamespace = CONFIGURATION_NAMESPACE,
) {
  const logger = getLogger(
    "@adobe/aio-commerce-lib-config:configuration-repository",
  );
  try {
    const state = await getSharedState();
    await state.delete(namespace.stateKey(scopeCode));
  } catch (error) {
    logger.debug(
      "Failed to clear cached configuration:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Gets persisted configuration payload from files.
 *
 * @param scopeCode - Scope code identifier.
 * @param namespace - Storage namespace to read from.
 * @returns Promise resolving to configuration payload as string or null if not found.
 */
export async function getPersistedConfig(
  scopeCode: string,
  namespace: RepositoryNamespace = CONFIGURATION_NAMESPACE,
) {
  try {
    const files = await getSharedFiles();
    const filePath = namespace.filePath(scopeCode);
    const filesList = await files.list(namespace.filesPrefix);
    const fileObject = filesList.find((file) => file.name === filePath);

    if (!fileObject) {
      return null;
    }

    const content = await files.read(filePath);
    return content ? content.toString("utf8") : null;
  } catch {
    return null;
  }
}

/**
 * Saves configuration payload to files.
 *
 * @param scopeCode - Scope code identifier.
 * @param payload - Configuration payload as JSON string.
 * @param namespace - Storage namespace to write to.
 */
export async function saveConfig(
  scopeCode: string,
  payload: string,
  namespace: RepositoryNamespace = CONFIGURATION_NAMESPACE,
) {
  const files = await getSharedFiles();
  const filePath = namespace.filePath(scopeCode);
  await files.write(filePath, payload);
}

/**
 * Removes a configuration entry's file from storage. Failures are swallowed
 * (logged at debug) so clearing a non-existent entry is a no-op.
 *
 * @param scopeCode - Scope code identifier.
 * @param namespace - Storage namespace to delete from.
 */
async function deletePersistedConfig(
  scopeCode: string,
  namespace: RepositoryNamespace = CONFIGURATION_NAMESPACE,
) {
  const logger = getLogger(
    "@adobe/aio-commerce-lib-config:configuration-repository",
  );
  try {
    const files = await getSharedFiles();
    await files.delete(namespace.filePath(scopeCode));
  } catch (error) {
    logger.debug(
      "Failed to delete persisted configuration:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Persists configuration with caching strategy (files + state cache).
 *
 * @param scopeCode - The scope code to persist configuration for.
 * @param payload - The configuration payload object.
 * @param ttlSeconds - Time to live for the cached configuration value.
 * @param namespace - Storage namespace to persist to.
 */
export async function persistConfig(
  scopeCode: string,
  payload: unknown,
  ttlSeconds: number,
  namespace: RepositoryNamespace = CONFIGURATION_NAMESPACE,
) {
  const payloadString = stringify(payload) as string;
  const logger = getLogger(
    "@adobe/aio-commerce-lib-config:configuration-repository",
  );

  // Always save to files (primary persistence)
  await saveConfig(scopeCode, payloadString, namespace);

  // Try to cache in state for faster reads
  try {
    await setCachedConfig(scopeCode, payloadString, ttlSeconds, namespace);
  } catch (e) {
    logger.debug("Failed to cache configuration in state", {
      scopeCode,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

/**
 * Removes a configuration entry from both storage layers.
 *
 * @param scopeCode - The scope code to delete configuration for.
 * @param namespace - Storage namespace to delete from.
 */
export async function deleteConfig(
  scopeCode: string,
  namespace: RepositoryNamespace = CONFIGURATION_NAMESPACE,
) {
  await deletePersistedConfig(scopeCode, namespace);
  await deleteCachedConfig(scopeCode, namespace);
}

/**
 * Tries to load configuration from state cache.
 *
 * @param scopeCode - The scope code to load configuration for.
 * @param namespace - Storage namespace to load from.
 * @returns Promise resolving to parsed configuration or null if not found.
 */
async function loadFromStateCache(
  scopeCode: string,
  namespace: RepositoryNamespace = CONFIGURATION_NAMESPACE,
) {
  const logger = getLogger(
    "@adobe/aio-commerce-lib-config:configuration-repository",
  );
  try {
    const statePayload = await getCachedConfig(scopeCode, namespace);
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
 * @param ttlSeconds - Time to live for the cached configuration value.
 * @param namespace - Storage namespace to load from.
 * @returns Promise resolving to parsed configuration or null if not found.
 */
async function loadFromPersistedFiles(
  scopeCode: string,
  ttlSeconds: number,
  namespace: RepositoryNamespace = CONFIGURATION_NAMESPACE,
) {
  const logger = getLogger(
    "@adobe/aio-commerce-lib-config:configuration-repository",
  );
  try {
    const filePayload = await getPersistedConfig(scopeCode, namespace);
    if (!filePayload) {
      return null;
    }

    // Try to cache the file data for future reads
    try {
      await setCachedConfig(scopeCode, filePayload, ttlSeconds, namespace);
    } catch (err) {
      logger.debug("Failed to cache configuration in state", {
        scopeCode,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return JSON.parse(filePayload);
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
 * @param ttlSeconds - Time to live for the cached configuration value.
 * @param namespace - Storage namespace to load from.
 * @returns Promise resolving to configuration payload or null if not found.
 */
export async function loadConfig(
  scopeCode: string,
  ttlSeconds: number,
  namespace: RepositoryNamespace = CONFIGURATION_NAMESPACE,
) {
  const fromState = await loadFromStateCache(scopeCode, namespace);
  if (fromState) {
    return fromState;
  }

  const fromFiles = await loadFromPersistedFiles(
    scopeCode,
    ttlSeconds,
    namespace,
  );
  if (fromFiles) {
    return fromFiles;
  }

  return null;
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
