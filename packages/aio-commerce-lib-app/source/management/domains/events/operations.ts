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

import stringify from "safe-stable-stringify";

import { getSubscriptionChangeKind } from "./comparison";
import {
  eventCodeOf,
  getNamespacedEvent,
  getRegistrationDescription,
  getRegistrationName,
  groupEventsByRuntimeActions,
} from "./utils";

import type { CommerceEventSubscription } from "@adobe/aio-commerce-lib-events/commerce";
import type { EventProviderType } from "@adobe/aio-commerce-lib-events/io-events";
import type { AppEvent, CommerceEvent } from "#config/schema/eventing";
import type { ApplicationMetadata } from "#config/schema/metadata";
import type { ResourceOperation } from "#management/common/workflow/resource";
import type { LiveEventingProvider, LiveEventingState } from "./live";
import type {
  EventingOperationValue,
  EventingProviderSnapshot,
  SubscriptionValues,
} from "./types";

export type Operation = ResourceOperation<EventingOperationValue>;

export type Reason = Operation["reason"];

export type RegistrationValue = Extract<
  EventingOperationValue,
  { resourceType: "registration" }
>;

/** What the per-provider planners share. */
export type LeafPlanContext = {
  type: EventProviderType;
  isCommerce: boolean;
  metadata: Pick<ApplicationMetadata, "id">;
  workspaceId: string;

  /** Baseline providers by key, to tell a config change from drift. */
  declared: Map<string, EventingProviderSnapshot>;
  subscriptions: LiveEventingState["subscriptions"];
  emptyRegistrations: LiveEventingState["emptyRegistrations"];
  configuredValues: Record<string, Partial<SubscriptionValues>[]>;
};

/** The desired value of a provider. */
export function providerValue(
  target: EventingProviderSnapshot,
  ctx: LeafPlanContext,
): EventingOperationValue {
  return {
    description: target.provider.description,
    label: target.provider.label,
    providerKey: target.key,
    resourceType: "provider",
    type: ctx.type,
  };
}

/** The desired value of a provider's Commerce provider. */
export function commerceProviderValue(
  target: EventingProviderSnapshot,
): EventingOperationValue {
  return {
    description: target.provider.description,
    label: target.provider.label,
    providerKey: target.key,
    resourceType: "commerceProvider",
  };
}

/** The desired value of an event's metadata. */
export function metadataValue(
  target: EventingProviderSnapshot,
  event: AppEvent,
  ctx: LeafPlanContext,
): Extract<EventingOperationValue, { resourceType: "metadata" }> {
  return {
    description: event.description,
    eventCode: eventCodeOf(event, ctx.metadata, ctx.type),
    label: event.label,
    providerKey: target.key,
    resourceType: "metadata",
    type: ctx.type,
  };
}

/** The desired registrations of a provider, one per runtime action. */
export function registrationValues(
  target: EventingProviderSnapshot,
  instanceId: string,
  ctx: LeafPlanContext,
): RegistrationValue[] {
  const provider = {
    instance_id: instanceId,
    label: target.provider.label,
    provider_metadata: ctx.type,
  };

  return [...groupEventsByRuntimeActions(target.events)].map(
    ([runtimeAction, events]) => ({
      description: getRegistrationDescription(provider, events, runtimeAction),
      eventCodes: events
        .map((event) => eventCodeOf(event, ctx.metadata, ctx.type))
        .sort((a, b) => a.localeCompare(b)),
      name: getRegistrationName(provider, runtimeAction),
      providerKey: target.key,
      resourceType: "registration",
      runtimeAction,
      type: ctx.type,
    }),
  );
}

/** The value of a live registration. */
export function registrationValueOf(
  registration: LiveEventingProvider["registrations"][number],
  providerKey: string,
  type: EventProviderType,
): RegistrationValue {
  return {
    description: registration.description,
    eventCodes: registration.events_of_interest
      .map((event) => event.event_code)
      .sort((a, b) => a.localeCompare(b)),
    name: registration.name,
    providerKey,
    registrationId: registration.registration_id,
    resourceType: "registration",
    runtimeAction: registration.runtime_action ?? registration.name,
    type,
  };
}

/** The desired value of an event's Commerce subscription. */
export function subscriptionValue(
  target: EventingProviderSnapshot,
  event: AppEvent,
  ctx: LeafPlanContext,
): Extract<EventingOperationValue, { resourceType: "subscription" }> {
  return {
    name: getNamespacedEvent(ctx.metadata, event.name),
    providerKey: target.key,
    resourceType: "subscription",
  };
}

/** The settings of a subscription or an event config that a config can set. */
export function toSubscriptionValues(
  source: CommerceEventSubscription | CommerceEvent,
): SubscriptionValues {
  return {
    fields: source.fields,
    hipaa_audit_required: source.hipaa_audit_required,
    priority: source.priority,
    rules: source.rules,
  };
}

/** `change` when the target adds a provider or changes its label or description from the baseline. */
export function providerReason(
  target: EventingProviderSnapshot,
  ctx: LeafPlanContext,
): Reason {
  const declared = ctx.declared.get(target.key)?.provider;
  const isSame =
    declared?.label === target.provider.label &&
    declared?.description === target.provider.description;

  return isSame ? "drift" : "change";
}

/** `change` when the target adds an event or changes its label or description from the baseline. */
export function metadataReason(
  target: EventingProviderSnapshot,
  event: AppEvent,
  ctx: LeafPlanContext,
): Reason {
  const declared = declaredEvent(target.key, event.name, ctx);
  const isSame =
    declared?.label === event.label &&
    declared?.description === event.description;

  return isSame ? "drift" : "change";
}

/** `change` when the target's registration differs from the one the baseline declares. */
export function registrationReason(
  target: EventingProviderSnapshot,
  value: RegistrationValue,
  ctx: LeafPlanContext,
): Reason {
  const declared = ctx.declared.get(target.key);
  if (!declared || declared.provider.label !== target.provider.label) {
    return "change";
  }

  const declaredEvents = groupEventsByRuntimeActions(declared.events).get(
    value.runtimeAction,
  );

  const declaredCodes = (declaredEvents ?? [])
    .map((event) => eventCodeOf(event, ctx.metadata, ctx.type))
    .sort((a, b) => a.localeCompare(b));

  return stringify(declaredCodes) === stringify(value.eventCodes)
    ? "drift"
    : "change";
}

/** `change` when the target adds a subscription or changes its settings from the baseline. */
export function subscriptionReason(
  target: EventingProviderSnapshot,
  event: AppEvent,
  ctx: LeafPlanContext,
): Reason {
  const declared = declaredEvent(target.key, event.name, ctx) as
    | CommerceEvent
    | undefined;

  if (!declared) {
    return "change";
  }

  // The baseline is its own evidence, so a setting the target drops counts as a change.
  const declaredValues = toSubscriptionValues(declared);
  const changeKind = getSubscriptionChangeKind(
    declaredValues,
    toSubscriptionValues(event as CommerceEvent),
    [declaredValues],
  );

  return changeKind === "none" ? "drift" : "change";
}

/** The baseline's config for an event of a provider. */
function declaredEvent(
  providerKey: string,
  eventName: string,
  ctx: LeafPlanContext,
): AppEvent | undefined {
  return ctx.declared
    .get(providerKey)
    ?.events.find((event) => event.name === eventName);
}

/** Whether the baseline declares an event code under a provider. */
export function declaresMetadata(
  providerKey: string,
  eventCode: string,
  ctx: LeafPlanContext,
): boolean {
  return (ctx.declared.get(providerKey)?.events ?? []).some(
    (event) => eventCodeOf(event, ctx.metadata, ctx.type) === eventCode,
  );
}

/** Whether the baseline declares a runtime action under a provider. */
export function declaresAction(
  providerKey: string,
  runtimeAction: string,
  ctx: LeafPlanContext,
): boolean {
  const events = ctx.declared.get(providerKey)?.events ?? [];
  return groupEventsByRuntimeActions(events).has(runtimeAction);
}

/** Whether the baseline declares a subscription under a provider. */
export function declaresSubscription(
  providerKey: string,
  name: string,
  ctx: LeafPlanContext,
): boolean {
  return (ctx.declared.get(providerKey)?.events ?? []).some(
    (event) => getNamespacedEvent(ctx.metadata, event.name) === name,
  );
}

export function add(after: EventingOperationValue, reason: Reason): Operation {
  return {
    after,
    id: operationId("add", after),
    kind: "add",
    label: operationLabel("add", after),
    reason,
  };
}

export function update(
  before: EventingOperationValue,
  after: EventingOperationValue,
  reason: Reason,
): Operation {
  return {
    after,
    before,
    id: operationId("update", after),
    kind: "update",
    label: operationLabel("update", after),
    reason,
  };
}

export function remove(
  before: EventingOperationValue,
  reason: Reason,
): Operation {
  return {
    before,
    id: operationId("remove", before),
    kind: "remove",
    label: operationLabel("remove", before),
    reason,
  };
}

/** Builds a version-stable id for a plan operation. */
function operationId(
  kind: Operation["kind"],
  value: EventingOperationValue,
): string {
  switch (value.resourceType) {
    case "provider":
      return `${kind}:provider:${value.providerKey}`;
    case "commerceProvider":
      return `${kind}:commerce-provider:${value.providerKey}`;
    case "metadata":
      return `${kind}:metadata:${value.providerKey}:${value.eventCode}`;
    case "registration":
      return `${kind}:registration:${value.providerKey}:${value.runtimeAction}`;
    case "subscription":
      return `${kind}:subscription:${value.name}`;
    default:
      return kind;
  }
}

const VERBS: Record<Operation["kind"], string> = {
  add: "Create",
  remove: "Remove",
  update: "Update",
};

/** Builds the display label of a plan operation. */
function operationLabel(
  kind: Operation["kind"],
  value: EventingOperationValue,
): string {
  const verb = VERBS[kind];
  switch (value.resourceType) {
    case "provider":
      return `${verb} event provider: ${value.label}`;
    case "commerceProvider":
      return `${verb} Commerce event provider: ${value.label}`;
    case "metadata":
      return `${verb} event metadata: ${value.eventCode}`;
    case "registration":
      return `${verb} registration: ${value.name}`;
    case "subscription":
      return value.changeMode === "replace"
        ? `Replace Commerce subscription: ${value.name}`
        : `${verb} Commerce subscription: ${value.name}`;
    default:
      return verb;
  }
}
