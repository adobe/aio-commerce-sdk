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

import { getConfiguration } from "./get-config";

import type { GetConfigurationByKeyResponse } from "../../types";
import type { ConfigContext } from "./types";

/**
 * Gets a specific configuration value by key for a scope identified by code and level or id.
 *
 * This function retrieves a single configuration value for a specific scope. It's useful
 * when you only need one configuration field rather than the entire configuration object.
 * The value includes origin information indicating where it was inherited from.
 *
 * @param context - Configuration context containing namespace and cache timeout.
 * @param configKey - The name of the configuration field to retrieve.
 * @param args - Scope identifier: either `(id: string)` or `(code: string, level: string)`.
 * @returns Promise resolving to configuration response with scope information and single config value (or null if not found).
 *
 * @throws {Error} If the scope arguments are invalid or the scope is not found.
 */
export async function getConfigurationByKey(
  context: ConfigContext,
  configKey: string,
  ...args: unknown[]
) {
  const fullConfig = await getConfiguration(context, ...args);
  const configValue =
    fullConfig.config.find((item) => item.name === configKey) || null;

  return {
    scope: fullConfig.scope,
    config: configValue,
  } satisfies GetConfigurationByKeyResponse;
}
