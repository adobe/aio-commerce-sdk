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

import {
  isHttpNotFoundError,
  throwHttpError,
} from "#management/common/utils/http-error";

import { commerceEventsStep } from "./commerce";
import { externalEventsStep } from "./external";
import {
  COMMERCE_PROVIDER_TYPE,
  EXTERNAL_PROVIDER_TYPE,
  eventCodeOf,
  findExistingRegistrations,
  generateInstanceId,
  generateInstanceIdDeprecated,
  getIoEventsExistingData,
  getLegacyRegistrationName,
  getNamespacedEvent,
  getRegistrationDescription,
  getRegistrationName,
  groupEventsByRuntimeActions,
  partitionByKey,
} from "./utils";

import type { EventProviderType } from "@adobe/aio-commerce-lib-events/io-events";
import type {
  AppEvent,
  CommerceEventsConfig,
  ExternalEventsConfig,
} from "#config/schema/eventing";
import type { ApplicationMetadata } from "#config/schema/metadata";
import type {
  ApplyContext,
  ApplyResult,
} from "#management/common/workflow/resource";
import type { EventsExecutionContext, EventsStepContext } from "./context";
import type {
  EventingDomainPlan,
  EventingProviderSnapshot,
  EventingSnapshotData,
} from "./types";
import type {
  ExistingIoEventsData,
  IoEventProviderWithMetadata,
} from "./utils";

/** The synthetic config shape apply rebuilds from provider snapshots to reuse install/uninstall. */
type EventingLeafConfig = CommerceEventsConfig & ExternalEventsConfig;

/** Per-leaf hooks that differ between the Commerce and external event apply. */
type LeafApplyOptions = {
  type: EventProviderType;
  isCommerce: boolean;
  install: (
    config: EventingLeafConfig,
    context: EventsExecutionContext,
  ) => Promise<unknown>;
  uninstall: (
    config: EventingLeafConfig,
    context: EventsExecutionContext,
  ) => Promise<void>;
};

/**
 * Applies a Commerce eventing domain plan against live Adobe I/O Events + Commerce state. Idempotent:
 * offboards providers dropped from the target, re-runs the (create-or-get) install to converge added
 * providers/events/registrations, then issues the targeted registration PUTs and metadata/subscription
 * deletes the install cannot express. Reuses the same helpers as install/uninstall.
 *
 * @param plan - The eventing domain plan produced by `planCommerceEvents`.
 * @param context - The attempt-scoped execution context (carries the provisioned clients).
 */
export function applyCommerceEvents(
  plan: EventingDomainPlan,
  context: ApplyContext<EventsStepContext>,
): Promise<ApplyResult<EventingSnapshotData>> {
  return applyEventingLeaf(plan, context, {
    install: async (config, ctx) =>
      await commerceEventsStep.install(config as CommerceEventsConfig, ctx),
    isCommerce: true,
    type: COMMERCE_PROVIDER_TYPE,
    uninstall: async (config, ctx) => {
      await commerceEventsStep.uninstall?.(config as CommerceEventsConfig, ctx);
    },
  });
}

/**
 * Applies an external eventing domain plan. Same convergence as {@link applyCommerceEvents} but for
 * external event sources (no Commerce subscriptions).
 *
 * @param plan - The eventing domain plan produced by `planExternalEvents`.
 * @param context - The attempt-scoped execution context.
 */
export function applyExternalEvents(
  plan: EventingDomainPlan,
  context: ApplyContext<EventsStepContext>,
): Promise<ApplyResult<EventingSnapshotData>> {
  return applyEventingLeaf(plan, context, {
    install: async (config, ctx) =>
      await externalEventsStep.install(config as ExternalEventsConfig, ctx),
    isCommerce: false,
    type: EXTERNAL_PROVIDER_TYPE,
    uninstall: async (config, ctx) => {
      await externalEventsStep.uninstall?.(config as ExternalEventsConfig, ctx);
    },
  });
}

/** Shared convergence for both eventing leaves. */
async function applyEventingLeaf(
  plan: EventingDomainPlan,
  context: ApplyContext<EventsStepContext>,
  options: LeafApplyOptions,
): Promise<ApplyResult<EventingSnapshotData>> {
  const eventsContext: EventsExecutionContext = context;

  // 1. Offboard providers dropped from the target (whole-provider teardown, reusing uninstall).
  if (plan.removedProviders.length > 0 && plan.baselineMetadata) {
    await options.uninstall(
      buildLeafConfig(plan.removedProviders, plan.baselineMetadata, options),
      eventsContext,
    );
  }

  // 2. Converge every target provider. `install` is create-or-get, so it handles added providers,
  //    added metadata, and registrations for newly declared runtime actions.
  if (plan.targetProviders.length > 0) {
    await options.install(
      buildLeafConfig(plan.targetProviders, plan.metadata, options),
      eventsContext,
    );
  }

  // 3. Reconcile sub-resources of providers present on both sides: registration event-set changes
  //    (PUT) and per-event metadata/subscription/registration removals — none of which `install` does.
  if (plan.baselineMetadata) {
    const existingData = await getIoEventsExistingData(eventsContext);
    await reconcilePersistingProviders(
      plan,
      existingData,
      eventsContext,
      options,
    );
  }

  return {
    snapshotData: { providers: plan.targetProviders },
  };
}

/** Builds a synthetic leaf config from provider snapshots for reuse of install/uninstall. */
function buildLeafConfig(
  providers: EventingProviderSnapshot[],
  metadata: ApplicationMetadata,
  options: LeafApplyOptions,
): CommerceEventsConfig & ExternalEventsConfig {
  const sources = providers.map(({ provider, events }) => ({
    events,
    provider,
  }));
  const eventing = options.isCommerce
    ? { commerce: sources }
    : { external: sources };

  return { eventing, metadata } as unknown as CommerceEventsConfig &
    ExternalEventsConfig;
}

/** Reconciles sub-resources for providers present in both the baseline and target. */
async function reconcilePersistingProviders(
  plan: EventingDomainPlan,
  existingData: ExistingIoEventsData,
  context: EventsExecutionContext,
  options: LeafApplyOptions,
): Promise<void> {
  const baselineByKey = new Map(
    plan.baselineProviders.map((provider) => [provider.key, provider]),
  );

  for (const target of plan.targetProviders) {
    const baseline = baselineByKey.get(target.key);
    if (!baseline) {
      // Added provider — fully handled by the idempotent `install` pass.
      continue;
    }

    // biome-ignore lint/performance/noAwaitInLoops: providers are reconciled sequentially to avoid a burst of Adobe I/O Events / Commerce calls
    await reconcileProviderSubResources(
      baseline,
      target,
      plan.metadata,
      // `baselineMetadata` is non-null here (guarded by the caller).
      plan.baselineMetadata as ApplicationMetadata,
      existingData,
      context,
      options,
    );
  }
}

/** Applies registration updates and metadata/subscription/registration removals for one provider. */
async function reconcileProviderSubResources(
  baseline: EventingProviderSnapshot,
  target: EventingProviderSnapshot,
  targetMetadata: ApplicationMetadata,
  baselineMetadata: ApplicationMetadata,
  existingData: ExistingIoEventsData,
  context: EventsExecutionContext,
  options: LeafApplyOptions,
): Promise<void> {
  const providerData = resolveDeployedProvider(
    target,
    targetMetadata,
    baselineMetadata,
    context.appData.workspaceId,
    existingData,
  );

  if (!providerData) {
    throw new Error(
      `Could not resolve deployed provider "${target.key}" during apply; cannot converge its sub-resources.`,
    );
  }

  await reconcileRegistrations(
    providerData,
    options.type,
    target.events,
    baseline.events,
    targetMetadata,
    baselineMetadata,
    existingData,
    context,
  );

  // Delete Commerce subscriptions before I/O Events metadata: unsubscribing a Commerce
  // event cascades into deleting its I/O Events metadata, so the metadata may already be
  // gone by the time removeDroppedMetadata runs.
  if (options.isCommerce) {
    await removeDroppedSubscriptions(
      target.events,
      baseline.events,
      targetMetadata,
      baselineMetadata,
      context,
    );
  }

  await removeDroppedMetadata(
    providerData,
    options.type,
    target.events,
    baseline.events,
    targetMetadata,
    baselineMetadata,
    context,
  );
}

/** Finds the deployed I/O Events provider by its current or legacy instance id. */
function resolveDeployedProvider(
  target: EventingProviderSnapshot,
  targetMetadata: ApplicationMetadata,
  baselineMetadata: ApplicationMetadata,
  workspaceId: string,
  existingData: ExistingIoEventsData,
): IoEventProviderWithMetadata | null {
  const candidates = new Set([
    generateInstanceId(targetMetadata, target.provider, workspaceId),
    generateInstanceIdDeprecated(targetMetadata, target.provider),
    generateInstanceId(baselineMetadata, target.provider, workspaceId),
    generateInstanceIdDeprecated(baselineMetadata, target.provider),
  ]);

  return (
    existingData.providersWithMetadata.find((candidate) =>
      candidates.has(candidate.instance_id),
    ) ?? null
  );
}

/** The fully-qualified I/O Events code set for a group of events under a provider type. */
function eventCodeSet(
  events: AppEvent[],
  type: EventProviderType,
  metadata: ApplicationMetadata,
): Set<string> {
  return new Set(events.map((event) => eventCodeOf(event, metadata, type)));
}

/** Whether two string sets contain exactly the same members. */
function areSameSets(a: Set<string>, b: Set<string>): boolean {
  return a.size === b.size && [...a].every((value) => b.has(value));
}

/** PUT-updates registrations whose event set changed; deletes registrations whose action was dropped. */
async function reconcileRegistrations(
  providerData: IoEventProviderWithMetadata,
  type: EventProviderType,
  targetEvents: AppEvent[],
  baselineEvents: AppEvent[],
  targetMetadata: ApplicationMetadata,
  baselineMetadata: ApplicationMetadata,
  existingData: ExistingIoEventsData,
  context: EventsExecutionContext,
): Promise<void> {
  const targetActions = groupEventsByRuntimeActions(targetEvents);
  const baselineActions = groupEventsByRuntimeActions(baselineEvents);

  for (const [runtimeAction, events] of targetActions) {
    const baselineForAction = baselineActions.get(runtimeAction);
    // A brand-new runtime action was already created by the idempotent `install` pass.
    if (!baselineForAction) {
      continue;
    }

    const changed = !areSameSets(
      eventCodeSet(events, type, targetMetadata),
      eventCodeSet(baselineForAction, type, baselineMetadata),
    );
    if (changed) {
      // biome-ignore lint/performance/noAwaitInLoops: registrations are updated sequentially to avoid an Adobe I/O Events rate-limit burst
      await putRegistration(
        providerData,
        type,
        runtimeAction,
        events,
        targetMetadata,
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

/**
 * Converges a registration's event set to the target: updates the deployed registration, or
 * recreates it from the target config when it is missing (self-healing when a registration was
 * removed out-of-band). Throws on an actual API failure, since the application depends on its
 * registrations reflecting the target event set.
 */
async function putRegistration(
  providerData: IoEventProviderWithMetadata,
  type: EventProviderType,
  runtimeAction: string,
  events: AppEvent[],
  metadata: ApplicationMetadata,
  existingData: ExistingIoEventsData,
  context: EventsExecutionContext,
): Promise<void> {
  const { ioEventsClient, appData, logger, params } = context;
  const registration = findDeployedRegistration(
    providerData,
    runtimeAction,
    existingData,
    context,
  );

  const name = getRegistrationName(providerData, runtimeAction);
  const payload = {
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
      eventCode: eventCodeOf(event, metadata, type),
      providerId: providerData.id,
    })),
    name,
    projectId: appData.projectId,
    runtimeAction,
    workspaceId: appData.workspaceId,
  } as const;

  if (!registration) {
    try {
      await ioEventsClient.createRegistration(payload);
      logger.info(
        `Created missing registration "${name}" (action "${runtimeAction}") on provider "${providerData.label}".`,
      );
    } catch (error) {
      await throwHttpError(
        logger,
        error,
        `Failed to create registration "${name}" on provider "${providerData.label}"`,
      );
    }
    return;
  }

  try {
    await ioEventsClient.updateRegistration({
      ...payload,
      registrationId: registration.registration_id,
    });
    logger.info(
      `Updated registration "${registration.name}" (action "${runtimeAction}") on provider "${providerData.label}".`,
    );
  } catch (error) {
    await throwHttpError(
      logger,
      error,
      `Failed to update registration "${registration.name}" on provider "${providerData.label}"`,
    );
  }
}

/**
 * Deletes the registration for a dropped runtime action. Throws on failure: leaving the
 * registration behind keeps I/O Events delivering to an action the config no longer declares.
 * Idempotent under retry — a registration already gone from live state is not found and skipped.
 */
async function deleteRegistrationForAction(
  providerData: IoEventProviderWithMetadata,
  runtimeAction: string,
  existingData: ExistingIoEventsData,
  context: EventsExecutionContext,
): Promise<void> {
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
    await throwHttpError(
      logger,
      error,
      `Failed to delete registration "${registration.name}" from provider "${providerData.label}"`,
    );
  }
}

/**
 * Deletes I/O Events metadata for events dropped from a provider that still exists. Best-effort:
 * an orphaned metadata entry does not itself deliver events, and for Commerce providers the metadata
 * is often already gone via the subscription-removal cascade (see reconcileProviderSubResources).
 */
async function removeDroppedMetadata(
  providerData: IoEventProviderWithMetadata,
  type: EventProviderType,
  targetEvents: AppEvent[],
  baselineEvents: AppEvent[],
  targetMetadata: ApplicationMetadata,
  baselineMetadata: ApplicationMetadata,
  context: EventsExecutionContext,
): Promise<void> {
  const { ioEventsClient, appData, logger } = context;
  const { removed } = partitionByKey(
    targetEvents,
    baselineEvents,
    (event) => eventCodeOf(event, targetMetadata, type),
    (event) => eventCodeOf(event, baselineMetadata, type),
  );

  for (const event of removed) {
    const eventCode = eventCodeOf(event, baselineMetadata, type);

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
      if (isHttpNotFoundError(error)) {
        logger.info(
          `Event metadata "${eventCode}" already removed from provider "${providerData.label}"; skipping.`,
        );
        continue;
      }
      const message = await unwrapHttpError(error);
      logger.warn(
        `Failed to delete event metadata "${eventCode}" from provider "${providerData.label}": ${message}. Continuing apply.`,
      );
    }
  }
}

/**
 * Deletes Commerce subscriptions for events dropped from a provider that still exists. Throws on
 * failure: a lingering subscription keeps Commerce emitting the dropped event to the app. A
 * not-found response means the subscription is already gone and is treated as success.
 */
async function removeDroppedSubscriptions(
  targetEvents: AppEvent[],
  baselineEvents: AppEvent[],
  targetMetadata: ApplicationMetadata,
  baselineMetadata: ApplicationMetadata,
  context: EventsExecutionContext,
): Promise<void> {
  const { commerceEventsClient, logger } = context;
  const { removed } = partitionByKey(
    targetEvents,
    baselineEvents,
    (event) => getNamespacedEvent(targetMetadata, event.name),
    (event) => getNamespacedEvent(baselineMetadata, event.name),
  );

  for (const event of removed) {
    const name = getNamespacedEvent(baselineMetadata, event.name);

    try {
      // biome-ignore lint/performance/noAwaitInLoops: subscription deletes hit the Commerce API sequentially to avoid a rate-limit burst
      await commerceEventsClient.deleteEventSubscription({ name });
      logger.info(`Deleted Commerce event subscription "${name}".`);
    } catch (error) {
      if (isHttpNotFoundError(error)) {
        logger.info(
          `Commerce event subscription "${name}" already removed; skipping.`,
        );
        continue;
      }
      await throwHttpError(
        logger,
        error,
        `Failed to delete Commerce event subscription "${name}"`,
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
