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
import { HTTPError } from "ky";

import {
  isHttpNotFoundError,
  throwHttpError,
} from "#management/common/utils/http-error";
import { RecoveryScope } from "#management/common/workflow/recovery";

import {
  diffByKey,
  eventCodeOf,
  findExistingRegistrations,
  generateInstanceId,
  generateInstanceIdDeprecated,
  getIoEventsExistingData,
  getLegacyRegistrationName,
  getNamespacedEvent,
  getRegistrationDescription,
  getRegistrationName,
  getSubscriptionChangeKind,
  groupEventsByRuntimeActions,
} from "./utils";

import type { EventProviderType } from "@adobe/aio-commerce-lib-events/io-events";
import type {
  AppEvent,
  CommerceEvent,
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
  SubscriptionChangeKind,
} from "./utils";

/** The synthetic config shape apply rebuilds from provider snapshots to reuse install/uninstall. */
type EventingLeafConfig = CommerceEventsConfig & ExternalEventsConfig;

/** Per-leaf hooks that differ between the Commerce and external event apply. */
export type LeafApplyOptions = {
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
 * Applies an eventing domain plan against live Adobe I/O Events + Commerce state. Idempotent:
 * re-runs the (create-or-get) install to converge added providers/events/registrations, issues the
 * targeted registration PUTs and metadata/subscription deletes the install cannot express, then
 * offboards providers dropped from the target. Reuses the same helpers as install/uninstall.
 *
 * @param plan - The eventing domain plan produced by the leaf's `plan` function.
 * @param context - The attempt-scoped execution context (carries the provisioned clients).
 * @param options - The per-leaf install/uninstall hooks and provider-type discriminators.
 */
export async function applyEventingLeaf(
  plan: EventingDomainPlan,
  context: ApplyContext<EventsStepContext>,
  options: LeafApplyOptions,
): Promise<ApplyResult<EventingSnapshotData>> {
  const eventsContext: EventsExecutionContext = context;

  // Register rollback before any mutation runs: onboarding subscribes events non-atomically, so a
  // rejected add must roll back its accepted siblings (same for added providers).
  const recovery = new RecoveryScope(eventsContext.logger);
  if (options.isCommerce && plan.baselineMetadata) {
    registerAddedSubscriptionCompensations(plan, eventsContext, recovery);
  }
  registerAddedProviderCompensations(plan, eventsContext, recovery, options);

  try {
    // 1. Converge every target provider. `install` is create-or-get, so it handles added providers,
    //    added metadata, and registrations for newly declared runtime actions.
    if (plan.targetProviders.length > 0) {
      await options.install(
        // `targetMetadata` is non-null whenever there are target providers to onboard.
        buildLeafConfig(
          plan.targetProviders,
          plan.targetMetadata as ApplicationMetadata,
          options,
        ),
        eventsContext,
      );
    }

    // 2. Reconcile sub-resources of providers present on both sides: registration event-set changes
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
  } catch (error) {
    // Nothing destructive has run yet, so rolling back this upgrade's adds returns exactly to
    // baseline.
    return recovery.recover(error);
  }

  // 3. Commit phase: offboard dropped providers only after every step above succeeds, so a
  // rejected add never tears one down for nothing (safe since removed/target providers are
  // disjoint). A failure here isn't rolled back — the adds already match the target, so a retry
  // just finishes the removal.
  if (plan.removedProviders.length > 0 && plan.baselineMetadata) {
    await options.uninstall(
      buildLeafConfig(plan.removedProviders, plan.baselineMetadata, options),
      eventsContext,
    );
  }

  return {
    snapshotData: { providers: plan.targetProviders },
  };
}

/**
 * Registers rollback for Commerce subscriptions added to a persisting provider — one compensation
 * per newly added event, leaving pre-existing subscriptions untouched. A wholly new provider is
 * instead rolled back by {@link registerAddedProviderCompensations}.
 */
function registerAddedSubscriptionCompensations(
  plan: EventingDomainPlan,
  context: EventsExecutionContext,
  recovery: RecoveryScope,
): void {
  const baselineByKey = new Map(
    plan.baselineProviders.map((provider) => [provider.key, provider]),
  );
  const targetMetadata = plan.targetMetadata as ApplicationMetadata;
  const baselineMetadata = plan.baselineMetadata as ApplicationMetadata;

  for (const target of plan.targetProviders) {
    const baseline = baselineByKey.get(target.key);
    if (!baseline) {
      // Wholly new provider — rolled back by tearing down the whole provider, not per-event.
      continue;
    }

    const { added } = diffByKey(
      target.events,
      baseline.events,
      (event) => getNamespacedEvent(targetMetadata, event.name),
      (event) => getNamespacedEvent(baselineMetadata, event.name),
    );

    for (const event of added) {
      const name = getNamespacedEvent(targetMetadata, event.name);
      recovery.onFailure(() => deleteAddedSubscription(name, context));
    }
  }
}

/**
 * Registers rollback for providers this upgrade adds: on failure, offboards each one entirely, so
 * a rejected sibling never leaves an empty provider shell behind.
 */
function registerAddedProviderCompensations(
  plan: EventingDomainPlan,
  context: EventsExecutionContext,
  recovery: RecoveryScope,
  options: LeafApplyOptions,
): void {
  const baselineKeys = new Set(
    plan.baselineProviders.map((provider) => provider.key),
  );
  const added = plan.targetProviders.filter(
    (provider) => !baselineKeys.has(provider.key),
  );

  for (const provider of added) {
    // Safe even if install never got to this provider — offboarding one that doesn't exist is a
    // no-op (see isNothingToRollBack).
    recovery.onFailure(() =>
      options.uninstall(
        buildLeafConfig(
          [provider],
          plan.targetMetadata as ApplicationMetadata,
          options,
        ),
        context,
      ),
    );
  }
}

/** Matches Commerce's 400 response to unsubscribing an event it never registered. */
const NOT_REGISTERED_PATTERN = /is not registered/i;

/**
 * Whether there was nothing to roll back: the target is already gone (404), or the event was never
 * registered in the first place (Commerce's 400 for unsubscribing an unregistered event).
 */
async function isNothingToRollBack(error: unknown): Promise<boolean> {
  if (isHttpNotFoundError(error)) {
    return true;
  }
  if (!(error instanceof HTTPError) || error.response.status !== 400) {
    return false;
  }

  const message = await unwrapHttpError(error);
  return NOT_REGISTERED_PATTERN.test(message);
}

/** Deletes a Commerce subscription added during a failed upgrade; treats one that's already gone as done. */
async function deleteAddedSubscription(
  name: string,
  context: EventsExecutionContext,
): Promise<void> {
  const { commerceEventsClient, logger } = context;

  try {
    await commerceEventsClient.deleteEventSubscription({ name });
    logger.info(`Rolled back added Commerce event subscription "${name}".`);
  } catch (error) {
    if (await isNothingToRollBack(error)) {
      return;
    }
    throw error;
  }
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
      // A persisting provider exists on both sides, so both metadata values are non-null here.
      plan.targetMetadata as ApplicationMetadata,
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

    await reconcileChangedSubscriptions(
      providerData.id,
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
  return a.size === b.size && a.isSubsetOf(b);
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
  const { removed } = diffByKey(
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
  const { removed } = diffByKey(
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

/**
 * Reconciles configuration changes on Commerce subscriptions present on both the baseline and
 * target. Additive/same-key changes are applied in place via the Commerce merge-update endpoint;
 * orphaning changes (field/rule removal, rename, rule operator/field change) are applied by
 * unsubscribe + resubscribe.
 */
async function reconcileChangedSubscriptions(
  providerId: string,
  targetEvents: AppEvent[],
  baselineEvents: AppEvent[],
  targetMetadata: ApplicationMetadata,
  baselineMetadata: ApplicationMetadata,
  context: EventsExecutionContext,
): Promise<void> {
  const { logger } = context;
  const baselineByName = new Map(
    baselineEvents.map((event) => [
      getNamespacedEvent(baselineMetadata, event.name),
      event as CommerceEvent,
    ]),
  );

  // Restores this provider's subscriptions to baseline if a change fails: a `recreate` deletes
  // before creating, so a rejected create would otherwise lose the old subscription. Scoped to the
  // subscription entity; metadata/registration reconciliation keep their own best-effort semantics.
  const recovery = new RecoveryScope(logger);

  try {
    for (const event of targetEvents as CommerceEvent[]) {
      const name = getNamespacedEvent(targetMetadata, event.name);
      const baselineEvent = baselineByName.get(name);
      if (!baselineEvent) {
        // Added event — created by the idempotent install pass.
        continue;
      }

      const changeMode = getSubscriptionChangeKind(baselineEvent, event);
      if (changeMode === "none") {
        continue;
      }

      const registerRestore = () =>
        recovery.onFailure(() =>
          restoreBaselineSubscription(baselineEvent, name, providerId, context),
        );

      // `recreate` deletes before creating, so register the restore before it runs — even a failed
      // create must roll back. An in-place update is non-destructive, so register the restore only
      // after it succeeds, or recovery would delete a baseline subscription that's still there.
      if (changeMode === "recreate") {
        registerRestore();
      }

      // biome-ignore lint/performance/noAwaitInLoops: subscriptions are reconciled sequentially to avoid a Commerce rate-limit burst
      await applySubscriptionChange(
        changeMode,
        event,
        name,
        providerId,
        context,
      );

      if (changeMode === "in-place") {
        registerRestore();
      }
    }
  } catch (error) {
    // Roll this provider's subscriptions back to baseline before surfacing the error.
    return recovery.recover(error);
  }
}

/** Applies one subscription's change to Commerce; a `recreate` re-subscribes (delete then create). */
async function applySubscriptionChange(
  changeMode: Exclude<SubscriptionChangeKind, "none">,
  event: CommerceEvent,
  name: string,
  providerId: string,
  context: EventsExecutionContext,
): Promise<void> {
  const { commerceEventsClient, logger } = context;
  const subscription = {
    fields: event.fields,
    hipaa_audit_required: event.hipaa_audit_required,
    name,
    parent: event.name,
    priority: event.priority,
    provider_id: providerId,
    rules: event.rules,
  };

  try {
    if (changeMode === "in-place") {
      await commerceEventsClient.updateEventSubscription(subscription);
      logger.info(`Updated Commerce event subscription "${name}" in place.`);
    } else {
      // The merge-update endpoint cannot remove or re-key fields/rules, so re-subscribe. The
      // Commerce unsubscribe/subscribe cascade churns the event's I/O metadata; the registration
      // re-links by event code and is left untouched.
      await commerceEventsClient.deleteEventSubscription({ name });
      await commerceEventsClient.createEventSubscription({
        ...subscription,
        destination: event.destination,
        force: event.force,
      });
      logger.info(`Recreated Commerce event subscription "${name}".`);
    }
  } catch (error) {
    const message = await unwrapHttpError(error);
    // Unlike the best-effort removals, a failure here fails the upgrade step: a silently stale
    // subscription would diverge from the applied config.
    throw new Error(
      `Failed to update Commerce event subscription "${name}": ${message}`,
      { cause: error },
    );
  }
}

/** Re-subscribes a subscription's baseline version, deleting any current one first. */
async function restoreBaselineSubscription(
  baselineEvent: CommerceEvent,
  name: string,
  providerId: string,
  context: EventsExecutionContext,
): Promise<void> {
  const { commerceEventsClient, logger } = context;

  try {
    await commerceEventsClient.deleteEventSubscription({ name });
  } catch (error) {
    logger.debug(
      `Subscription "${name}" already absent during recovery: ${await unwrapHttpError(error)}`,
    );
  }

  await commerceEventsClient.createEventSubscription({
    destination: baselineEvent.destination,
    fields: baselineEvent.fields,
    force: baselineEvent.force,
    hipaa_audit_required: baselineEvent.hipaa_audit_required,
    name,
    parent: baselineEvent.name,
    priority: baselineEvent.priority,
    provider_id: providerId,
    rules: baselineEvent.rules,
  });
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
