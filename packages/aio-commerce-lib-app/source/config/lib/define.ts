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

import type { CommerceAppConfig } from "#config/schema/app";

/**
 * Helper to type-safely define the app config.
 * @param config - The app config to define.
 *
 * @example
 * ```typescript
 * import { defineConfig } from "@adobe/aio-commerce-lib-app";
 *
 * // In app.commerce.config.js
 * export default defineConfig({
 *   // You get autocompletion and type-safety for the config object.
 *   businessConfig: { ... }
 * });
 */
export function defineConfig(config: CommerceAppConfig) {
  // This function does nothing, is only used for type-inference and autocompletion purposes.
  // It's a common pattern with configuration files. For example Vitest and TSDown,
  // two of the tools used in this repo, use this pattern for their config files.
  return config;
}
