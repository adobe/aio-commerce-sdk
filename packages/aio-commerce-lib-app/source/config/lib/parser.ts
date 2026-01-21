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

import { dirname } from "node:path";

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";
import {
  findNearestPackageJson,
  findUp,
} from "@aio-commerce-sdk/scripting-utils/project";
import { createJiti } from "jiti";
import * as v from "valibot";

import {
  CommerceAppConfigDomainsSchema,
  CommerceAppConfigSchema,
  CommerceAppConfigSchemas,
} from "#config/schema/app";

import type { Get } from "type-fest";
import type {
  CommerceAppConfigDomain,
  CommerceAppConfigOutputModel,
} from "#config/schema/app";

const jiti = createJiti(import.meta.url);

// Config paths to search for. In order of likely appearance to speed up the check.
const configPaths = Object.freeze([
  "app.commerce.config.js",
  "app.commerce.config.ts",
  "app.commerce.config.cjs",
  "app.commerce.config.mjs",
  "app.commerce.config.mts",
  "app.commerce.config.cts",
]);

/**
 * Try to find (up to the nearest package.json file) the app config file.
 *
 * Searches for config files in the following order of priority:
 * 1. `app.commerce.config.js` - JavaScript (CommonJS or ESM)
 * 2. `app.commerce.config.ts` - TypeScript
 * 3. `app.commerce.config.cjs` - CommonJS
 * 4. `app.commerce.config.mjs` - ES Module
 * 5. `app.commerce.config.mts` - ES Module TypeScript
 * 6. `app.commerce.config.cts` - CommonJS TypeScript
 *
 * @param cwd The current working directory
 * @returns The path to the config file, or null if not found
 */
export async function resolveCommerceAppConfig(cwd = process.cwd()) {
  const packageJsonPath = await findNearestPackageJson(cwd);

  if (!packageJsonPath) {
    return null;
  }

  const rootDirectory = dirname(packageJsonPath);

  for (const configPath of configPaths) {
    const configFilePath = await findUp(configPath, {
      cwd,
      stopAt: rootDirectory,
    });

    if (configFilePath) {
      return configFilePath;
    }
  }

  return null;
}

/**
 * Read the commerce app config file as-is, without validating it.
 *
 * Supports multiple config file formats (see {@link resolveCommerceAppConfig} for the list).
 * The config file must export a default export with the configuration object.
 *
 * @param cwd The current working directory
 * @returns The raw config object from the file
 * @throws {Error} If no config file is found or if the file doesn't export a default export
 */
export async function readCommerceAppConfig(
  cwd = process.cwd(),
): Promise<unknown> {
  const configFilePath = await resolveCommerceAppConfig(cwd);

  if (!configFilePath) {
    throw new Error(
      "Could not find a commerce app config file in the current working directory or its parents.",
    );
  }

  type ImportedConfig = { default: unknown };
  let config: ImportedConfig | null = null;
  try {
    config = await jiti.import<ImportedConfig>(configFilePath);
  } catch (error) {
    const message = stringifyError(error);
    throw new Error(
      `Failed to read commerce app config file at ${configFilePath}: ${message}`,
      {
        cause: error,
      },
    );
  }

  if (
    !(config && "default" in config) ||
    config.default === undefined ||
    config.default === null ||
    (typeof config.default === "object" &&
      Object.keys(config.default).length === 0)
  ) {
    throw new Error(
      "Commerce app config file does not export a default export. Make sure you use `export default` or `module.exports = { /* your config */ }`",
    );
  }

  return config.default;
}

/**
 * Parse and validate a commerce app configuration object.
 *
 * This function takes a raw configuration object and validates it against the
 * commerce app config schema. If validation succeeds, it returns the validated
 * and typed configuration output model with all transformations applied.
 *
 * @param config - The raw configuration object to parse and validate
 * @returns The validated and parsed config object with output transformations applied
 * @throws {CommerceSdkValidationError} If the configuration is invalid, with detailed validation issues
 *
 * @example
 * ```typescript
 * const rawConfig = {
 *   metadata: {
 *     id: "my-app",
 *     displayName: "My App",
 *     description: "My application",
 *     version: "1.0.0",
 *   }
 * };
 *
 * try {
 *   const validatedConfig = parseCommerceAppConfig(rawConfig);
 *   console.log(validatedConfig.metadata.id); // "my-app"
 * } catch (error) {
 *   if (error instanceof CommerceSdkValidationError) {
 *     console.error('Validation failed:', error.display());
 *   }
 * }
 * ```
 */
export function parseCommerceAppConfig(
  config: unknown,
): CommerceAppConfigOutputModel {
  const validatedConfig = v.safeParse(CommerceAppConfigSchema, config);

  if (!validatedConfig.success) {
    throw new CommerceSdkValidationError("Invalid commerce app config", {
      issues: validatedConfig.issues,
    });
  }

  return validatedConfig.output;
}

/**
 * Parse and validate a specific domain configuration within the commerce app config.
 *
 * This function validates only a specific domain's configuration rather than
 * the entire commerce app configuration object. It first validates that the
 * domain name is valid, then validates the configuration data against the
 * schema for that specific domain. If validation succeeds, it returns the
 * validated and typed configuration output model for that domain.
 *
 * @template T - The type of the domain, constrained to valid domain names.
 *
 * @param config - The domain configuration object to parse and validate
 * @param domain - The name of the domain to validate (e.g., 'metadata', 'businessConfig', 'businessConfig.schema')
 * @returns The validated and parsed configuration for the specified domain with output transformations applied
 * @throws {CommerceSdkValidationError} If the domain name is invalid or if the configuration doesn't match the domain's schema
 *
 * @example
 * ```typescript
 * const businessConfigSchema = [
 *   {
 *     name: 'apiKey',
 *     type: 'text',
 *     label: 'API Key',
 *   }
 * ];
 *
 * try {
 *   const validatedSchema = parseCommerceAppConfigDomain(
 *     businessConfigSchema,
 *     'businessConfig.schema'
 *   );
 *   console.log(validatedSchema[0].name); // "apiKey"
 * } catch (error) {
 *   if (error instanceof CommerceSdkValidationError) {
 *     console.error('Domain validation failed:', error.display());
 *   }
 * }
 * ```
 */
export function parseCommerceAppConfigDomain<T extends CommerceAppConfigDomain>(
  config: unknown,
  domain: T,
): NonNullable<Get<CommerceAppConfigOutputModel, T>> {
  const domainSchema = v.safeParse(CommerceAppConfigDomainsSchema, domain);

  if (!domainSchema.success) {
    throw new CommerceSdkValidationError("Invalid commerce app config domain", {
      issues: domainSchema.issues,
    });
  }

  const domainConfigSchema = CommerceAppConfigSchemas[domain];
  const validatedConfig = v.safeParse(domainConfigSchema, config);

  if (!validatedConfig.success) {
    throw new CommerceSdkValidationError(
      `Invalid commerce app config: ${domain}`,
      {
        issues: validatedConfig.issues,
      },
    );
  }

  return validatedConfig.output as NonNullable<
    Get<CommerceAppConfigOutputModel, T>
  >;
}
