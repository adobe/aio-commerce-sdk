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
  configureCommerceEventing,
  createCommerceProvider,
  createMetadata,
  createProvider,
  createRegistration,
  createSubscription,
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
  eventCodeOf,
  getNamespacedEvent,
  getProviderSnapshots,
  makeWorkspaceConfig,
  pruneStoredEventProviders,
  sanitizeEventingIdentifier,
  storeEventProviders,
} from "./utils";

import type { EventProviderType } from "@adobe/aio-commerce-lib-events/io-events";
import type { CommerceEvent } from "#config/schema/eventing";
import type {
  ApplyContext,
  ApplyResult,
  ResourceOperation,
} from "#management/common/workflow/resource";
import type { ValueOf } from "./api";
import type { EventsExecutionContext, EventsStepContext } from "./context";
import type {
  EventingDomainPlan,
  EventingModuleState,
  EventingOperationValue,
  EventingProviderSnapshot,
  EventingSnapshotData,
  StoredEventsData,
} from "./types";

type Operation = ResourceOperation<EventingOperationValue>;

type AddOperation = Extract<Operation, { kind: "add" }>;

type UpdateOperation = Extract<Operation, { kind: "update" }>;

type RemoveOperation = Extract<Operation, { kind: "remove" }>;

// Commerce may delete an event's I/O metadata when it is unsubscribed, so subscriptions go first.
// A provider goes last, after everything that hangs off it.
const REMOVE_ORDER: EventingOperationValue["resourceType"][] = [
  "subscription",
  "registration",
  "metadata",
  "commerceProvider",
  "provider",
];

/** The target of one leaf: its env-scoped providers, Commerce events and provider ids. */
type LeafTarget = {
  type: EventProviderType;
  providers: EventingProviderSnapshot[];
  eventsBySubscription: Map<string, CommerceEvent>;

  /** The I/O provider ids by provider key: the live ones, then each one apply creates. */
  providerIds: Map<string, string>;
};

/** A plan's operations, split by when they run. */
type ApplyPhases = {
  removes: RemoveOperation[];
  updates: UpdateOperation[];
  adds: AddOperation[];

  /** Replaced subscriptions are unsubscribed with the removes and subscribed again with the adds. */
  replaces: UpdateOperation[];

  /** I/O rejects a registration with an event whose metadata does not exist yet. */
  registrationUpdates: UpdateOperation[];

  /**
   * A renamed registration is removed only once its successor exists, so its events always have
   * a registration to go to.
   */
  renamedRegistrationRemoves: RemoveOperation[];
};

/**
 * Applies an eventing domain plan: runs its removes, updates and adds, configures the Commerce
 * eventing module when the plan says so, and stores the target providers' event data.
 *
 * @param plan - The eventing domain plan produced by the leaf's `plan` function.
 * @param context - The attempt-scoped execution context (carries the provisioned clients).
 * @param type - The provider type of the leaf.
 */
export async function applyEventingLeaf(
  plan: EventingDomainPlan,
  context: ApplyContext<EventsStepContext>,
  type: EventProviderType,
): Promise<ApplyResult<EventingSnapshotData>> {
  const target = resolveLeafTarget(plan, context, type);
  const phases = splitIntoPhases(plan.operations);

  await runRemoves(
    [
      ...phases.removes.map((op) => op.before),
      ...phases.replaces.map((op) => op.after),
    ],
    context,
  );
  await runUpdates(phases.updates, target, context);
  await runAdds(phases, plan, target, context);
  await runUpdates(phases.registrationUpdates, target, context);
  await runRemoves(
    phases.renamedRegistrationRemoves.map((op) => op.before),
    context,
  );
  await storeEventProviders(getStoredProviders(target, context));
  await pruneStoredEventProviders(getRemovedProviderKeys(plan.operations));

  return { snapshotData: { providers: target.providers } };
}

/** Resolves the leaf's env-scoped target providers, Commerce events and live provider ids. */
function resolveLeafTarget(
  plan: EventingDomainPlan,
  context: ApplyContext<EventsStepContext>,
  type: EventProviderType,
): LeafTarget {
  const providers = getProviderSnapshots(
    context.targetConfig,
    type,
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

  return {
    eventsBySubscription,
    providerIds: new Map(Object.entries(plan.providerIds ?? {})),
    providers,
    type,
  };
}

/** Splits a plan's operations into the phases they run in. */
function splitIntoPhases(operations: Operation[]): ApplyPhases {
  const adds = operations.filter((op): op is AddOperation => op.kind === "add");
  const removes = operations.filter(
    (op): op is RemoveOperation => op.kind === "remove",
  );
  const updates = operations.filter(
    (op): op is UpdateOperation => op.kind === "update",
  );

  const isRenamedRegistration = ({ before }: RemoveOperation) =>
    before.resourceType === "registration" &&
    adds.some(
      ({ after }) =>
        after.resourceType === "registration" &&
        after.providerKey === before.providerKey &&
        after.runtimeAction === before.runtimeAction,
    );

  const isRegistrationUpdate = (op: UpdateOperation) =>
    op.after.resourceType === "registration";

  const isReplace = (op: UpdateOperation) =>
    op.after.resourceType === "subscription" &&
    op.after.changeMode === "replace";

  return {
    adds,
    registrationUpdates: updates.filter(isRegistrationUpdate),
    removes: removes.filter((op) => !isRenamedRegistration(op)),
    renamedRegistrationRemoves: removes.filter(isRenamedRegistration),
    replaces: updates.filter(isReplace),
    updates: updates.filter(
      (op) => !(isRegistrationUpdate(op) || isReplace(op)),
    ),
  };
}

/**
 * Creates what the plan adds and subscribes replaced subscriptions again, each resource after the
 * ones it needs. The eventing module is configured once the providers exist, before anything
 * Commerce holds.
 */
async function runAdds(
  phases: ApplyPhases,
  plan: EventingDomainPlan,
  target: LeafTarget,
  context: ApplyContext<EventsStepContext>,
) {
  const addsOf = (resourceType: EventingOperationValue["resourceType"]) =>
    phases.adds.filter((op) => op.after.resourceType === resourceType);

  await runEach(addsOf("provider"), (op) => addResource(op, target, context));
  await configureEventingModule(plan.eventingModule, context);
  await runEach(addsOf("commerceProvider"), (op) =>
    addResource(op, target, context),
  );
  await runEach(addsOf("metadata"), (op) => addResource(op, target, context));
  await runEach([...addsOf("subscription"), ...phases.replaces], (op) =>
    addResource(op, target, context),
  );
  await runEach(addsOf("registration"), (op) =>
    addResource(op, target, context),
  );
}

/** Runs the given operations one at a time, in order. */
async function runEach<TOperation extends Operation>(
  operations: TOperation[],
  run: (op: TOperation) => Promise<void>,
) {
  for (const op of operations) {
    // biome-ignore lint/performance/noAwaitInLoops: operations run sequentially, in dependency order and without a rate-limit burst
    await run(op);
  }
}

/** Deletes the given resources one at a time, in {@link REMOVE_ORDER}. */
async function runRemoves(
  values: EventingOperationValue[],
  context: EventsExecutionContext,
) {
  for (const resourceType of REMOVE_ORDER) {
    for (const value of values) {
      if (value.resourceType === resourceType) {
        // biome-ignore lint/performance/noAwaitInLoops: removals run sequentially, in dependency order
        await removeResource(value, context);
      }
    }
  }
}

/** Runs update operations one at a time, in order. */
function runUpdates(
  updates: UpdateOperation[],
  target: LeafTarget,
  context: EventsExecutionContext,
) {
  return runEach(updates, (op) => updateResource(op, target, context));
}

/** Configures the Commerce eventing module from the state the plan read, if it needs it. */
async function configureEventingModule(
  state: EventingModuleState | undefined,
  context: EventsExecutionContext,
) {
  if (!state) {
    return;
  }

  await configureCommerceEventing(
    {
      config: {
        enabled: true,
        environment_id: sanitizeEventingIdentifier(context.appData.projectName),
        instance_id: state.instanceId,
        merchant_id: sanitizeEventingIdentifier(context.appData.orgName),
        workspace_configuration: JSON.stringify(makeWorkspaceConfig(context)),
      },
      context,
    },
    state,
  );
}

/** The I/O provider id of a provider key, from the plan or from a provider apply created. */
function providerIdOf(providerKey: string, target: LeafTarget): string {
  const providerId = target.providerIds.get(providerKey);
  if (!providerId) {
    throw new Error(`Event provider "${providerKey}" does not exist.`);
  }

  return providerId;
}

/** The target event of a Commerce subscription. */
function targetEventOf(name: string, target: LeafTarget): CommerceEvent {
  const event = target.eventsBySubscription.get(name);
  if (!event) {
    throw new Error(
      `Commerce subscription "${name}" is not in the target configuration.`,
    );
  }

  return event;
}

/** Creates the live resource an add operation, or the subscribe of a replace, describes. */
async function addResource(
  { after }: AddOperation | UpdateOperation,
  target: LeafTarget,
  context: EventsExecutionContext,
): Promise<void> {
  switch (after.resourceType) {
    case "provider":
      target.providerIds.set(
        after.providerKey,
        await createProvider(after, context),
      );
      return;
    case "commerceProvider":
      return await createCommerceProvider(
        after,
        providerIdOf(after.providerKey, target),
        context,
      );
    case "metadata":
      return await createMetadata(
        after,
        providerIdOf(after.providerKey, target),
        context,
      );
    case "subscription":
      return await createSubscription(
        after,
        targetEventOf(after.name, target),
        providerIdOf(after.providerKey, target),
        context,
      );
    case "registration":
      return await createRegistration(
        after,
        providerIdOf(after.providerKey, target),
        context,
      );
    default:
      return;
  }
}

/** The stored event data of every target provider with a key, by provider key. */
function getStoredProviders(
  target: LeafTarget,
  context: EventsExecutionContext,
): StoredEventsData["providers"] {
  return Object.fromEntries(
    target.providers.flatMap(({ key, provider, events }) => {
      const id = target.providerIds.get(key);
      if (!(provider.key && id)) {
        return [];
      }

      const storedEvents = events.map((event) => [
        event.name,
        {
          code: eventCodeOf(event, { id: context.appId }, target.type),
          isPhiData: event.hipaa_audit_required ?? false,
        },
      ]);

      return [[key, { events: Object.fromEntries(storedEvents), id }]];
    }),
  );
}

/** The keys of the providers the plan removes. */
function getRemovedProviderKeys(operations: Operation[]) {
  return operations.flatMap((op) =>
    op.kind === "remove" && op.before.resourceType === "provider"
      ? [op.before.providerKey]
      : [],
  );
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
  target: LeafTarget,
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
      return await updateSubscription(
        after,
        targetEventOf(after.name, target),
        context,
      );
    default:
      return;
  }
}
