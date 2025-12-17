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

/**
 * Default maximum number of configuration versions to keep per scope.
 * This can be overridden by setting the MAX_CONFIG_VERSIONS environment variable.
 */
export const DEFAULT_MAX_VERSIONS = 25;

/**
 * Environment variable name for configuring maximum versions.
 */
export const MAX_VERSIONS_ENV_VAR = "MAX_CONFIG_VERSIONS";

/**
 * Default pagination limit for version history queries.
 */
export const DEFAULT_VERSION_HISTORY_LIMIT = 25;

/**
 * Default pagination limit for audit log queries.
 */
export const DEFAULT_AUDIT_LOG_LIMIT = 50;

/**
 * Minimum valid version count (must be positive).
 */
export const MIN_VERSION_COUNT = 1;
