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
  add,
  commerceProviderValue,
  declaresAction,
  declaresMetadata,
  declaresSubscription,
  eventRef,
  findDeclaredEvent,
  metadataReason,
  metadataValue,
  providerReason,
  providerRef,
  providerValue,
  registrationReason,
  registrationRefs,
  registrationValueOf,
  registrationValues,
  remove,
  subscriptionReason,
  subscriptionValue,
  toSubscriptionValues,
  update,
} from "./operations";
import {
  generateInstanceId,
  generateInstanceIdDeprecated,
  getIoEventCode,
  getNamespacedEvent,
  getNamespacedNameOfCode,
  getProviderKeyFromInstanceId,
} from "./utils";

import type { CommerceEvent, EventProvider } from "#config/schema/eventing";
import type { LiveEventingProvider } from "./live";
import type {
  LeafPlanContext,
  Operation,
  Reason,
  RegistrationValue,
} from "./operations";
import type { EventingOperationValue, EventingProviderSnapshot } from "./types";

/**
 * Finds the live I/O provider of a config provider: current instance id first, then the legacy
 * one, preferring a provider with metadata over an empty duplicate that shares its instance id.
 */
export function findLiveProvider(
  providers: LiveEventingProvider[],
  provider: EventProvider,
  ctx: LeafPlanContext,
): LiveEventingProvider | null {
  const candidates = [
    generateInstanceId(ctx.metadata, provider, ctx.workspaceId),
    generateInstanceIdDeprecated(ctx.metadata, provider),
  ];

  for (const candidate of candidates) {
    const matches = providers.filter(
      (p) => p.ioProvider.instance_id === candidate,
    );

    if (matches.length > 0) {
      return (
        matches.find((p) => p.ioProvider.metadata.length > 0) ?? matches[0]
      );
    }
  }

  return null;
}

/**
 * Plans every resource of a provider that does not exist live. A subscription that already exists
 * under another provider of the app is replaced, unless that provider is one of the
 * `leftoverProviderIds`, whose removal removes it first.
 */
export function planNewProvider(
  target: EventingProviderSnapshot,
  leftoverProviderIds: ReadonlySet<string>,
  ctx: LeafPlanContext,
): Operation[] {
  const instanceId = generateInstanceId(
    ctx.metadata,
    target.provider,
    ctx.workspaceId,
  );

  const subscriptions = ctx.isCommerce
    ? target.events.map((event) => {
        const value = subscriptionValue(target, event, ctx);
        const reason = subscriptionReason(target, event, ctx);
        const current = ctx.subscriptions.get(value.name);
        const refs = [eventRef(target.key, value.name, event)];

        // Commerce subscription names are unique, so one left under another provider is replaced.
        const isUnderKeptProvider =
          current !== undefined &&
          !leftoverProviderIds.has(current.provider_id);

        return isUnderKeptProvider
          ? update(value, { ...value, changeMode: "replace" }, reason, refs)
          : add(value, reason, refs);
      })
    : [];

  const providerRefs = [providerRef(target.key, target.provider)];
  const commerceProvider = ctx.isCommerce
    ? [
        add(
          { ...commerceProviderValue(target), instanceId },
          providerReason(target, ctx),
          providerRefs,
        ),
      ]
    : [];

  return [
    add(
      { ...providerValue(target, ctx), instanceId },
      providerReason(target, ctx),
      providerRefs,
    ),
    ...commerceProvider,
    ...target.events.map((event) =>
      add(
        metadataValue(target, event, ctx),
        metadataReason(target, event, ctx),
        [
          eventRef(
            target.key,
            getNamespacedEvent(ctx.metadata, event.name),
            event,
          ),
        ],
      ),
    ),
    ...registrationValues(target, instanceId, ctx).map((value) =>
      add(
        value,
        registrationReason(target, value, ctx),
        registrationRefs(target.key, target.events, value.runtimeAction, ctx),
      ),
    ),
    ...subscriptions,
  ];
}

/**
 * Plans the differences between a target provider and its live copy. `leftoverProviderIds` are
 * the owned providers this plan removes, with their subscriptions.
 */
export function planExistingProvider(
  target: EventingProviderSnapshot,
  live: LiveEventingProvider,
  targetSubscriptionNames: ReadonlySet<string>,
  leftoverProviderIds: ReadonlySet<string>,
  ctx: LeafPlanContext,
): Operation[] {
  const providerId = live.ioProvider.id;
  const subscriptions = ctx.isCommerce
    ? planSubscriptions(
        target,
        providerId,
        targetSubscriptionNames,
        leftoverProviderIds,
        ctx,
      )
    : [];

  // Commerce may delete the metadata of an event it unsubscribes, and I/O then drops the event from
  // every registration, so a replaced subscription recreates its metadata and routes it again.
  const replacedCodes = new Map(
    subscriptions.flatMap((op) =>
      op.kind === "update" &&
      op.after.resourceType === "subscription" &&
      op.after.changeMode === "replace"
        ? [[getIoEventCode(op.after.name, ctx.type), op.reason] as const]
        : [],
    ),
  );

  return [
    ...planProviderUpdate(target, live, ctx),
    ...(ctx.isCommerce ? planCommerceProvider(target, live, ctx) : []),
    ...planMetadata(target, live, replacedCodes, ctx),
    ...planRegistrations(target, live, new Set(replacedCodes.keys()), ctx),
    ...subscriptions,
  ];
}

/** Plans an update when the live provider's label or description differs. */
function planProviderUpdate(
  target: EventingProviderSnapshot,
  live: LiveEventingProvider,
  ctx: LeafPlanContext,
): Operation[] {
  const { ioProvider } = live;
  const isSame =
    ioProvider.label === target.provider.label &&
    ioProvider.description === target.provider.description;

  if (isSame) {
    return [];
  }

  const before: EventingOperationValue = {
    description: ioProvider.description,
    label: ioProvider.label,
    providerId: ioProvider.id,
    providerKey: target.key,
    resourceType: "provider",
    type: ctx.type,
  };

  return [
    update(before, providerValue(target, ctx), providerReason(target, ctx), [
      providerRef(target.key, target.provider),
    ]),
  ];
}

/** Plans the Commerce provider: an add when missing, an update when its label or description differs. */
function planCommerceProvider(
  target: EventingProviderSnapshot,
  live: LiveEventingProvider,
  ctx: LeafPlanContext,
): Operation[] {
  const { commerceProvider } = live;
  const reason = providerReason(target, ctx);
  const refs = [providerRef(target.key, target.provider)];
  if (!commerceProvider) {
    const value = {
      ...commerceProviderValue(target),
      instanceId: live.ioProvider.instance_id,
      providerId: live.ioProvider.id,
    };

    return [add(value, reason, refs)];
  }

  const isSame =
    commerceProvider.label === target.provider.label &&
    commerceProvider.description === target.provider.description;

  if (isSame) {
    return [];
  }

  const before: EventingOperationValue = {
    commerceProviderId: String(commerceProvider.id),
    description: commerceProvider.description,
    instanceId: commerceProvider.instance_id ?? live.ioProvider.instance_id,
    label: commerceProvider.label ?? "",
    providerId: commerceProvider.provider_id,
    providerKey: target.key,
    resourceType: "commerceProvider",
  };

  return [update(before, commerceProviderValue(target), reason, refs)];
}

/**
 * Plans metadata adds, updates and removes for a live provider. The live metadata of one of the
 * `replacedCodes` is removed and added again, with the reason of its subscription's replace.
 */
function planMetadata(
  target: EventingProviderSnapshot,
  live: LiveEventingProvider,
  replacedCodes: ReadonlyMap<string, Reason>,
  ctx: LeafPlanContext,
): Operation[] {
  const providerId = live.ioProvider.id;
  const liveByCode = new Map(
    live.ioProvider.metadata.map((entry) => [entry.event_code, entry]),
  );

  const desired = target.events.map((event) => ({
    event,
    value: { ...metadataValue(target, event, ctx), providerId },
  }));

  const changes = desired.flatMap(({ event, value }) => {
    const current = liveByCode.get(value.eventCode);
    const reason = metadataReason(target, event, ctx);
    const refs = [
      eventRef(target.key, getNamespacedEvent(ctx.metadata, event.name), event),
    ];

    if (!current) {
      return [add(value, reason, refs)];
    }

    const before: EventingOperationValue = {
      ...value,
      description: current.description,
      label: current.label,
    };

    const replaceReason = replacedCodes.get(value.eventCode);
    if (replaceReason) {
      return [
        remove(before, replaceReason, refs),
        add(value, replaceReason, refs),
      ];
    }

    const isSame =
      current.label === value.label &&
      current.description === value.description;

    if (isSame) {
      return [];
    }

    return [update(before, value, reason, refs)];
  });

  const desiredCodes = new Set(desired.map(({ value }) => value.eventCode));
  const removals = live.ioProvider.metadata
    .filter((entry) => !desiredCodes.has(entry.event_code))
    .map((entry) => {
      const name = getNamespacedNameOfCode(entry.event_code, ctx.type);
      return remove(
        {
          description: entry.description,
          eventCode: entry.event_code,
          label: entry.label,
          providerId,
          providerKey: target.key,
          resourceType: "metadata",
          type: ctx.type,
        },
        declaresMetadata(target.key, entry.event_code, ctx)
          ? "change"
          : "drift",
        [
          eventRef(
            target.key,
            name,
            findDeclaredEvent(target.key, name, ctx) ?? entry,
          ),
        ],
      );
    });

  return [...changes, ...removals];
}

/**
 * Plans registration adds, updates and removes for a live provider. A registration that routes
 * one of the `replacedCodes` is updated even when it matches, to route the event again.
 */
function planRegistrations(
  target: EventingProviderSnapshot,
  live: LiveEventingProvider,
  replacedCodes: ReadonlySet<string>,
  ctx: LeafPlanContext,
): Operation[] {
  const { ioProvider } = live;
  const desired = registrationValues(target, ioProvider.instance_id, ctx).map(
    (value) => ({ ...value, providerId: ioProvider.id }),
  );

  const kept = new Set<LiveEventingProvider["registrations"][number]>();
  const changes = desired.flatMap((value) => {
    const current = findRegistration(live, value, ctx);
    const reason = registrationReason(target, value, ctx);
    const refs = registrationRefs(
      target.key,
      target.events,
      value.runtimeAction,
      ctx,
    );

    if (!current) {
      return [add(value, reason, refs)];
    }

    kept.add(current);
    const before = registrationValueOf(current, target.key, ctx.type);

    // Apply creates the registration under its new name before it removes the old one.
    if (before.name !== value.name) {
      return [remove(before, reason, refs), add(value, reason, refs)];
    }

    const isSame =
      before.description === value.description &&
      stringify(before.eventCodes) === stringify(value.eventCodes) &&
      current.enabled !== false &&
      current.delivery_type === "webhook";

    const routesReplacedEvent = value.eventCodes.some((code) =>
      replacedCodes.has(code),
    );

    if (isSame && !routesReplacedEvent) {
      return [];
    }

    return [update(before, value, reason, refs)];
  });

  const desiredActions = new Set(desired.map((value) => value.runtimeAction));
  const duplicates = live.registrations
    .filter(
      (registration) =>
        !kept.has(registration) &&
        desiredActions.has(registration.runtime_action ?? registration.name),
    )
    .map((registration) =>
      remove(registrationValueOf(registration, target.key, ctx.type), "drift"),
    );

  const removals = live.registrations
    .filter(
      (registration) =>
        !desiredActions.has(registration.runtime_action ?? registration.name),
    )
    .map((registration) => {
      const value = registrationValueOf(registration, target.key, ctx.type);
      const reason = declaresAction(target.key, value.runtimeAction, ctx)
        ? "change"
        : "drift";

      const refs = registrationRefs(
        target.key,
        ctx.declared.get(target.key)?.events ?? [],
        value.runtimeAction,
        ctx,
      );

      return remove(value, reason, refs);
    });

  return [...changes, ...duplicates, ...removals];
}

/**
 * Finds the live registration for a desired one by runtime action, preferring the one with the
 * desired name. Falls back to an empty registration with the desired name, so it is updated
 * instead of created again.
 */
function findRegistration(
  live: LiveEventingProvider,
  desired: RegistrationValue,
  ctx: LeafPlanContext,
) {
  const forAction = live.registrations.filter(
    (registration) => registration.runtime_action === desired.runtimeAction,
  );

  return (
    forAction.find((r) => r.name === desired.name) ??
    forAction[0] ??
    ctx.emptyRegistrations.find((r) => r.name === desired.name)
  );
}

/**
 * Plans Commerce subscription adds, updates and removes for a live provider. A subscription under
 * one of the `leftoverProviderIds` is added, since removing the leftover removes it first.
 */
function planSubscriptions(
  target: EventingProviderSnapshot,
  providerId: string,
  targetSubscriptionNames: ReadonlySet<string>,
  leftoverProviderIds: ReadonlySet<string>,
  ctx: LeafPlanContext,
): Operation[] {
  const changes = target.events.flatMap((event) => {
    const value = subscriptionValue(target, event, ctx);
    const reason = subscriptionReason(target, event, ctx);
    const current = ctx.subscriptions.get(value.name);
    const refs = [eventRef(target.key, value.name, event)];
    if (!current || leftoverProviderIds.has(current.provider_id)) {
      return [add(value, reason, refs)];
    }

    const changeMode =
      current.provider_id === providerId
        ? getSubscriptionChangeKind(
            toSubscriptionValues(current),
            toSubscriptionValues(event as CommerceEvent),
            ctx.configuredValues[value.name],
          )
        : "replace";

    if (changeMode === "none") {
      return [];
    }

    return [update(value, { ...value, changeMode, providerId }, reason, refs)];
  });

  const removals = [...ctx.subscriptions.values()]
    .filter(
      (subscription) =>
        subscription.provider_id === providerId &&
        !targetSubscriptionNames.has(subscription.name),
    )
    .map((subscription) =>
      remove(
        {
          name: subscription.name,
          providerKey: target.key,
          resourceType: "subscription",
        },
        declaresSubscription(target.key, subscription.name, ctx)
          ? "change"
          : "drift",
        [
          eventRef(
            target.key,
            subscription.name,
            findDeclaredEvent(target.key, subscription.name, ctx),
          ),
        ],
      ),
    );

  return [...changes, ...removals];
}

/** Plans the removal of an owned live provider no target provider matches, with everything on it. */
export function planLeftoverProvider(
  live: LiveEventingProvider,
  appId: string,
  ctx: LeafPlanContext,
): Operation[] {
  const { ioProvider, commerceProvider } = live;
  const declared = [...ctx.declared.values()].find(
    (snapshot) => findLiveProvider([live], snapshot.provider, ctx) !== null,
  );

  const providerKey =
    declared?.key ??
    getProviderKeyFromInstanceId(
      ioProvider.instance_id,
      appId,
      ctx.workspaceId,
    );

  const reason: Reason = declared ? "change" : "drift";
  const subscriptions = [...ctx.subscriptions.values()]
    .filter((subscription) => subscription.provider_id === ioProvider.id)
    .map((subscription) =>
      remove(
        { name: subscription.name, providerKey, resourceType: "subscription" },
        reason,
        [
          eventRef(
            providerKey,
            subscription.name,
            findDeclaredEvent(providerKey, subscription.name, ctx),
          ),
        ],
      ),
    );

  const commerce = commerceProvider
    ? [
        remove(
          {
            commerceProviderId: String(commerceProvider.id),
            description: commerceProvider.description,
            instanceId: commerceProvider.instance_id ?? ioProvider.instance_id,
            label: commerceProvider.label ?? ioProvider.label,
            providerId: commerceProvider.provider_id,
            providerKey,
            resourceType: "commerceProvider",
          },
          reason,
          [providerRef(providerKey, declared?.provider ?? commerceProvider)],
        ),
      ]
    : [];

  return [
    ...subscriptions,
    ...live.registrations.map((registration) => {
      const value = registrationValueOf(registration, providerKey, ctx.type);
      const refs = registrationRefs(
        providerKey,
        declared?.events ?? [],
        value.runtimeAction,
        ctx,
      );

      return remove(value, reason, refs);
    }),
    ...ioProvider.metadata.map((entry) => {
      const name = getNamespacedNameOfCode(entry.event_code, ctx.type);
      return remove(
        {
          description: entry.description,
          eventCode: entry.event_code,
          label: entry.label,
          providerId: ioProvider.id,
          providerKey,
          resourceType: "metadata",
          type: ctx.type,
        },
        reason,
        [
          eventRef(
            providerKey,
            name,
            findDeclaredEvent(providerKey, name, ctx) ?? entry,
          ),
        ],
      );
    }),
    ...commerce,
    remove(
      {
        description: ioProvider.description,
        label: ioProvider.label,
        providerId: ioProvider.id,
        providerKey,
        resourceType: "provider",
        type: ctx.type,
      },
      reason,
      [providerRef(providerKey, declared?.provider ?? ioProvider)],
    ),
  ];
}
