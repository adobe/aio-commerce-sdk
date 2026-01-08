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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import * as v from "valibot";

import {
  CommerceAppConfigSchema,
  CommerceAppConfigSchemas,
} from "#config/schema/app";

import type { Get } from "type-fest";
import type {
  CommerceAppConfigDomain,
  CommerceAppConfigOutputModel,
} from "#config/schema/app";

const commerceAppConfigDomainsSchema = v.picklist(
  Object.keys(CommerceAppConfigSchemas),
);

/**
 * Validates a complete commerce app configuration object against the schema.
 *
 * @param config - The configuration object to validate.
 * @returns The validated and typed configuration output model.
 *
 * @throws {CommerceSdkValidationError} If the configuration is invalid, with
 * detailed validation issues included.
 *
 * @example
 * ```typescript
 * const config = {
 *   businessConfiguration: {
 *     // ... configuration data
 *   }
 * };
 *
 * try {
 *   const validatedConfig = validateCommerceAppConfig(config);
 *   // Use validatedConfig safely
 * } catch (error) {
 *   if (error instanceof CommerceSdkValidationError) {
 *     console.error('Validation failed:', error.display());
 *   }
 * }
 * ```
 */
export function validateCommerceAppConfig(
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
 * Validates a specific domain configuration within the commerce app config.
 *
 * This function validates only a specific domain's configuration rather than
 * the entire commerce app configuration object. It first validates that the
 * domain name is valid, then validates the configuration data against the
 * schema for that specific domain.
 *
 * @template T - The type of the domain, constrained to valid domain names.
 *
 * @param config - The domain configuration object to validate.
 * @param domain - The name of the domain to validate (e.g., 'businessConfiguration').
 * @returns The validated and typed configuration for the specified domain.
 *
 * @throws {CommerceSdkValidationError} If the domain name is invalid or if the
 * configuration doesn't match the domain's schema.
 *
 * @example
 * ```typescript
 * const businessConfig = {
 *   fields: [
 *     {
 *       name: 'category',
 *       type: 'dropdown',
 *       // ... field configuration
 *     }
 *   ]
 * };
 *
 * try {
 *   const validatedConfig = validateCommerceAppConfigDomain(
 *     businessConfig,
 *     'businessConfig'
 *   );
 *   // Use validatedConfig safely
 * } catch (error) {
 *   if (error instanceof CommerceSdkValidationError) {
 *     console.error('Domain validation failed:', error.issues);
 *   }
 * }
 * ```
 */
export function validateCommerceAppConfigDomain<
  T extends CommerceAppConfigDomain,
>(config: unknown, domain: T) {
  const domainSchema = v.safeParse(commerceAppConfigDomainsSchema, domain);

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
