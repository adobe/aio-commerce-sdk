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

import { getInstallCommerceEnv } from "#config/lib/environment";

import {
  deleteCommerceProvider,
  deleteMetadata,
  deleteProvider,
  deleteRegistration,
  deleteSubscription,
  updateCommerceProvider,
  updateMetadata,
  updateProvider,
  updateRegistration,
  updateSubscription,
} from "./api";
import {
  getNamespacedEvent,
  getProviderSnapshots,
  pruneStoredEventProviders,
} from "./utils";

import type { EventProviderType } from "@adobe/aio-commerce-lib-events/io-events";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  CommerceEvent,
  CommerceEventsConfig,
  ExternalEventsConfig,
} from "#config/schema/eventing";
import type { ApplicationMetadata } from "#config/schema/metadata";
import type {
  ApplyContext,
  ApplyResult,
  ResourceOperation,
} from "#management/common/workflow/resource";
import type { ValueOf } from "./api";
import type { EventsExecutionContext, EventsStepContext } from "./context";
import type {
  EventingDomainPlan,
  EventingOperationValue,
  EventingProviderSnapshot,
  EventingSnapshotData,
} from "./types";

type Operation = ResourceOperation<EventingOperationValue>;

type UpdateOperation = Extract<Operation, { kind: "update" }>;

type RemoveOperation = Extract<Operation, { kind: "remove" }>;

/** The synthetic config shape apply rebuilds from provider snapshots to reuse install. */
type EventingLeafConfig = CommerceEventsConfig & ExternalEventsConfig;

/** Per-leaf hooks that differ between the Commerce and external event apply. */
export type LeafApplyOptions = {
  type: EventProviderType;
  isCommerce: boolean;
  install: (
    config: EventingLeafConfig,
    context: EventsExecutionContext,
  ) => Promise<unknown>;
};

// Commerce deletes an event's I/O metadata when it is unsubscribed, so subscriptions go first.
// A provider goes last, after everything that hangs off it.
const REMOVE_ORDER: EventingOperationValue["resourceType"][] = [
  "subscription",
  "registration",
  "metadata",
  "commerceProvider",
  "provider",
];

/** The target of one leaf: its env-scoped providers and its Commerce events by subscription name. */
type LeafTarget = {
  config: CommerceAppConfigOutputModel | null;
  providers: EventingProviderSnapshot[];
  eventsBySubscription: Map<string, CommerceEvent>;
};

/** A plan's removes and updates, split by when they run around the install. */
type ApplyPhases = {
  removes: RemoveOperation[];
  updates: UpdateOperation[];

  /**
   * I/O rejects a registration with an event whose metadata does not exist yet, and install
   * creates the added metadata, so registration updates run after it.
   */
  registrationUpdates: UpdateOperation[];

  /**
   * A renamed registration is removed only once install has created its successor, so its
   * events always have a registration to go to.
   */
  renamedRegistrationRemoves: RemoveOperation[];
};

/**
 * Applies an eventing domain plan: runs its removes and updates, then the create-or-get install
 * for every target provider, which creates whatever the plan adds. The install also configures
 * the Commerce eventing module and stores the providers' event data.
 *
 * @param plan - The eventing domain plan produced by the leaf's `plan` function.
 * @param context - The attempt-scoped execution context (carries the provisioned clients).
 * @param options - The per-leaf install hook and provider-type discriminators.
 */
export async function applyEventingLeaf(
  plan: EventingDomainPlan,
  context: ApplyContext<EventsStepContext>,
  options: LeafApplyOptions,
): Promise<ApplyResult<EventingSnapshotData>> {
  const target = resolveLeafTarget(context, options);
  const phases = splitIntoPhases(plan.operations);

  await runRemoves(phases.removes, context);
  await runUpdates(phases.updates, target, context);
  await installTarget(target, context, options);
  await runUpdates(phases.registrationUpdates, target, context);
  await runRemoves(phases.renamedRegistrationRemoves, context);
  await pruneStoredEventProviders(getRemovedProviderKeys(plan.operations));

  return { snapshotData: { providers: target.providers } };
}

/** Resolves the leaf's env-scoped target providers and its Commerce events by subscription name. */
function resolveLeafTarget(
  context: ApplyContext<EventsStepContext>,
  options: LeafApplyOptions,
): LeafTarget {
  const { targetConfig } = context;
  const providers = getProviderSnapshots(
    targetConfig,
    options.type,
    getInstallCommerceEnv(context.params),
  );

  const eventsBySubscription = new Map(
    providers.flatMap(({ events }) =>
      events.map((event) => [
        getNamespacedEvent({ id: context.appId }, event.name),
        event as CommerceEvent,
      ]),
    ),
  );

  return { config: targetConfig, eventsBySubscription, providers };
}

/** Splits a plan's removes and updates into the phases they run in. */
function splitIntoPhases(operations: Operation[]): ApplyPhases {
  const removes = operations.filter(
    (op): op is RemoveOperation => op.kind === "remove",
  );
  const updates = operations.filter(
    (op): op is UpdateOperation => op.kind === "update",
  );

  const isRenamedRegistration = ({ before }: RemoveOperation) =>
    before.resourceType === "registration" &&
    operations.some(
      (other) =>
        other.kind === "add" &&
        other.after.resourceType === "registration" &&
        other.after.providerKey === before.providerKey &&
        other.after.runtimeAction === before.runtimeAction,
    );

  const isRegistrationUpdate = (op: UpdateOperation) =>
    op.after.resourceType === "registration";

  return {
    registrationUpdates: updates.filter(isRegistrationUpdate),
    removes: removes.filter((op) => !isRenamedRegistration(op)),
    renamedRegistrationRemoves: removes.filter(isRenamedRegistration),
    updates: updates.filter((op) => !isRegistrationUpdate(op)),
  };
}

/** Runs the leaf's create-or-get install for the target providers, if there are any. */
async function installTarget(
  target: LeafTarget,
  context: EventsExecutionContext,
  options: LeafApplyOptions,
) {
  if (target.config && target.providers.length > 0) {
    await options.install(
      buildLeafConfig(target.providers, target.config.metadata, options),
      context,
    );
  }
}

/** The keys of the providers the plan removes. */
function getRemovedProviderKeys(operations: Operation[]) {
  return operations.flatMap((op) =>
    op.kind === "remove" && op.before.resourceType === "provider"
      ? [op.before.providerKey]
      : [],
  );
}

/** Runs remove operations one at a time, in {@link REMOVE_ORDER}. */
async function runRemoves(
  removes: RemoveOperation[],
  context: EventsExecutionContext,
) {
  for (const resourceType of REMOVE_ORDER) {
    for (const op of removes) {
      if (op.before.resourceType === resourceType) {
        // biome-ignore lint/performance/noAwaitInLoops: removals run sequentially, in dependency order
        await removeResource(op.before, context);
      }
    }
  }
}

/** Runs update operations one at a time, in order. */
async function runUpdates(
  updates: UpdateOperation[],
  target: LeafTarget,
  context: EventsExecutionContext,
) {
  for (const op of updates) {
    // biome-ignore lint/performance/noAwaitInLoops: updates run sequentially to avoid a rate-limit burst
    await updateResource(op, target.eventsBySubscription, context);
  }
}

/** Builds a synthetic leaf config from provider snapshots to reuse install. */
function buildLeafConfig(
  providers: EventingProviderSnapshot[],
  metadata: ApplicationMetadata,
  options: LeafApplyOptions,
): EventingLeafConfig {
  const sources = providers.map(({ provider, events }) => ({
    events,
    provider,
  }));
  const eventing = options.isCommerce
    ? { commerce: sources }
    : { external: sources };

  return { eventing, metadata } as unknown as EventingLeafConfig;
}

/** Deletes the live resource a remove operation describes. */
async function removeResource(
  value: EventingOperationValue,
  context: EventsExecutionContext,
): Promise<void> {
  switch (value.resourceType) {
    case "subscription":
      return await deleteSubscription(value.name, context);
    case "registration":
      return await deleteRegistration(value, context);
    case "metadata":
      return await deleteMetadata(value, context);
    case "commerceProvider":
      return await deleteCommerceProvider(value, context);
    case "provider":
      return await deleteProvider(value, context);
    default:
      return;
  }
}

/** Changes the live resource an update operation describes to its `after` value. */
async function updateResource(
  op: UpdateOperation,
  targetEvents: Map<string, CommerceEvent>,
  context: EventsExecutionContext,
): Promise<void> {
  const { before, after } = op;
  switch (after.resourceType) {
    case "provider":
      return await updateProvider(
        before as ValueOf<"provider">,
        after,
        context,
      );
    case "commerceProvider":
      return await updateCommerceProvider(
        before as ValueOf<"commerceProvider">,
        after,
        context,
      );
    case "metadata":
      return await updateMetadata(after, context);
    case "registration":
      return await updateRegistration(
        before as ValueOf<"registration">,
        after,
        context,
      );
    case "subscription":
      return await updateSubscription(after, targetEvents, context);
    default:
      return;
  }
}
