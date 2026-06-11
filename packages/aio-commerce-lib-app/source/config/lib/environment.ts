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

import { CommerceEnvSchema } from "@adobe/aio-commerce-lib-core/commerce";
import { parseOrThrow } from "@aio-commerce-sdk/common-utils/valibot";

import type { BusinessConfigSchema } from "@adobe/aio-commerce-lib-config";
import type { CommerceEnv } from "@adobe/aio-commerce-lib-core/commerce";
import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** An item (webhook or event) that may be scoped to specific Commerce environments. */
type EnvScopedItem = { env?: string[] };

/** A provider entry whose events may each be scoped to specific environments. */
type ProviderEntry = { events: EnvScopedItem[] };

/**
 * Returns true when an item applies to the given Commerce environment: either it
 * declares no `env` (applies to all environments) or its `env` list includes the
 * environment. This is the single keep-rule shared by install-time filtering and
 * the environment-filtered `app-config` display path.
 *
 * @param item - The webhook or event entry, which may carry an optional `env` array.
 * @param env - The target Commerce environment (e.g. `"paas"` or `"saas"`).
 */
export function appliesToEnv(item: EnvScopedItem, env: CommerceEnv): boolean {
  return item.env === undefined || item.env.includes(env);
}

/**
 * Reads and validates the target Commerce environment from the install workflow params,
 * where the router maps the request's `commerceEnv` onto `AIO_COMMERCE_API_FLAVOR`.
 * Throws if the value is absent or not a recognised Commerce environment.
 *
 * @param params - The runtime action params available to install steps.
 */
export function getInstallCommerceEnv(
  params: RuntimeActionParams,
): CommerceEnv {
  return parseOrThrow(
    CommerceEnvSchema,
    params.AIO_COMMERCE_API_FLAVOR,
    "Missing or unknown commerce environment",
  );
}

/**
 * Filters a provider list to the given environment: each provider keeps only its
 * applicable events, and providers left with no events are dropped entirely.
 */
function filterProvidersByEnv<P extends ProviderEntry>(
  providers: readonly P[],
  env: CommerceEnv,
): P[] {
  return providers
    .map((provider) => ({
      ...provider,
      events: provider.events.filter((event) => appliesToEnv(event, env)),
    }))
    .filter((provider) => provider.events.length > 0);
}

/**
 * Returns a copy of a validated app config scoped to the given Commerce environment:
 * business-config fields and webhooks not applicable to the environment are removed,
 * each event provider keeps only its applicable events, and providers left with no
 * events are dropped. Uses the same `appliesToEnv` keep-rule as the `config` action,
 * so the `app-config` action renders the same scoped set that the rest of the SDK
 * (install and `config`) applies.
 *
 * @param config - The validated app config.
 * @param env - The target Commerce environment (e.g. `"paas"` or `"saas"`).
 */
export function filterAppConfigByEnv(
  config: CommerceAppConfigOutputModel,
  env: CommerceEnv,
): CommerceAppConfigOutputModel {
  const filtered = { ...config };

  if (
    filtered.businessConfig &&
    Array.isArray(filtered.businessConfig.schema)
  ) {
    filtered.businessConfig = {
      ...filtered.businessConfig,
      schema: filtered.businessConfig.schema.filter((field) =>
        appliesToEnv(field, env),
      ),
    };
  }

  if (Array.isArray(filtered.webhooks)) {
    filtered.webhooks = filtered.webhooks.filter((webhook) =>
      appliesToEnv(webhook, env),
    );
  }

  if (filtered.eventing) {
    filtered.eventing = {
      ...filtered.eventing,
      ...(filtered.eventing.commerce && {
        commerce: filterProvidersByEnv(filtered.eventing.commerce, env),
      }),
      ...(filtered.eventing.external && {
        external: filterProvidersByEnv(filtered.eventing.external, env),
      }),
    };
  }

  return filtered;
}

/**
 * Filters a business configuration schema to the fields applicable to the
 * given Commerce environment. Fields without an `env` property apply to all
 * environments and are always included.
 *
 * @param schema - The business configuration schema to filter.
 * @param env - The Commerce environment to filter by.
 */
export function filterSchemaByEnv(
  schema: BusinessConfigSchema,
  env: CommerceEnv,
): BusinessConfigSchema {
  return schema.filter((field) => appliesToEnv(field, env));
}
