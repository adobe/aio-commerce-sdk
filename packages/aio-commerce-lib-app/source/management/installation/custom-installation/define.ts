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

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { ExecutionContext } from "#management/installation/workflow/step";

/**
 * Handler function type for custom installation steps.
 *
 * @param config - The validated commerce app configuration
 * @param context - Execution context with logger, params, and other utilities
 * @returns The result of the installation step (can be any value or Promise)
 */
export type CustomInstallationStepHandler<TResult = unknown> = (
  config: CommerceAppConfigOutputModel,
  context: ExecutionContext,
) => TResult | Promise<TResult>;

/**
 * Define a custom installation step with type-safe parameters.
 *
 * This helper provides type safety and IDE autocompletion for custom installation scripts.
 * The handler function receives properly typed `config` and `context` parameters.
 *
 * @param handler - The installation step handler function
 * @returns The same handler function (for use as default export)
 *
 * @example
 * ```typescript
 * import { defineCustomInstallationStep } from "@adobe/aio-commerce-lib-app/management";
 *
 * export default defineCustomInstallationStep(async (config, context) => {
 *   const { logger, params } = context;
 *
 *   logger.info(`Setting up ${config.metadata.displayName}...`);
 *
 *   // Your installation logic here
 *   // TypeScript will provide autocompletion for config and context
 *
 *   return {
 *     status: "success",
 *     message: "Setup completed",
 *   };
 * });
 * ```
 */
export function defineCustomInstallationStep<TResult = unknown>(
  handler: CustomInstallationStepHandler<TResult>,
): CustomInstallationStepHandler<TResult> {
  return handler;
}
