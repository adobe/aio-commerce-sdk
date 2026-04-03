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
 * Object form for defining a custom installation step with both install and uninstall handlers.
 *
 * @template TResult - The return type of the install handler
 */
export type CustomInstallationStepDefinition<TResult = unknown> = {
  /** The installation handler, called when the app is installed. */
  install: CustomInstallationStepHandler<TResult>;

  /** The optional uninstall handler, called when the app is uninstalled. */
  uninstall?: CustomInstallationStepHandler<void>;
};

/**
 * Define a custom installation step with type-safe parameters.
 *
 * This helper provides type safety and IDE autocompletion for custom installation scripts.
 * Accepts either a plain function (install only) or an object with `install` and optional
 * `uninstall` handlers.
 *
 * @example Plain function (install only):
 * ```typescript
 * import { defineCustomInstallationStep } from "@adobe/aio-commerce-lib-app/management";
 *
 * export default defineCustomInstallationStep(async (config, context) => {
 *   const { logger, params } = context;
 *   logger.info(`Setting up ${config.metadata.displayName}...`);
 *   return { status: "success" };
 * });
 * ```
 *
 * @example Object form with install and uninstall:
 * ```typescript
 * import { defineCustomInstallationStep } from "@adobe/aio-commerce-lib-app/management";
 *
 * export default defineCustomInstallationStep({
 *   install: async (config, context) => {
 *     context.logger.info(`Registering ${config.metadata.displayName}...`);
 *     return { status: "success" };
 *   },
 *   uninstall: async (config, context) => {
 *     context.logger.info(`Removing ${config.metadata.displayName}...`);
 *   },
 * });
 * ```
 */
export function defineCustomInstallationStep<TResult = unknown>(
  handler: CustomInstallationStepHandler<TResult>,
): CustomInstallationStepHandler<TResult>;
export function defineCustomInstallationStep<TResult = unknown>(
  definition: CustomInstallationStepDefinition<TResult>,
): CustomInstallationStepDefinition<TResult>;
export function defineCustomInstallationStep<TResult = unknown>(
  handlerOrDefinition:
    | CustomInstallationStepHandler<TResult>
    | CustomInstallationStepDefinition<TResult>,
):
  | CustomInstallationStepHandler<TResult>
  | CustomInstallationStepDefinition<TResult> {
  return handlerOrDefinition;
}
