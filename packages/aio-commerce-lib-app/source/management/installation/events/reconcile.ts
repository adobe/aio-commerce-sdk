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

import { unwrapHttpError } from "@adobe/aio-commerce-lib-api/utils";

import { UnsupportedReconcileChangeError } from "#management/upgrade/errors";

import {
  configureCommerceEventing,
  createOrGetIoEventProvider,
  createOrGetIoEventRegistration,
  createOrGetIoProviderEventMetadata,
  deleteIoEventProvider,
  onboardCommerceEventing,
  onboardIoEvents,
} from "./helpers";
import {
  generateInstanceId,
  generateInstanceIdDeprecated,
  getCommerceEventingExistingData,
  getIoEventCode,
  getIoEventsExistingData,
  getLegacyRegistrationName,
  getNamespacedEvent,
  getProviderKey,
  getRegistrationDescription,
  getRegistrationName,
  groupEventsByRuntimeActions,
  makeWorkspaceConfig,
  sanitizeEventingIdentifier,
} from "./utils";

import type { EventProviderType } from "@adobe/aio-commerce-lib-events/io-events";
import type {
  AppEvent,
  CommerceEvent,
  EventProvider,
} from "#config/schema/eventing";
import type { ApplicationMetadata } from "#config/schema/metadata";
import type { ConfigDiff, ResourceChange } from "#management/upgrade/types";
import type { EventsExecutionContext } from "./context";
import type {
  ExistingCommerceEventingData,
  ExistingIoEventsData,
  IoEventProviderWithMetadata,
} from "./utils";

/** A single event source (provider + its events) as it appears in the target config. */
export type EventSourceForReconcile = {
  provider: EventProvider;
  events: AppEvent[];
};

/** The diff kinds a reconcile handler actually needs to act on. */
type OperativeChange = ResourceChange & {
  kind: "added" | "removed" | "changed";
};

function isOperative(change: ResourceChange): change is OperativeChange {
  return (
    change.kind === "added" ||
    change.kind === "removed" ||
    change.kind === "changed"
  );
}

/**
 * Derives the provider key a change belongs to.
 * `ioEventsProvider` identities *are* the provider key; `ioEventsRegistration`/`ioEventsMetadata`
 * identities are prefixed with it (`${providerKey}:${runtimeAction | eventCode}`).
 */
function providerKeyOf(change: OperativeChange): string {
  return change.domain === "ioEventsProvider"
    ? change.identity
    : (change.identity.split(":")[0] ?? change.identity);
}

/**
 * A minimal {@link EventProvider} stub built from just a provider key, sufficient to
 * recompute the deployed provider's `instance_id` for a `removed` change. `key` takes
 * priority over `label` in {@link generateInstanceId}/{@link generateInstanceIdDeprecated},
 * so the placeholder `label` below is never actually used once `key` is set.
 */
function providerStubFromKey(providerKey: string): EventProvider {
  return { description: "", key: providerKey, label: providerKey };
}

/**
 * Finds the deployed I/O Events provider entity matching a provider key, by recomputing
 * its `instance_id` (current and legacy formats) the same way installation does. Returns
 * `null` when nothing is deployed for that key (e.g. it was already removed).
 */
function findDeployedProvider(
  providerKey: string,
  metadata: ApplicationMetadata,
  workspaceId: string,
  existingData: ExistingIoEventsData,
): IoEventProviderWithMetadata | null {
  const stub = providerStubFromKey(providerKey);
  const instanceId = generateInstanceId(metadata, stub, workspaceId);
  const instanceIdDeprecated = generateInstanceIdDeprecated(metadata, stub);

  return (
    existingData.providersWithMetadata.find(
      (p) =>
        p.instance_id === instanceId || p.instance_id === instanceIdDeprecated,
    ) ?? null
  );
}

async function reconcileProviderChange(
  change: OperativeChange,
  sourceByKey: Map<string, EventSourceForReconcile>,
  metadata: ApplicationMetadata,
  providerType: EventProviderType,
  existingData: ExistingIoEventsData,
  context: EventsExecutionContext,
): Promise<void> {
  const providerKey = providerKeyOf(change);

  if (change.kind === "changed") {
    throw new UnsupportedReconcileChangeError({
      domain: "ioEventsProvider",
      identity: change.identity,
    });
  }

  if (change.kind === "added") {
    // Ownership is unambiguous for `added`: the provider is only present in the
    // config passed to whichever leaf step (commerce/external) actually owns it.
    const source = sourceByKey.get(providerKey);
    if (!source) {
      return;
    }

    const instanceId = generateInstanceId(
      metadata,
      source.provider,
      context.appData.workspaceId,
    );

    await createOrGetIoEventProvider(
      {
        context,
        provider: { ...source.provider, instanceId, type: providerType },
      },
      existingData.providersWithMetadata,
    );

    return;
  }

  // `removed`: the provider is no longer present in *any* source, so ownership can't be
  // determined from the target config alone. Both the commerce and external reconcile
  // calls attempt removed-provider cleanup; the API-level lookup below is a no-op if the
  // provider was already deleted (e.g. by the sibling step, or because it never matched
  // this call's providerType), so it's safe for both to try.
  const providerData = findDeployedProvider(
    providerKey,
    metadata,
    context.appData.workspaceId,
    existingData,
  );

  if (!providerData) {
    context.logger.info(
      `No deployed I/O Events provider found for "${providerKey}", skipping removal.`,
    );
    return;
  }

  await deleteIoEventProvider(
    providerData,
    providerStubFromKey(providerKey),
    context,
  );
}

async function reconcileRegistrationChange(
  change: OperativeChange,
  sourceByKey: Map<string, EventSourceForReconcile>,
  metadata: ApplicationMetadata,
  providerType: EventProviderType,
  existingData: ExistingIoEventsData,
  context: EventsExecutionContext,
): Promise<void> {
  const providerKey = providerKeyOf(change);
  const runtimeAction = change.identity.slice(providerKey.length + 1);

  if (change.kind === "added") {
    const source = sourceByKey.get(providerKey);
    if (!source) {
      return;
    }

    const instanceId = generateInstanceId(
      metadata,
      source.provider,
      context.appData.workspaceId,
    );

    const providerData = await createOrGetIoEventProvider(
      {
        context,
        provider: { ...source.provider, instanceId, type: providerType },
      },
      existingData.providersWithMetadata,
    );

    const groupedEvents =
      groupEventsByRuntimeActions(source.events).get(runtimeAction) ?? [];

    if (groupedEvents.length === 0) {
      return;
    }

    await createOrGetIoEventRegistration(
      {
        context,
        events: groupedEvents,
        metadata,
        provider: providerData,
        runtimeAction,
      },
      existingData.registrations,
    );

    return;
  }

  if (change.kind === "changed") {
    const source = sourceByKey.get(providerKey);
    if (!source) {
      return;
    }

    const instanceId = generateInstanceId(
      metadata,
      source.provider,
      context.appData.workspaceId,
    );

    const providerData = await createOrGetIoEventProvider(
      {
        context,
        provider: { ...source.provider, instanceId, type: providerType },
      },
      existingData.providersWithMetadata,
    );

    const groupedEvents =
      groupEventsByRuntimeActions(source.events).get(runtimeAction) ?? [];

    const name = getRegistrationName(providerData, runtimeAction);
    const legacyName = getLegacyRegistrationName(providerData, runtimeAction);
    const clientId = context.params.AIO_COMMERCE_AUTH_IMS_CLIENT_ID;

    const existing = existingData.registrations.find(
      (reg) =>
        reg.client_id === clientId &&
        (reg.name === name || reg.name === legacyName),
    );

    if (!existing) {
      context.logger.warn(
        `No deployed I/O Events registration found for "${change.identity}" to update; skipping.`,
      );
      return;
    }

    // Full-replace PUT: the entire registration body is rebuilt from the target config,
    // not merged with the previous one.
    await context.ioEventsClient.updateRegistration({
      clientId,
      consumerOrgId: context.appData.consumerOrgId,
      deliveryType: "webhook",
      description: getRegistrationDescription(
        providerData,
        groupedEvents,
        runtimeAction,
      ),
      enabled: true,
      eventsOfInterest: groupedEvents.map((event) => ({
        eventCode: getIoEventCode(
          getNamespacedEvent(metadata, event.name),
          providerType,
        ),
        providerId: providerData.id,
      })),
      name,
      projectId: context.appData.projectId,
      registrationId: existing.registration_id,
      runtimeAction,
      workspaceId: context.appData.workspaceId,
    });

    return;
  }

  // `removed` — see the ownership note in `reconcileProviderChange`.
  const providerData = findDeployedProvider(
    providerKey,
    metadata,
    context.appData.workspaceId,
    existingData,
  );

  if (!providerData) {
    return;
  }

  const name = getRegistrationName(providerData, runtimeAction);
  const legacyName = getLegacyRegistrationName(providerData, runtimeAction);
  const clientId = context.params.AIO_COMMERCE_AUTH_IMS_CLIENT_ID;

  const existing = existingData.registrations.find(
    (reg) =>
      reg.client_id === clientId &&
      (reg.name === name || reg.name === legacyName),
  );

  if (!existing) {
    return;
  }

  try {
    await context.ioEventsClient.deleteRegistration({
      consumerOrgId: context.appData.consumerOrgId,
      projectId: context.appData.projectId,
      registrationId: existing.registration_id,
      workspaceId: context.appData.workspaceId,
    });
  } catch (error) {
    const msg = await unwrapHttpError(error);
    context.logger.warn(
      `Failed to delete I/O Events registration "${existing.name}" (ID: ${existing.id}) during reconcile: ${msg}. Continuing.`,
    );
  }
}

async function reconcileMetadataChange(
  change: OperativeChange,
  sourceByKey: Map<string, EventSourceForReconcile>,
  metadata: ApplicationMetadata,
  providerType: EventProviderType,
  existingData: ExistingIoEventsData,
  context: EventsExecutionContext,
): Promise<void> {
  const providerKey = providerKeyOf(change);
  const eventCode = change.identity.slice(providerKey.length + 1);

  if (change.kind === "changed") {
    throw new UnsupportedReconcileChangeError({
      domain: "ioEventsMetadata",
      identity: change.identity,
    });
  }

  if (change.kind === "added") {
    const source = sourceByKey.get(providerKey);
    if (!source) {
      return;
    }

    const instanceId = generateInstanceId(
      metadata,
      source.provider,
      context.appData.workspaceId,
    );

    const providerData = await createOrGetIoEventProvider(
      {
        context,
        provider: { ...source.provider, instanceId, type: providerType },
      },
      existingData.providersWithMetadata,
    );

    const event = source.events.find(
      (candidate) =>
        getIoEventCode(
          getNamespacedEvent(metadata, candidate.name),
          providerType,
        ) === eventCode,
    );

    if (!event) {
      return;
    }

    const existingMetadata =
      existingData.providersWithMetadata.find((p) => p.id === providerData.id)
        ?.metadata ?? [];

    await createOrGetIoProviderEventMetadata(
      { context, event, metadata, provider: providerData, type: providerType },
      existingMetadata,
    );

    return;
  }

  // `removed` — see the ownership note in `reconcileProviderChange`.
  const providerData = findDeployedProvider(
    providerKey,
    metadata,
    context.appData.workspaceId,
    existingData,
  );

  if (!providerData) {
    return;
  }

  const existingMetadata = providerData.metadata ?? [];
  const match = existingMetadata.find((m) => m.event_code === eventCode);
  if (!match) {
    return;
  }

  try {
    await context.ioEventsClient.deleteEventMetadataForProvider({
      consumerOrgId: context.appData.consumerOrgId,
      eventCode,
      projectId: context.appData.projectId,
      providerId: providerData.id,
      workspaceId: context.appData.workspaceId,
    });
  } catch (error) {
    const msg = await unwrapHttpError(error);
    context.logger.warn(
      `Failed to delete I/O Events metadata "${eventCode}" from provider "${providerData.id}" during reconcile: ${msg}. Continuing.`,
    );
  }
}

// KNOWN GAP (App Upgrade Phase 1): whole-domain removal is not reconciled. The update
// step tree is built from the target config only (see `createRootInstallationStep` /
// `createInitialState`), so a branch's `when` guard (e.g. `hasCommerceEvents`,
// `hasExternalEvents`) excludes it entirely once every source of that kind is removed —
// meaning this function, and its `removed` cleanup, never runs at all for that domain.
// Removals WITHIN a still-present domain (e.g. one of several providers/events/
// registrations removed while at least one sibling remains) DO reconcile correctly.
// Tracked for a future task: either union old+new config when building the update tree,
// or route whole-domain removals through the existing cleanup-list/uninstall path.

/**
 * Reconciles I/O Events provider/registration/metadata changes for one set of event
 * sources — either `config.eventing.commerce` or `config.eventing.external` — as owned
 * by a single eventing leaf step.
 *
 * `added`/`changed` changes are only applied when their provider key matches one of
 * `sources` (ownership is unambiguous, since it's read straight from the target config).
 * `removed` changes are attempted regardless of `sources`, since a removed provider is by
 * definition absent from every source in the target config; the underlying API calls are
 * idempotent no-ops when the resource is already gone, so it's safe for both the commerce
 * and external reconcile calls to attempt the same cleanup in a given update.
 *
 * @param sources - The event sources (provider + events) from the target config that this
 * call owns (e.g. `config.eventing.commerce`).
 * @param metadata - The application metadata (for namespacing/instance IDs).
 * @param providerType - Whether these sources are Commerce- or externally-sourced.
 * @param diff - The full computed config diff.
 * @param context - The events execution context (API clients, logger, app data).
 */
export async function reconcileIoEvents(
  sources: EventSourceForReconcile[],
  metadata: ApplicationMetadata,
  providerType: EventProviderType,
  diff: ConfigDiff,
  context: EventsExecutionContext,
): Promise<void> {
  const relevant = diff.changes.filter(
    (change): change is OperativeChange =>
      isOperative(change) &&
      (change.domain === "ioEventsProvider" ||
        change.domain === "ioEventsRegistration" ||
        change.domain === "ioEventsMetadata"),
  );

  if (relevant.length === 0) {
    return;
  }

  const existingData = await getIoEventsExistingData(context);
  const sourceByKey = new Map(
    sources.map((source) => [getProviderKey(source.provider), source]),
  );

  for (const change of relevant) {
    if (change.domain === "ioEventsProvider") {
      // biome-ignore lint/performance/noAwaitInLoops: changes must be applied sequentially since a provider must exist before its registrations/metadata are created
      await reconcileProviderChange(
        change,
        sourceByKey,
        metadata,
        providerType,
        existingData,
        context,
      );
      continue;
    }

    if (change.domain === "ioEventsRegistration") {
      await reconcileRegistrationChange(
        change,
        sourceByKey,
        metadata,
        providerType,
        existingData,
        context,
      );
      continue;
    }

    await reconcileMetadataChange(
      change,
      sourceByKey,
      metadata,
      providerType,
      existingData,
      context,
    );
  }
}

/**
 * Onboards a single newly-added Commerce event: I/O Events provider/metadata/registration,
 * the Commerce Eventing module configuration, and the Commerce-side provider/subscription.
 * Every step is create-or-get/idempotent, so this is safe to call even if some of the
 * provider's other entities already exist.
 */
async function reconcileAddedCommerceSubscription(
  provider: EventProvider,
  event: CommerceEvent,
  metadata: ApplicationMetadata,
  context: EventsExecutionContext,
  existingIoEventsData: ExistingIoEventsData,
  existingCommerceData: ExistingCommerceEventingData,
): Promise<void> {
  const { providerData, eventsData } = await onboardIoEvents(
    {
      context,
      events: [event],
      metadata,
      provider,
      providerType: "dx_commerce_events",
    },
    existingIoEventsData,
  );

  const workspaceConfiguration = JSON.stringify(makeWorkspaceConfig(context));
  await configureCommerceEventing(
    {
      config: {
        enabled: true,
        environment_id: sanitizeEventingIdentifier(context.appData.projectName),
        instance_id: providerData.instance_id,
        merchant_id: sanitizeEventingIdentifier(context.appData.orgName),
        workspace_configuration: workspaceConfiguration,
      },
      context,
    },
    existingCommerceData,
  );

  await onboardCommerceEventing(
    {
      context,
      ioData: {
        events: eventsData,
        provider: providerData,
        workspaceConfiguration,
      },
      metadata,
      provider,
    },
    existingCommerceData,
  );
}

/**
 * Reconciles `commerceSubscription` changes: `added` onboards the full Commerce/I/O Events
 * chain for the new event (see {@link reconcileAddedCommerceSubscription}); `removed`
 * unsubscribes the event directly (the identity is already the namespaced Commerce event
 * name, so no config lookup is needed); `changed` is unsupported until the Commerce PUT
 * endpoint (spec §7.1) exists.
 *
 * @param sources - The Commerce event sources from the target config.
 * @param metadata - The application metadata (for namespacing).
 * @param diff - The full computed config diff.
 * @param context - The events execution context.
 */
export async function reconcileCommerceSubscriptions(
  sources: EventSourceForReconcile[],
  metadata: ApplicationMetadata,
  diff: ConfigDiff,
  context: EventsExecutionContext,
): Promise<void> {
  const relevant = diff.changes.filter(
    (change): change is OperativeChange =>
      isOperative(change) && change.domain === "commerceSubscription",
  );

  if (relevant.length === 0) {
    return;
  }

  const eventByNamespacedName = new Map<
    string,
    { provider: EventProvider; event: CommerceEvent }
  >();

  for (const source of sources) {
    for (const event of source.events as CommerceEvent[]) {
      eventByNamespacedName.set(getNamespacedEvent(metadata, event.name), {
        event,
        provider: source.provider,
      });
    }
  }

  const [existingIoEventsData, existingCommerceData] = await Promise.all([
    getIoEventsExistingData(context),
    getCommerceEventingExistingData(context),
  ]);

  for (const change of relevant) {
    if (change.kind === "changed") {
      throw new UnsupportedReconcileChangeError({
        domain: "commerceSubscription",
        identity: change.identity,
      });
    }

    if (change.kind === "removed") {
      try {
        // biome-ignore lint/performance/noAwaitInLoops: unsubscribes hit the Adobe Commerce API sequentially, matching the existing uninstall behavior
        await context.commerceEventsClient.deleteEventSubscription({
          name: change.identity,
        });

        context.logger.info(
          `Unsubscribed Commerce event subscription for "${change.identity}" during reconcile.`,
        );
      } catch (error) {
        const msg = await unwrapHttpError(error);
        context.logger.warn(
          `Failed to unsubscribe Commerce event subscription for "${change.identity}" during reconcile: ${msg}. Continuing.`,
        );
      }

      continue;
    }

    const found = eventByNamespacedName.get(change.identity);
    if (!found) {
      continue;
    }

    await reconcileAddedCommerceSubscription(
      found.provider,
      found.event,
      metadata,
      context,
      existingIoEventsData,
      existingCommerceData,
    );
  }
}
