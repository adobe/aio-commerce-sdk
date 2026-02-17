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

import * as v from "valibot";

import {
  hasBusinessConfig,
  hasBusinessConfigSchema,
  SchemaBusinessConfig,
} from "./business-configuration";
import {
  EventingSchema,
  hasCommerceEvents,
  hasExternalEvents,
} from "./eventing";
import {
  hasCustomInstallation,
  hasCustomInstallationSteps,
  InstallationSchema,
} from "./installation";
import { hasMetadata, MetadataSchema } from "./metadata";

import type { CommerceAppConfigOutputModel } from "./app";

/** The individual validatable domains of the app config. */
export const CommerceAppConfigSchemas = {
  metadata: MetadataSchema,
  businessConfig: SchemaBusinessConfig,
  eventing: EventingSchema,
  installation: InstallationSchema,

  "businessConfig.schema": v.unwrap(SchemaBusinessConfig.entries.schema),
  "eventing.commerce": v.unwrap(EventingSchema.entries.commerce),
  "eventing.external": v.unwrap(EventingSchema.entries.external),
  "installation.customInstallationSteps": v.unwrap(
    InstallationSchema.entries.customInstallationSteps,
  ),
} as const;

/** Individual validatable domains of the commerce app config. */
export type CommerceAppConfigDomain = keyof typeof CommerceAppConfigSchemas;

/**
 * Get the config domains that are present in the config.
 * @param config - The configuration to check.
 */
export function getConfigDomains(
  config: CommerceAppConfigOutputModel,
): Set<CommerceAppConfigDomain> {
  const withCommerceEvents = hasCommerceEvents(config);
  const withExternalEvents = hasExternalEvents(config);

  const domains: Record<CommerceAppConfigDomain, boolean> = {
    metadata: hasMetadata(config),
    businessConfig: hasBusinessConfig(config),
    eventing: withCommerceEvents || withExternalEvents,
    installation: hasCustomInstallation(config),

    "businessConfig.schema": hasBusinessConfigSchema(config),
    "eventing.commerce": withCommerceEvents,
    "eventing.external": withExternalEvents,
    "installation.customInstallationSteps": hasCustomInstallationSteps(config),
  };

  const domainsList = Object.entries(domains)
    .filter(([_, value]) => value)
    .map(([key]) => key as CommerceAppConfigDomain);

  return new Set<CommerceAppConfigDomain>(domainsList);
}

/**
 * Check if the config has a specific domain.
 * @param config - The configuration to check.
 * @param domain - The domain to check.
 */
export function hasConfigDomain(
  config: CommerceAppConfigOutputModel,
  domain: CommerceAppConfigDomain,
): boolean {
  return getConfigDomains(config).has(domain);
}
