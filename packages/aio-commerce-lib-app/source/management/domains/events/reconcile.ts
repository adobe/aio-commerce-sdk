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

import { appliesToEnv, getInstallCommerceEnv } from "#config/lib/environment";
import { hasCommerceEvents, hasExternalEvents } from "#config/schema/eventing";
import {
  diffConfig,
  getOperativeChanges,
  isEmptyPlan,
} from "#management/upgrade/diff";

import { commerceEventsStep } from "./commerce";
import { createEventsStepContext } from "./context";
import {
  COMMERCE_SUBSCRIPTION_DOMAIN,
  eventingDomainCollectors,
  IO_EVENTS_METADATA_DOMAIN,
  IO_EVENTS_PROVIDER_DOMAIN,
  IO_EVENTS_REGISTRATION_DOMAIN,
} from "./diff";
import { externalEventsStep } from "./external";
import {
  COMMERCE_PROVIDER_TYPE,
  EXTERNAL_PROVIDER_TYPE,
  findExistingRegistrations,
  generateInstanceId,
  generateInstanceIdDeprecated,
  getIoEventCode,
  getIoEventsExistingData,
  getLegacyRegistrationName,
  getNamespacedEvent,
  getProviderKey,
  getRegistrationDescription,
  getRegistrationName,
  groupEventsByRuntimeActions,
} from "./utils";

import type { EventProviderType } from "@adobe/aio-commerce-lib-events/io-events";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  AppEvent,
  CommerceEventsConfig,
  EventProvider,
  ExternalEventsConfig,
} from "#config/schema/eventing";
import type { ApplicationMetadata } from "#config/schema/metadata";
import type { LifecycleContext } from "#management/common/workflow/index";
import type { UpgradeDomain } from "#management/upgrade/runner";
import type { ResourceKind } from "#management/upgrade/types";
import type { EventsExecutionContext } from "./context";
import type {
  ExistingIoEventsData,
  IoEventProviderWithMetadata,
} from "./utils";

/** Options for {@link reconcileEventing}. */
export type ReconcileEventingOptions = {
  /** The previously installed state. Only the config is required to compute the diff. */
  baseline: { config: CommerceAppConfigOutputModel };

  /** The new, validated target config to converge to. */
  targetConfig: CommerceAppConfigOutputModel;

  /** Shared lifecycle context; the I/O Events and Commerce clients are built internally. */
  context: LifecycleContext;
};

/** A per-domain summary of the eventing changes a reconcile applied, by resource identity. */
export type EventingReconcileResult = {
  providers: { added: string[]; removed: string[] };
  registrations: { added: string[]; removed: string[]; updated: string[] };
  metadata: { added: string[]; removed: string[] };
  subscriptions: { added: string[]; removed: string[] };
};

/**
 * The eventing domain's participation in an app upgrade: the pure diff collectors plus a reconcile
 * that converges Adobe I/O Events + Commerce eventing to the target config.
 */
export const eventingUpgradeDomain: UpgradeDomain = {
  collectors: eventingDomainCollectors,
  name: "eventing",
  reconcile: async ({ baseline, targetConfig }, context) => {
    await reconcileEventing({ baseline, context, targetConfig });
  },
};

/** A single event source normalized for reconcile, tagged with its I/O Events provider type. */
type ReconcileSource = {
  key: string;
  provider: EventProvider;
  events: AppEvent[];
  type: EventProviderType;
};

/**
 * Converges deployed eventing (Adobe I/O Events + Commerce) from the baseline config to the
 * target config: adds newly declared providers/events, removes ones that were dropped, and
 * updates I/O Events registrations whose event set changed. Provider/metadata/subscription
 * in-place changes are out of scope (see {@link eventingDomainCollectors}).
 *
 * @param options - The baseline/target configs and the lifecycle context.
 */
export async function reconcileEventing(
  options: ReconcileEventingOptions,
): Promise<EventingReconcileResult> {
  const { baseline, targetConfig, context } = options;
  const eventsContext = toEventsContext(context);
  const { logger } = eventsContext;

  const diff = diffConfig(
    baseline.config,
    targetConfig,
    eventingDomainCollectors,
  );
  const result = summarizeDiff(diff);

  if (isEmptyPlan(diff)) {
    logger.debug("No eventing changes to reconcile.");
    return result;
  }

  const baselineSources = sourcesByKind(baseline.config);
  const targetSources = sourcesByKind(targetConfig);

  // 1. Remove providers dropped from the target (whole-provider teardown, reusing uninstall).
  await removeAbsentProviders(
    baseline.config,
    baselineSources,
    targetSources,
    eventsContext,
  );

  // 2. Converge every target provider. `install` is idempotent (create-or-get) and also
  //    rewrites the stored provider map, so it handles added providers, added metadata, and
  //    registrations for newly declared runtime actions.
  if (hasCommerceEvents(targetConfig)) {
    await commerceEventsStep.install(targetConfig, eventsContext);
  }

  if (hasExternalEvents(targetConfig)) {
    await externalEventsStep.install(targetConfig, eventsContext);
  }

  // 3. Reconcile sub-resources of providers present on both sides: registration event-set
  //    changes (PUT), and per-event metadata/subscription/registration removals — none of
  //    which the idempotent `install` above can perform.
  const existingData = await getIoEventsExistingData(eventsContext);
  await reconcilePersistingProviders(
    baselineSources,
    targetSources,
    targetConfig.metadata,
    existingData,
    eventsContext,
  );

  return result;
}

/**
 * Resolves the events execution context: reuses an already-provisioned one (its I/O Events and
 * Commerce clients are present) or builds one from the lifecycle context.
 */
function toEventsContext(context: LifecycleContext): EventsExecutionContext {
  if ("ioEventsClient" in context && "commerceEventsClient" in context) {
    return context as EventsExecutionContext;
  }

  return {
    ...context,
    ...createEventsStepContext(context),
  } as EventsExecutionContext;
}

/** Collects a config's event sources, tagged with their I/O Events provider type. */
function sourcesByKind(config: CommerceAppConfigOutputModel): {
  commerce: ReconcileSource[];
  external: ReconcileSource[];
} {
  const commerce = hasCommerceEvents(config)
    ? config.eventing.commerce.map((source) => ({
        events: source.events,
        key: getProviderKey(source.provider),
        provider: source.provider,
        type: COMMERCE_PROVIDER_TYPE as EventProviderType,
      }))
    : [];

  const external = hasExternalEvents(config)
    ? config.eventing.external.map((source) => ({
        events: source.events,
        key: getProviderKey(source.provider),
        provider: source.provider,
        type: EXTERNAL_PROVIDER_TYPE as EventProviderType,
      }))
    : [];

  return { commerce, external };
}

/** Offboards providers present in the baseline but absent from the target, reusing step uninstall. */
async function removeAbsentProviders(
  baselineConfig: CommerceAppConfigOutputModel,
  baseline: ReturnType<typeof sourcesByKind>,
  target: ReturnType<typeof sourcesByKind>,
  context: EventsExecutionContext,
) {
  const targetCommerceKeys = new Set(target.commerce.map((s) => s.key));
  const removedCommerce = baseline.commerce.filter(
    (s) => !targetCommerceKeys.has(s.key),
  );
  if (removedCommerce.length > 0) {
    const config = {
      eventing: {
        commerce: removedCommerce.map(({ provider, events }) => ({
          events,
          provider,
        })),
      },
      metadata: baselineConfig.metadata,
    } as unknown as CommerceEventsConfig;
    await commerceEventsStep.uninstall?.(config, context);
  }

  const targetExternalKeys = new Set(target.external.map((s) => s.key));
  const removedExternal = baseline.external.filter(
    (s) => !targetExternalKeys.has(s.key),
  );
  if (removedExternal.length > 0) {
    const config = {
      eventing: {
        external: removedExternal.map(({ provider, events }) => ({
          events,
          provider,
        })),
      },
      metadata: baselineConfig.metadata,
    } as unknown as ExternalEventsConfig;
    await externalEventsStep.uninstall?.(config, context);
  }
}

/** Reconciles sub-resources of providers present in both configs (event set / removals). */
async function reconcilePersistingProviders(
  baseline: ReturnType<typeof sourcesByKind>,
  target: ReturnType<typeof sourcesByKind>,
  metadata: ApplicationMetadata,
  existingData: ExistingIoEventsData,
  context: EventsExecutionContext,
) {
  const baselineByKey = new Map(
    [...baseline.commerce, ...baseline.external].map((s) => [s.key, s]),
  );

  for (const targetSource of [...target.commerce, ...target.external]) {
    const baselineSource = baselineByKey.get(targetSource.key);
    if (!baselineSource) {
      // Added provider — fully handled by the idempotent `install` pass.
      continue;
    }

    // biome-ignore lint/performance/noAwaitInLoops: providers are reconciled sequentially to avoid a burst of Adobe I/O Events / Commerce calls
    await reconcileProviderSubResources(
      baselineSource,
      targetSource,
      metadata,
      existingData,
      context,
    );
  }
}

/** Applies registration updates and metadata/subscription/registration removals for one provider. */
async function reconcileProviderSubResources(
  baselineSource: ReconcileSource,
  targetSource: ReconcileSource,
  metadata: ApplicationMetadata,
  existingData: ExistingIoEventsData,
  context: EventsExecutionContext,
) {
  const { logger } = context;
  const { provider, type } = targetSource;

  const providerData = resolveDeployedProvider(
    provider,
    metadata,
    context.appData.workspaceId,
    existingData,
  );
  if (!providerData) {
    logger.warn(
      `Could not resolve deployed provider "${getProviderKey(provider)}" during reconcile; skipping its sub-resource updates.`,
    );
    return;
  }

  // Only events applicable to the install environment are actually deployed, so scope the
  // delta the same way installation does to avoid acting on other-environment events.
  const env = getInstallCommerceEnv(context.params);
  const targetEvents = targetSource.events.filter((e) => appliesToEnv(e, env));
  const baselineEvents = baselineSource.events.filter((e) =>
    appliesToEnv(e, env),
  );

  await reconcileRegistrations(
    providerData,
    type,
    targetEvents,
    baselineEvents,
    metadata,
    existingData,
    context,
  );
  await removeDroppedMetadata(
    providerData,
    type,
    targetEvents,
    baselineEvents,
    metadata,
    context,
  );

  if (type === COMMERCE_PROVIDER_TYPE) {
    await removeDroppedSubscriptions(
      targetEvents,
      baselineEvents,
      metadata,
      context,
    );
  }
}

/** Finds the deployed I/O Events provider for a config provider by its (current or legacy) instance id. */
function resolveDeployedProvider(
  provider: EventProvider,
  metadata: ApplicationMetadata,
  workspaceId: string,
  existingData: ExistingIoEventsData,
): IoEventProviderWithMetadata | null {
  const instanceId = generateInstanceId(metadata, provider, workspaceId);
  const legacyInstanceId = generateInstanceIdDeprecated(metadata, provider);

  return (
    existingData.providersWithMetadata.find(
      (candidate) =>
        candidate.instance_id === instanceId ||
        candidate.instance_id === legacyInstanceId,
    ) ?? null
  );
}

/** The fully-qualified I/O Events code set for a group of events under a provider type. */
function eventCodeSet(
  events: AppEvent[],
  type: EventProviderType,
  metadata: ApplicationMetadata,
): Set<string> {
  return new Set(
    events.map((event) =>
      getIoEventCode(getNamespacedEvent(metadata, event.name), type),
    ),
  );
}

/** PUT-updates registrations whose event set changed; deletes registrations whose action was dropped. */
async function reconcileRegistrations(
  providerData: IoEventProviderWithMetadata,
  type: EventProviderType,
  targetEvents: AppEvent[],
  baselineEvents: AppEvent[],
  metadata: ApplicationMetadata,
  existingData: ExistingIoEventsData,
  context: EventsExecutionContext,
) {
  const targetActions = groupEventsByRuntimeActions(targetEvents);
  const baselineActions = groupEventsByRuntimeActions(baselineEvents);

  for (const [runtimeAction, events] of targetActions) {
    const baselineForAction = baselineActions.get(runtimeAction);
    // A brand-new runtime action was already created by the idempotent `install` pass.
    if (!baselineForAction) {
      continue;
    }

    const changed = !areSameSets(
      eventCodeSet(events, type, metadata),
      eventCodeSet(baselineForAction, type, metadata),
    );
    if (changed) {
      // biome-ignore lint/performance/noAwaitInLoops: registrations are updated sequentially to avoid an Adobe I/O Events rate-limit burst
      await putRegistration(
        providerData,
        type,
        runtimeAction,
        events,
        metadata,
        existingData,
        context,
      );
    }
  }

  for (const runtimeAction of baselineActions.keys()) {
    if (!targetActions.has(runtimeAction)) {
      // biome-ignore lint/performance/noAwaitInLoops: registrations are deleted sequentially to avoid an Adobe I/O Events rate-limit burst
      await deleteRegistrationForAction(
        providerData,
        runtimeAction,
        existingData,
        context,
      );
    }
  }
}

/** Full-replace PUT of a registration's event set to the target. Best-effort. */
async function putRegistration(
  providerData: IoEventProviderWithMetadata,
  type: EventProviderType,
  runtimeAction: string,
  events: AppEvent[],
  metadata: ApplicationMetadata,
  existingData: ExistingIoEventsData,
  context: EventsExecutionContext,
) {
  const { ioEventsClient, appData, logger, params } = context;
  const registration = findDeployedRegistration(
    providerData,
    runtimeAction,
    existingData,
    context,
  );
  if (!registration) {
    logger.warn(
      `No deployed registration found for action "${runtimeAction}" on provider "${providerData.label}"; skipping update.`,
    );
    return;
  }

  try {
    await ioEventsClient.updateRegistration({
      clientId: params.AIO_COMMERCE_AUTH_IMS_CLIENT_ID,
      consumerOrgId: appData.consumerOrgId,
      deliveryType: "webhook",
      description: getRegistrationDescription(
        providerData,
        events,
        runtimeAction,
      ),
      enabled: true,
      eventsOfInterest: events.map((event) => ({
        eventCode: getIoEventCode(
          getNamespacedEvent(metadata, event.name),
          type,
        ),
        providerId: providerData.id,
      })),
      name: getRegistrationName(providerData, runtimeAction),
      projectId: appData.projectId,
      registrationId: registration.registration_id,
      runtimeAction,
      workspaceId: appData.workspaceId,
    });
    logger.info(
      `Updated registration "${registration.name}" (action "${runtimeAction}") on provider "${providerData.label}".`,
    );
  } catch (error) {
    const message = await unwrapHttpError(error);
    logger.warn(
      `Failed to update registration "${registration.name}" on provider "${providerData.label}": ${message}. Continuing reconcile.`,
    );
  }
}

/** Deletes the registration for a dropped runtime action. Best-effort. */
async function deleteRegistrationForAction(
  providerData: IoEventProviderWithMetadata,
  runtimeAction: string,
  existingData: ExistingIoEventsData,
  context: EventsExecutionContext,
) {
  const { ioEventsClient, appData, logger } = context;
  const registration = findDeployedRegistration(
    providerData,
    runtimeAction,
    existingData,
    context,
  );
  if (!registration) {
    return;
  }

  try {
    await ioEventsClient.deleteRegistration({
      consumerOrgId: appData.consumerOrgId,
      projectId: appData.projectId,
      registrationId: registration.registration_id,
      workspaceId: appData.workspaceId,
    });
    logger.info(
      `Deleted registration "${registration.name}" (action "${runtimeAction}") from provider "${providerData.label}".`,
    );
  } catch (error) {
    const message = await unwrapHttpError(error);
    logger.warn(
      `Failed to delete registration "${registration.name}" from provider "${providerData.label}": ${message}. Continuing reconcile.`,
    );
  }
}

/** Deletes metadata for events dropped from a provider that still exists. Best-effort. */
async function removeDroppedMetadata(
  providerData: IoEventProviderWithMetadata,
  type: EventProviderType,
  targetEvents: AppEvent[],
  baselineEvents: AppEvent[],
  metadata: ApplicationMetadata,
  context: EventsExecutionContext,
) {
  const { ioEventsClient, appData, logger } = context;
  const targetCodes = eventCodeSet(targetEvents, type, metadata);

  for (const event of baselineEvents) {
    const eventCode = getIoEventCode(
      getNamespacedEvent(metadata, event.name),
      type,
    );
    if (targetCodes.has(eventCode)) {
      continue;
    }

    try {
      // biome-ignore lint/performance/noAwaitInLoops: metadata deletes hit the Adobe I/O Events API sequentially to avoid a rate-limit burst
      await ioEventsClient.deleteEventMetadataForProvider({
        consumerOrgId: appData.consumerOrgId,
        eventCode,
        projectId: appData.projectId,
        providerId: providerData.id,
        workspaceId: appData.workspaceId,
      });
      logger.info(
        `Deleted event metadata "${eventCode}" from provider "${providerData.label}".`,
      );
    } catch (error) {
      const message = await unwrapHttpError(error);
      logger.warn(
        `Failed to delete event metadata "${eventCode}" from provider "${providerData.label}": ${message}. Continuing reconcile.`,
      );
    }
  }
}

/** Deletes Commerce subscriptions for events dropped from a provider that still exists. Best-effort. */
async function removeDroppedSubscriptions(
  targetEvents: AppEvent[],
  baselineEvents: AppEvent[],
  metadata: ApplicationMetadata,
  context: EventsExecutionContext,
) {
  const { commerceEventsClient, logger } = context;
  const targetNames = new Set(
    targetEvents.map((event) => getNamespacedEvent(metadata, event.name)),
  );

  for (const event of baselineEvents) {
    const name = getNamespacedEvent(metadata, event.name);
    if (targetNames.has(name)) {
      continue;
    }

    try {
      // biome-ignore lint/performance/noAwaitInLoops: subscription deletes hit the Commerce API sequentially to avoid a rate-limit burst
      await commerceEventsClient.deleteEventSubscription({ name });
      logger.info(`Deleted Commerce event subscription "${name}".`);
    } catch (error) {
      const message = await unwrapHttpError(error);
      logger.warn(
        `Failed to delete Commerce event subscription "${name}": ${message}. Continuing reconcile.`,
      );
    }
  }
}

/** Finds a deployed registration by its current or legacy name. */
function findDeployedRegistration(
  providerData: IoEventProviderWithMetadata,
  runtimeAction: string,
  existingData: ExistingIoEventsData,
  context: EventsExecutionContext,
) {
  const clientId = context.params.AIO_COMMERCE_AUTH_IMS_CLIENT_ID;
  return (
    findExistingRegistrations(
      existingData.registrations,
      clientId,
      getRegistrationName(providerData, runtimeAction),
    ) ??
    findExistingRegistrations(
      existingData.registrations,
      clientId,
      getLegacyRegistrationName(providerData, runtimeAction),
    )
  );
}

/** Whether two string sets contain exactly the same members. */
function areSameSets(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every((value) => b.has(value));
}

/** Groups a diff's operative changes into a per-domain, per-kind identity summary. */
function summarizeDiff(
  diff: ReturnType<typeof diffConfig>,
): EventingReconcileResult {
  const result: EventingReconcileResult = {
    metadata: { added: [], removed: [] },
    providers: { added: [], removed: [] },
    registrations: { added: [], removed: [], updated: [] },
    subscriptions: { added: [], removed: [] },
  };

  // Routes each (domain, kind) to the identity list it belongs in. A registration `changed`
  // is reported as `updated`; unmapped combinations (e.g. an unsupported provider change) are
  // intentionally dropped.
  const buckets: Record<string, Partial<Record<ResourceKind, string[]>>> = {
    [COMMERCE_SUBSCRIPTION_DOMAIN]: {
      added: result.subscriptions.added,
      removed: result.subscriptions.removed,
    },
    [IO_EVENTS_METADATA_DOMAIN]: {
      added: result.metadata.added,
      removed: result.metadata.removed,
    },
    [IO_EVENTS_PROVIDER_DOMAIN]: {
      added: result.providers.added,
      removed: result.providers.removed,
    },
    [IO_EVENTS_REGISTRATION_DOMAIN]: {
      added: result.registrations.added,
      changed: result.registrations.updated,
      removed: result.registrations.removed,
    },
  };

  for (const change of getOperativeChanges(diff)) {
    buckets[change.domain]?.[change.kind]?.push(change.identity);
  }

  return result;
}
