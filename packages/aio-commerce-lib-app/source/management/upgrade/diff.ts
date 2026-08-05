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

import { hasAdminUi } from "#config/schema/admin-ui";
import { hasBusinessConfigSchema } from "#config/schema/business-configuration";
import {
  hasCommerceEvents,
  hasEventing,
  hasExternalEvents,
} from "#config/schema/eventing";
import { hasCustomInstallationSteps } from "#config/schema/installation";
import { hasWebhooks } from "#config/schema/webhooks";
import {
  COMMERCE_PROVIDER_TYPE,
  EXTERNAL_PROVIDER_TYPE,
  getIoEventCode,
  getNamespacedEvent,
  groupEventsByRuntimeActions,
} from "#management/installation/events/utils";

import type { EventProviderType } from "@adobe/aio-commerce-lib-events/io-events";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { AppEvent, EventProvider } from "#config/schema/eventing";
import type { ConfigDiff, ResourceChange, ResourceDomain } from "./types";

type ResourceMap = Map<string, unknown>;

function stableEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(sortKeys(a)) === JSON.stringify(sortKeys(b));
}

/** Marks a serialized function value so it's distinguishable from an equivalent string literal. */
const FUNCTION_VALUE_MARKER = "__function__:";

function sortKeys(value: unknown): unknown {
  // JSON.stringify silently drops function-valued properties (e.g. a `dynamicList`
  // field's `options`/`default` factory), which would make a function-only change
  // invisible to `stableEqual`. Serializing to source text keeps the comparison
  // deterministic: identical sources stay equal, a changed source is detected.
  if (typeof value === "function") {
    return `${FUNCTION_VALUE_MARKER}${value.toString()}`;
  }

  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([x], [y]) => x.localeCompare(y))
        .map(([k, v]) => [k, sortKeys(v)]),
    );
  }

  return value;
}

type DomainRule = {
  destructiveOnRemove: boolean;
  unsupportedOnChange: boolean;
};

/**
 * Diffs a single resource domain between the installed snapshot and the target config.
 * Emits one {@link ResourceChange} per identity present in either map.
 */
function diffDomain(
  domain: ResourceDomain,
  oldMap: ResourceMap,
  newMap: ResourceMap,
  rule: DomainRule,
): ResourceChange[] {
  const changes: ResourceChange[] = [];
  const ids = new Set([...oldMap.keys(), ...newMap.keys()]);

  for (const identity of ids) {
    const before = oldMap.get(identity);
    const after = newMap.get(identity);
    const inOld = oldMap.has(identity);
    const inNew = newMap.has(identity);

    if (inOld && !inNew) {
      changes.push({
        before,
        destructive: rule.destructiveOnRemove,
        domain,
        identity,
        kind: "removed",
        supported: true,
      });
    } else if (!inOld && inNew) {
      changes.push({
        after,
        destructive: false,
        domain,
        identity,
        kind: "added",
        supported: true,
      });
    } else if (stableEqual(before, after)) {
      changes.push({
        after,
        before,
        destructive: false,
        domain,
        identity,
        kind: "unchanged",
        supported: true,
      });
    } else {
      changes.push({
        after,
        before,
        destructive: false,
        domain,
        identity,
        kind: "changed",
        supported: !rule.unsupportedOnChange,
      });
    }
  }

  return changes;
}

// --- per-domain collectors (return Map<identity, mutableShape>) ---
//
// Identity keys must be version-stable and match what the installation flow actually
// creates so a reconcile can match the installed snapshot against the target config.
// Cross-referenced against `source/management/installation/events/utils.ts` and
// `source/management/installation/webhooks/helpers.ts`.

/**
 * A single event source (provider + events) tagged with the I/O Events provider type
 * it was configured under (Commerce or external). Both source kinds create the same
 * I/O Events entities (provider, registration, metadata), so provider/registration/metadata
 * collectors iterate over both uniformly.
 */
type TypedEventSource = {
  events: AppEvent[];
  provider: EventProvider;
  type: EventProviderType;
};

/** Collects every Commerce and external event source, tagged with its I/O Events provider type. */
function collectEventSources(
  config: CommerceAppConfigOutputModel,
): TypedEventSource[] {
  if (!hasEventing(config)) {
    return [];
  }

  const commerceSources = hasCommerceEvents(config)
    ? config.eventing.commerce.map((source) => ({
        ...source,
        type: COMMERCE_PROVIDER_TYPE as EventProviderType,
      }))
    : [];

  const externalSources = hasExternalEvents(config)
    ? config.eventing.external.map((source) => ({
        ...source,
        type: EXTERNAL_PROVIDER_TYPE as EventProviderType,
      }))
    : [];

  return [...commerceSources, ...externalSources];
}

/**
 * The provider's own identity: its explicit `key`, or its label slugified — the same
 * fallback `generateInstanceId` uses when building the I/O Events `instance_id`.
 */
function getProviderKey(provider: EventProvider): string {
  return provider.key ?? provider.label.toLowerCase().replace(/\s+/g, "-");
}

/** Identity: the namespaced Commerce event name (matches the Commerce subscription `name`). */
function collectCommerceSubs(
  config: CommerceAppConfigOutputModel,
): ResourceMap {
  const map: ResourceMap = new Map();
  if (!hasCommerceEvents(config)) {
    return map;
  }

  const { metadata } = config;
  for (const { events } of config.eventing.commerce) {
    for (const event of events) {
      const identity = getNamespacedEvent(metadata, event.name);

      // `name` is the identity; `runtimeActions` route I/O Events registrations, not
      // the Commerce subscription itself, so it's tracked under `ioEventsRegistration`.
      const {
        name: _name,
        runtimeActions: _runtimeActions,
        ...mutableShape
      } = event;

      map.set(identity, mutableShape);
    }
  }

  return map;
}

/** Identity: `${webhook_method}:${webhook_type}:${batch_name}:${hook_name}` (the Commerce hook key). */
function collectWebhooks(config: CommerceAppConfigOutputModel): ResourceMap {
  const map: ResourceMap = new Map();
  if (!hasWebhooks(config)) {
    return map;
  }

  for (const entry of config.webhooks) {
    const { webhook, ...entryRest } = entry;
    const {
      webhook_method: method,
      webhook_type: type,
      batch_name: batchName,
      hook_name: hookName,
      ...webhookRest
    } = webhook;

    const identity = `${method}:${type}:${batchName}:${hookName}`;
    map.set(identity, { ...entryRest, webhook: webhookRest });
  }

  return map;
}

/** Identity: the provider key (see {@link getProviderKey}). */
function collectIoProviders(config: CommerceAppConfigOutputModel): ResourceMap {
  const map: ResourceMap = new Map();

  for (const { provider } of collectEventSources(config)) {
    const identity = getProviderKey(provider);
    map.set(identity, {
      description: provider.description,
      label: provider.label,
    });
  }

  return map;
}

/** Identity: `${providerKey}:${runtimeAction}` (one registration per runtime action per provider). */
function collectIoRegistrations(
  config: CommerceAppConfigOutputModel,
): ResourceMap {
  const map: ResourceMap = new Map();
  const { metadata } = config;

  for (const { provider, events, type } of collectEventSources(config)) {
    const providerKey = getProviderKey(provider);
    const actionEventsMap = groupEventsByRuntimeActions(events);

    for (const [runtimeAction, groupedEvents] of actionEventsMap) {
      const identity = `${providerKey}:${runtimeAction}`;
      const eventCodes = groupedEvents
        .map((event) =>
          getIoEventCode(getNamespacedEvent(metadata, event.name), type),
        )
        .sort();

      map.set(identity, { eventCodes });
    }
  }

  return map;
}

/** Identity: `${providerKey}:${eventCode}` (the fully qualified I/O Events event code). */
function collectIoMetadata(config: CommerceAppConfigOutputModel): ResourceMap {
  const map: ResourceMap = new Map();
  const { metadata } = config;

  for (const { provider, events, type } of collectEventSources(config)) {
    const providerKey = getProviderKey(provider);

    for (const event of events) {
      const eventCode = getIoEventCode(
        getNamespacedEvent(metadata, event.name),
        type,
      );
      const identity = `${providerKey}:${eventCode}`;

      map.set(identity, { description: event.description, label: event.label });
    }
  }

  return map;
}

/** Identity: the fixed string `"adminUi"` — a single presence-only surface set. */
function collectAdminUi(config: CommerceAppConfigOutputModel): ResourceMap {
  const map: ResourceMap = new Map();
  if (hasAdminUi(config)) {
    map.set("adminUi", config.adminUi);
  }

  return map;
}

/** Identity: the custom installation step's `name`. */
function collectCustomSteps(config: CommerceAppConfigOutputModel): ResourceMap {
  const map: ResourceMap = new Map();
  if (!hasCustomInstallationSteps(config)) {
    return map;
  }

  for (const step of config.installation.customInstallationSteps) {
    const { name, ...mutableShape } = step;
    map.set(name, mutableShape);
  }

  return map;
}

/** Identity: the business configuration field's `name`. */
function collectBusinessConfig(
  config: CommerceAppConfigOutputModel,
): ResourceMap {
  const map: ResourceMap = new Map();
  if (!hasBusinessConfigSchema(config)) {
    return map;
  }

  for (const field of config.businessConfig.schema) {
    const { name, ...mutableShape } = field;
    map.set(name, mutableShape);
  }

  return map;
}

/**
 * Computes the full resource-level diff between the installed snapshot and the target
 * config, across every managed domain. This is a pure function: it only reasons about
 * the two config objects, with no I/O and no knowledge of what is actually deployed.
 *
 * @param oldConfig - The config the current installation snapshot was built from.
 * @param newConfig - The target config to diff against.
 */
export function diffConfig(
  oldConfig: CommerceAppConfigOutputModel,
  newConfig: CommerceAppConfigOutputModel,
): ConfigDiff {
  const changes: ResourceChange[] = [
    ...diffDomain(
      "commerceSubscription",
      collectCommerceSubs(oldConfig),
      collectCommerceSubs(newConfig),
      { destructiveOnRemove: true, unsupportedOnChange: true },
    ),
    ...diffDomain(
      "commerceWebhook",
      collectWebhooks(oldConfig),
      collectWebhooks(newConfig),
      { destructiveOnRemove: false, unsupportedOnChange: true },
    ),
    ...diffDomain(
      "ioEventsProvider",
      collectIoProviders(oldConfig),
      collectIoProviders(newConfig),
      { destructiveOnRemove: true, unsupportedOnChange: false },
    ),
    ...diffDomain(
      "ioEventsRegistration",
      collectIoRegistrations(oldConfig),
      collectIoRegistrations(newConfig),
      { destructiveOnRemove: true, unsupportedOnChange: false },
    ),
    ...diffDomain(
      "ioEventsMetadata",
      collectIoMetadata(oldConfig),
      collectIoMetadata(newConfig),
      { destructiveOnRemove: true, unsupportedOnChange: false },
    ),
    ...diffDomain(
      "adminUi",
      collectAdminUi(oldConfig),
      collectAdminUi(newConfig),
      { destructiveOnRemove: true, unsupportedOnChange: false },
    ),
    ...diffDomain(
      "customStep",
      collectCustomSteps(oldConfig),
      collectCustomSteps(newConfig),
      { destructiveOnRemove: false, unsupportedOnChange: false },
    ),
    ...diffDomain(
      "businessConfig",
      collectBusinessConfig(oldConfig),
      collectBusinessConfig(newConfig),
      { destructiveOnRemove: true, unsupportedOnChange: false },
    ),
  ];

  return { changes };
}

const OPERATIVE: ReadonlySet<ResourceChange["kind"]> = new Set([
  "added",
  "removed",
  "changed",
]);

/** True when the diff has no `added`, `removed`, or `changed` entries (i.e. nothing to apply). */
export function isEmptyPlan(diff: ConfigDiff): boolean {
  return !diff.changes.some((c) => OPERATIVE.has(c.kind));
}

/** True when applying the diff would lose merchant data or silently remove merchant-visible behavior. */
export function configHasDestructiveChange(diff: ConfigDiff): boolean {
  return diff.changes.some((c) => c.destructive && OPERATIVE.has(c.kind));
}

/** True when the diff contains a change the reconcile engine cannot apply today. */
export function configHasUnsupportedChange(diff: ConfigDiff): boolean {
  return diff.changes.some((c) => !c.supported && OPERATIVE.has(c.kind));
}
