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

import {
  hasCommerceEvents,
  hasEventing,
  hasExternalEvents,
} from "#config/schema/eventing";

import {
  COMMERCE_PROVIDER_TYPE,
  EXTERNAL_PROVIDER_TYPE,
  getIoEventCode,
  getNamespacedEvent,
  getProviderKey,
  groupEventsByRuntimeActions,
} from "./utils";

import type { EventProviderType } from "@adobe/aio-commerce-lib-events/io-events";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { AppEvent, EventProvider } from "#config/schema/eventing";
import type { DomainCollector } from "#management/upgrade/types";

/** The diff domain for I/O Events providers (both external and Commerce-backed). */
export const IO_EVENTS_PROVIDER_DOMAIN = "ioEventsProvider";

/** The diff domain for I/O Events registrations. */
export const IO_EVENTS_REGISTRATION_DOMAIN = "ioEventsRegistration";

/** The diff domain for I/O Events event metadata. */
export const IO_EVENTS_METADATA_DOMAIN = "ioEventsMetadata";

/** The diff domain for Commerce event subscriptions. */
export const COMMERCE_SUBSCRIPTION_DOMAIN = "commerceSubscription";

/**
 * A single event source (provider + events) tagged with the I/O Events provider type it was
 * configured under. Both source kinds create the same I/O Events entities (provider,
 * registration, metadata), so the I/O collectors iterate over both uniformly.
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

/** Identity: the provider key (see {@link getProviderKey}). Shape: the display fields. */
function collectIoProviders(
  config: CommerceAppConfigOutputModel,
): Map<string, unknown> {
  const map = new Map<string, unknown>();

  for (const { provider } of collectEventSources(config)) {
    map.set(getProviderKey(provider), {
      description: provider.description,
      label: provider.label,
    });
  }

  return map;
}

/** Identity: `${providerKey}:${runtimeAction}`. Shape: the sorted set of I/O event codes routed. */
function collectIoRegistrations(
  config: CommerceAppConfigOutputModel,
): Map<string, unknown> {
  const map = new Map<string, unknown>();
  const { metadata } = config;

  for (const { provider, events, type } of collectEventSources(config)) {
    const providerKey = getProviderKey(provider);
    const actionEventsMap = groupEventsByRuntimeActions(events);

    for (const [runtimeAction, groupedEvents] of actionEventsMap) {
      const eventCodes = groupedEvents
        .map((event) =>
          getIoEventCode(getNamespacedEvent(metadata, event.name), type),
        )
        .sort();

      map.set(`${providerKey}:${runtimeAction}`, { eventCodes });
    }
  }

  return map;
}

/** Identity: `${providerKey}:${eventCode}`. Shape: the metadata display fields. */
function collectIoMetadata(
  config: CommerceAppConfigOutputModel,
): Map<string, unknown> {
  const map = new Map<string, unknown>();
  const { metadata } = config;

  for (const { provider, events, type } of collectEventSources(config)) {
    const providerKey = getProviderKey(provider);

    for (const event of events) {
      const eventCode = getIoEventCode(
        getNamespacedEvent(metadata, event.name),
        type,
      );

      map.set(`${providerKey}:${eventCode}`, {
        description: event.description,
        label: event.label,
      });
    }
  }

  return map;
}

/**
 * Identity: the namespaced Commerce event name (matches the Commerce subscription `name`).
 * Shape: the event minus `name` (the identity) and `runtimeActions` (which route I/O Events
 * registrations, not the Commerce subscription itself).
 */
function collectCommerceSubs(
  config: CommerceAppConfigOutputModel,
): Map<string, unknown> {
  const map = new Map<string, unknown>();
  if (!hasCommerceEvents(config)) {
    return map;
  }

  const { metadata } = config;
  for (const { events } of config.eventing.commerce) {
    for (const event of events) {
      const { name, runtimeActions: _runtimeActions, ...shape } = event;
      map.set(getNamespacedEvent(metadata, name), shape);
    }
  }

  return map;
}

/**
 * The eventing domain collectors registered with the generic upgrade diff engine.
 *
 * Removals are destructive in every eventing domain. In-place `changed` is unsupported for
 * providers, metadata, and Commerce subscriptions (no in-place update API), but supported for
 * I/O registrations (full-replace PUT via `updateRegistration`).
 */
export const eventingDomainCollectors: DomainCollector[] = [
  {
    collect: collectIoProviders,
    domain: IO_EVENTS_PROVIDER_DOMAIN,
    rule: { destructiveOnRemove: true, unsupportedOnChange: true },
  },
  {
    collect: collectIoRegistrations,
    domain: IO_EVENTS_REGISTRATION_DOMAIN,
    rule: { destructiveOnRemove: true, unsupportedOnChange: false },
  },
  {
    collect: collectIoMetadata,
    domain: IO_EVENTS_METADATA_DOMAIN,
    rule: { destructiveOnRemove: true, unsupportedOnChange: true },
  },
  {
    collect: collectCommerceSubs,
    domain: COMMERCE_SUBSCRIPTION_DOMAIN,
    rule: { destructiveOnRemove: true, unsupportedOnChange: true },
  },
];
