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
  metadataReason,
  metadataValue,
  providerReason,
  providerValue,
  registrationReason,
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

        // Commerce subscription names are unique, so one left under another provider is replaced.
        const isUnderKeptProvider =
          current !== undefined &&
          !leftoverProviderIds.has(current.provider_id);

        return isUnderKeptProvider
          ? update(value, { ...value, changeMode: "replace" }, reason)
          : add(value, reason);
      })
    : [];

  const commerceProvider = ctx.isCommerce
    ? [
        add(
          { ...commerceProviderValue(target), instanceId },
          providerReason(target, ctx),
        ),
      ]
    : [];

  return [
    add(
      { ...providerValue(target, ctx), instanceId },
      providerReason(target, ctx),
    ),
    ...commerceProvider,
    ...target.events.map((event) =>
      add(
        metadataValue(target, event, ctx),
        metadataReason(target, event, ctx),
      ),
    ),
    ...registrationValues(target, instanceId, ctx).map((value) =>
      add(value, registrationReason(target, value, ctx)),
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
    update(before, providerValue(target, ctx), providerReason(target, ctx)),
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
  if (!commerceProvider) {
    const value = {
      ...commerceProviderValue(target),
      instanceId: live.ioProvider.instance_id,
      providerId: live.ioProvider.id,
    };

    return [add(value, reason)];
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

  return [update(before, commerceProviderValue(target), reason)];
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
    if (!current) {
      return [add(value, reason)];
    }

    const before: EventingOperationValue = {
      ...value,
      description: current.description,
      label: current.label,
    };

    const replaceReason = replacedCodes.get(value.eventCode);
    if (replaceReason) {
      return [remove(before, replaceReason), add(value, replaceReason)];
    }

    const isSame =
      current.label === value.label &&
      current.description === value.description;

    if (isSame) {
      return [];
    }

    return [update(before, value, reason)];
  });

  const desiredCodes = new Set(desired.map(({ value }) => value.eventCode));
  const removals = live.ioProvider.metadata
    .filter((entry) => !desiredCodes.has(entry.event_code))
    .map((entry) =>
      remove(
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
      ),
    );

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
    if (!current) {
      return [add(value, reason)];
    }

    kept.add(current);
    const before = registrationValueOf(current, target.key, ctx.type);

    // Apply creates the registration under its new name before it removes the old one.
    if (before.name !== value.name) {
      return [remove(before, reason), add(value, reason)];
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

    return [update(before, value, reason)];
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

      return remove(value, reason);
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
    if (!current || leftoverProviderIds.has(current.provider_id)) {
      return [add(value, reason)];
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

    return [update(value, { ...value, changeMode, providerId }, reason)];
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
        ),
      ]
    : [];

  return [
    ...subscriptions,
    ...live.registrations.map((registration) =>
      remove(registrationValueOf(registration, providerKey, ctx.type), reason),
    ),
    ...ioProvider.metadata.map((entry) =>
      remove(
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
      ),
    ),
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
    ),
  ];
}
