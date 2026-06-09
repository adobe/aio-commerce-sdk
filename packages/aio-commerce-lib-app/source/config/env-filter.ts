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

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** An item (webhook or event) that may be scoped to specific Commerce environments. */
type EnvScopedItem = { env?: readonly string[] };

/** A provider entry whose events may each be scoped to specific environments. */
type ProviderEntry = { events: readonly EnvScopedItem[] };

/**
 * Returns true when an item applies to the given Commerce environment: either it
 * declares no `env` (applies to all environments) or its `env` list includes the
 * environment. This is the single keep-rule shared by install-time filtering and
 * the environment-filtered `app-config` display path.
 *
 * @param item - The webhook or event entry, which may carry an optional `env` array.
 * @param env - The target Commerce environment (e.g. `"paas"` or `"saas"`).
 */
export function appliesToEnv(item: EnvScopedItem, env: string): boolean {
  return item.env === undefined || item.env.includes(env);
}

/**
 * Reads the target Commerce environment from the install workflow params, where the
 * router maps the request's `commerceEnv` onto `AIO_COMMERCE_API_FLAVOR`.
 *
 * @param params - The runtime action params available to install steps.
 */
export function getInstallCommerceEnv(params: RuntimeActionParams): string {
  return String(params.AIO_COMMERCE_API_FLAVOR ?? "");
}

/**
 * Filters a provider list to the given environment: each provider keeps only its
 * applicable events, and providers left with no events are dropped entirely.
 */
function filterProvidersByEnv<P extends ProviderEntry>(
  providers: readonly P[],
  env: string,
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
 * webhooks not applicable to the environment are removed, each event provider keeps
 * only its applicable events, and providers left with no events are dropped. Used by
 * the `app-config` action so App Management renders the same scoped set that install
 * creates.
 *
 * @param config - The validated app config.
 * @param env - The target Commerce environment (e.g. `"paas"` or `"saas"`).
 */
export function filterAppConfigByEnv(
  config: CommerceAppConfigOutputModel,
  env: string,
): CommerceAppConfigOutputModel {
  const filtered = { ...config };

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
