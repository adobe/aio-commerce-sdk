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

import { getLogger } from "../../utils/logger";
import { getSharedFiles, getSharedState } from "../../utils/repository";

/**
 * Get cached configuration payload from state store
 */
export async function getCachedConfig(scopeCode: string) {
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
 * Cache configuration payload in state store
 */
export async function setCachedConfig(scopeCode: string, payload: string) {
  const logger = getLogger(
    "@adobe/aio-commerce-lib-config:configuration-repository",
  );
  try {
    const state = await getSharedState();
    const key = getConfigStateKey(scopeCode);
    await state.put(key, JSON.stringify({ data: payload }));
  } catch (error) {
    logger.debug(
      "Failed to cache configuration:",
      error instanceof Error ? error.message : String(error),
    );
    // Don't throw - caching failure shouldn't break functionality
  }
}

/**
 * Get persisted configuration payload from files
 */
export async function getPersistedConfig(scopeCode: string) {
  try {
    const files = await getSharedFiles();
    const filePath = getConfigFilePath(scopeCode);
    const filesList = await files.list("scope/");
    const fileObject = filesList.find((file) => file.name === filePath);

    if (!fileObject) {
      return null;
    }

    const content = await files.read(filePath);
    return content ? content.toString("utf8") : null;
  } catch (_) {
    return null;
  }
}

/**
 * Save configuration payload to files
 */
export async function saveConfig(scopeCode: string, payload: string) {
  const files = await getSharedFiles();
  const filePath = getConfigFilePath(scopeCode);
  await files.write(filePath, payload);
}

/**
 * Persist configuration with caching strategy (files + state cache)
 * @param scopeCode - The scope code to persist configuration for
 * @param payload - The configuration payload object
 */
export async function persistConfig(scopeCode: string, payload: unknown) {
  const payloadString = JSON.stringify(payload);
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
}

/**
 * Try to load configuration from state cache
 * @param scopeCode - The scope code to load configuration for
 * @returns The parsed configuration or null if not found
 */
async function loadFromStateCache(scopeCode: string) {
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
 * Try to load configuration from persisted files
 * @param scopeCode - The scope code to load configuration for
 * @returns The parsed configuration or null if not found
 */
async function loadFromPersistedFiles(scopeCode: string) {
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
      await setCachedConfig(scopeCode, JSON.stringify(parsed));
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
 * Load configuration with smart fallback strategy (state -> files -> cache)
 * @param scopeCode - The scope code to load configuration for
 * @returns The configuration payload or null if not found
 */
export async function loadConfig(scopeCode: string) {
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
 * Get the state key for a given scope code
 * @param scopeCode - The scope code to get the configuration for
 */
function getConfigStateKey(scopeCode: string): string {
  return `configuration.${scopeCode}`;
}

/**
 * Get the file path for a given scope code
 * @param scopeCode - The scope code to get the configuration for
 */
function getConfigFilePath(scopeCode: string): string {
  return `scope/${scopeCode.toLowerCase()}/configuration.json`;
}

/**
 * Check if error is a not-found error
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
