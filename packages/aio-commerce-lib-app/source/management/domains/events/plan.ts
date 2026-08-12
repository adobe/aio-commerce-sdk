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

import { appliesToEnv, getInstallCommerceEnv } from "#config/lib/environment";

import {
  COMMERCE_PROVIDER_TYPE,
  EXTERNAL_PROVIDER_TYPE,
  eventCodeOf,
  getNamespacedEvent,
  getProviderKey,
  getSubscriptionChangeKind,
  groupEventsByRuntimeActions,
  partitionByKey,
} from "./utils";

import type { EventProviderType } from "@adobe/aio-commerce-lib-events/io-events";
import type {
  AppEvent,
  CommerceEvent,
  CommerceEventsConfig,
  EventProvider,
  ExternalEventsConfig,
} from "#config/schema/eventing";
import type { ApplicationMetadata } from "#config/schema/metadata";
import type {
  CleanupResource,
  PlanningInput,
  PlanningResult,
  ResourceOperation,
} from "#management/common/workflow/resource";
import type { ValidationExecutionContext } from "#management/common/workflow/step";
import type { EventsStepContext } from "./context";
import type {
  EventingCleanupIdentity,
  EventingDomainPlan,
  EventingOperationValue,
  EventingProviderSnapshot,
  EventingSnapshotData,
} from "./types";

/** A config event source: a provider and its declared events. */
type EventSource = { provider: EventProvider; events: AppEvent[] };

/** Everything the leaf-agnostic planner needs to diff one event kind. */
type PlanLeafInput = {
  path: string[];
  type: EventProviderType;
  isCommerce: boolean;
  targetSources: EventSource[];
  targetMetadata: ApplicationMetadata | null;
  baselineSources: EventSource[];
  baselineSnapshot: EventingProviderSnapshot[] | null;
  baselineMetadata: ApplicationMetadata | null;
  unresolvedCleanupResources: CleanupResource<EventingCleanupIdentity>[];
  env: ReturnType<typeof getInstallCommerceEnv>;
};

/** Reduces config event sources to env-scoped provider snapshots (skipping empty providers). */
function sourcesToSnapshots(
  sources: EventSource[],
  type: EventProviderType,
  env: ReturnType<typeof getInstallCommerceEnv>,
): EventingProviderSnapshot[] {
  const snapshots: EventingProviderSnapshot[] = [];

  for (const { provider, events } of sources) {
    const applicable = events.filter((event) => appliesToEnv(event, env));
    if (applicable.length === 0) {
      continue;
    }

    snapshots.push({
      events: applicable,
      key: getProviderKey(provider),
      provider,
      type,
    });
  }

  return snapshots;
}

/** Builds a version-stable id for a plan operation. */
function operationId(
  kind: ResourceOperation<EventingOperationValue>["kind"],
  value: EventingOperationValue,
): string {
  switch (value.resourceType) {
    case "provider":
      return `${kind}:provider:${value.providerKey}`;
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

/**
 * Reconstructs a minimal operation value from a stored cleanup identity, so a cleanup remove can be
 * emitted from the identity alone. Round-trips through {@link valueToCleanupIdentity}: the resulting
 * value maps back to the same identity that `operationsToCleanup` uses to mark it resolved.
 */
function cleanupIdentityToValue(
  identity: EventingCleanupIdentity,
  type: EventProviderType,
): EventingOperationValue {
  switch (identity.resourceType) {
    case "provider":
      return {
        label: identity.providerLabel,
        providerKey: identity.providerKey,
        resourceType: "provider",
        type,
      };
    case "metadata":
      return {
        eventCode: identity.eventCode,
        providerKey: identity.providerKey,
        providerLabel: identity.providerLabel,
        resourceType: "metadata",
        type,
      };
    case "registration":
      return {
        providerKey: identity.providerKey,
        providerLabel: identity.providerLabel,
        resourceType: "registration",
        runtimeAction: identity.runtimeAction,
        type,
      };
    default:
      return { name: identity.name, resourceType: "subscription" };
  }
}

/** Accumulates the operations, cleanup resources and removed providers for one leaf. */
class LeafPlanBuilder {
  public readonly operations: ResourceOperation<EventingOperationValue>[] = [];
  public readonly possibleCleanupResources: CleanupResource<EventingCleanupIdentity>[] =
    [];
  public readonly removedProviders: EventingProviderSnapshot[] = [];
  private readonly path: string[];

  public constructor(path: string[]) {
    this.path = path;
  }

  private add(
    value: EventingOperationValue,
    label: string,
    cleanup?: EventingCleanupIdentity,
  ): void {
    this.operations.push({
      after: value,
      category: "configuration",
      id: operationId("add", value),
      kind: "add",
      label,
    });
    if (cleanup) {
      this.possibleCleanupResources.push({
        identity: cleanup,
        path: this.path,
      });
    }
  }

  private remove(value: EventingOperationValue, label: string): void {
    this.operations.push({
      before: value,
      category: "configuration",
      id: operationId("remove", value),
      kind: "remove",
      label,
    });
  }

  /**
   * Emits a cleanup-category remove for an orphaned resource carried over from a prior attempt's
   * unresolved cleanup, reconstructing the operation value from the stored identity. Re-arms the
   * identity so it stays tracked until an apply actually resolves it.
   */
  public removeFromCleanup(
    identity: EventingCleanupIdentity,
    type: EventProviderType,
  ): void {
    const value = cleanupIdentityToValue(identity, type);
    this.operations.push({
      before: value,
      category: "cleanup",
      id: operationId("remove", value),
      kind: "remove",
      label: `Remove orphaned ${identity.resourceType}`,
    });
    this.possibleCleanupResources.push({ identity, path: this.path });
  }

  private update(
    before: EventingOperationValue,
    after: EventingOperationValue,
    label: string,
  ): void {
    this.operations.push({
      after,
      before,
      category: "configuration",
      id: operationId("update", after),
      kind: "update",
      label,
    });
  }

  /** Emits the full create set for a provider that is new in the target. */
  public addProvider(
    snapshot: EventingProviderSnapshot,
    metadata: ApplicationMetadata,
    isCommerce: boolean,
  ): void {
    const { key, provider, type, events } = snapshot;

    this.add(
      {
        description: provider.description,
        label: provider.label,
        providerKey: key,
        resourceType: "provider",
        type,
      },
      `Create event provider: ${provider.label}`,
      {
        providerKey: key,
        providerLabel: provider.label,
        resourceType: "provider",
      },
    );

    for (const event of events) {
      const eventCode = eventCodeOf(event, metadata, type);
      this.add(
        {
          description: event.description,
          eventCode,
          label: event.label,
          providerKey: key,
          providerLabel: provider.label,
          resourceType: "metadata",
          type,
        },
        `Register event metadata: ${eventCode}`,
        {
          eventCode,
          providerKey: key,
          providerLabel: provider.label,
          resourceType: "metadata",
        },
      );
    }

    for (const [runtimeAction, grouped] of groupEventsByRuntimeActions(
      events,
    )) {
      this.add(
        {
          eventCodes: grouped
            .map((event) => eventCodeOf(event, metadata, type))
            .sort((a, b) => a.localeCompare(b)),
          providerKey: key,
          providerLabel: provider.label,
          resourceType: "registration",
          runtimeAction,
          type,
        },
        `Create registration: ${provider.label} → ${runtimeAction}`,
        {
          providerKey: key,
          providerLabel: provider.label,
          resourceType: "registration",
          runtimeAction,
        },
      );
    }

    if (isCommerce) {
      for (const event of events) {
        const name = getNamespacedEvent(metadata, event.name);
        this.add(
          { name, providerKey: key, resourceType: "subscription" },
          `Create Commerce subscription: ${name}`,
          { name, resourceType: "subscription" },
        );
      }
    }
  }

  /** Records a provider dropped from the target (whole-provider teardown). */
  public removeProvider(snapshot: EventingProviderSnapshot): void {
    this.removedProviders.push(snapshot);
    this.remove(
      {
        description: snapshot.provider.description,
        label: snapshot.provider.label,
        providerKey: snapshot.key,
        resourceType: "provider",
        type: snapshot.type,
      },
      `Remove event provider: ${snapshot.provider.label}`,
    );
  }

  /** Diffs the sub-resources of a provider present in both baseline and target. */
  public diffPersistingProvider(
    target: EventingProviderSnapshot,
    baseline: EventingProviderSnapshot,
    targetMetadata: ApplicationMetadata,
    baselineMetadata: ApplicationMetadata,
    isCommerce: boolean,
  ): void {
    // Provider display (label/description) has no in-place update API; a cosmetic change is
    // intentionally left as-is rather than blocking the whole upgrade. Only sub-resources diff.
    this.diffMetadata(target, baseline, targetMetadata, baselineMetadata);
    this.diffRegistrations(target, baseline, targetMetadata, baselineMetadata);
    if (isCommerce) {
      this.diffSubscriptions(
        target,
        baseline,
        targetMetadata,
        baselineMetadata,
      );
    }
  }

  private diffMetadata(
    target: EventingProviderSnapshot,
    baseline: EventingProviderSnapshot,
    targetMetadata: ApplicationMetadata,
    baselineMetadata: ApplicationMetadata,
  ): void {
    const { key, provider, type } = target;
    const { added, removed } = partitionByKey(
      target.events,
      baseline.events,
      (event) => eventCodeOf(event, targetMetadata, type),
      (event) => eventCodeOf(event, baselineMetadata, type),
    );

    for (const event of added) {
      const eventCode = eventCodeOf(event, targetMetadata, type);
      this.add(
        {
          description: event.description,
          eventCode,
          label: event.label,
          providerKey: key,
          providerLabel: provider.label,
          resourceType: "metadata",
          type,
        },
        `Register event metadata: ${eventCode}`,
        {
          eventCode,
          providerKey: key,
          providerLabel: provider.label,
          resourceType: "metadata",
        },
      );
    }

    for (const event of removed) {
      const eventCode = eventCodeOf(event, baselineMetadata, type);
      this.remove(
        {
          description: event.description,
          eventCode,
          label: event.label,
          providerKey: key,
          providerLabel: provider.label,
          resourceType: "metadata",
          type,
        },
        `Remove event metadata: ${eventCode}`,
      );
    }
  }

  private diffRegistrations(
    target: EventingProviderSnapshot,
    baseline: EventingProviderSnapshot,
    targetMetadata: ApplicationMetadata,
    baselineMetadata: ApplicationMetadata,
  ): void {
    const { key, provider, type } = target;
    const targetActions = groupEventsByRuntimeActions(target.events);
    const baselineActions = groupEventsByRuntimeActions(baseline.events);

    const codes = (events: AppEvent[], metadata: ApplicationMetadata) =>
      events
        .map((event) => eventCodeOf(event, metadata, type))
        .sort((a, b) => a.localeCompare(b));

    for (const [runtimeAction, events] of targetActions) {
      const baselineForAction = baselineActions.get(runtimeAction);
      const after: EventingOperationValue = {
        eventCodes: codes(events, targetMetadata),
        providerKey: key,
        providerLabel: provider.label,
        resourceType: "registration",
        runtimeAction,
        type,
      };

      if (!baselineForAction) {
        this.add(
          after,
          `Create registration: ${provider.label} → ${runtimeAction}`,
          {
            providerKey: key,
            providerLabel: provider.label,
            resourceType: "registration",
            runtimeAction,
          },
        );
        continue;
      }

      const before: EventingOperationValue = {
        eventCodes: codes(baselineForAction, baselineMetadata),
        providerKey: key,
        providerLabel: provider.label,
        resourceType: "registration",
        runtimeAction,
        type,
      };

      if (stringify(before) !== stringify(after)) {
        this.update(
          before,
          after,
          `Update registration: ${provider.label} → ${runtimeAction}`,
        );
      }
    }

    for (const runtimeAction of baselineActions.keys()) {
      if (targetActions.has(runtimeAction)) {
        continue;
      }
      this.remove(
        {
          eventCodes: codes(
            baselineActions.get(runtimeAction) ?? [],
            baselineMetadata,
          ),
          providerKey: key,
          providerLabel: provider.label,
          resourceType: "registration",
          runtimeAction,
          type,
        },
        `Remove registration: ${provider.label} → ${runtimeAction}`,
      );
    }
  }

  private diffSubscriptions(
    target: EventingProviderSnapshot,
    baseline: EventingProviderSnapshot,
    targetMetadata: ApplicationMetadata,
    baselineMetadata: ApplicationMetadata,
  ): void {
    const { key } = target;
    const { added, removed } = partitionByKey(
      target.events,
      baseline.events,
      (event) => getNamespacedEvent(targetMetadata, event.name),
      (event) => getNamespacedEvent(baselineMetadata, event.name),
    );

    for (const event of added) {
      const name = getNamespacedEvent(targetMetadata, event.name);
      this.add(
        { name, providerKey: key, resourceType: "subscription" },
        `Create Commerce subscription: ${name}`,
        { name, resourceType: "subscription" },
      );
    }

    for (const event of removed) {
      const name = getNamespacedEvent(baselineMetadata, event.name);
      this.remove(
        { name, providerKey: key, resourceType: "subscription" },
        `Remove Commerce subscription: ${name}`,
      );
    }

    // Subscriptions present on both sides: reconcile in-place config changes (fields, rules,
    // priority, hipaa) that the add/remove partition above never examines.
    const baselineByName = new Map(
      baseline.events.map((event) => [
        getNamespacedEvent(baselineMetadata, event.name),
        event,
      ]),
    );

    for (const targetEvent of target.events) {
      const name = getNamespacedEvent(targetMetadata, targetEvent.name);
      const baselineEvent = baselineByName.get(name);
      if (!baselineEvent) {
        continue;
      }

      const changeMode = getSubscriptionChangeKind(
        baselineEvent as CommerceEvent,
        targetEvent as CommerceEvent,
      );
      if (changeMode === "none") {
        continue;
      }

      this.update(
        { name, providerKey: key, resourceType: "subscription" },
        { changeMode, name, providerKey: key, resourceType: "subscription" },
        changeMode === "in-place"
          ? `Update Commerce subscription in place: ${name}`
          : `Recreate Commerce subscription: ${name}`,
      );
    }
  }
}

/**
 * Whether a cleanup identity still corresponds to a resource in the given provider set — used to
 * decide whether an unresolved cleanup entry is an orphan (represented nowhere) or is already
 * handled by the normal target/baseline diff.
 */
function isIdentityRepresented(
  identity: EventingCleanupIdentity,
  providers: EventingProviderSnapshot[],
  metadata: ApplicationMetadata,
  type: EventProviderType,
): boolean {
  switch (identity.resourceType) {
    case "provider":
      return providers.some(
        (provider) => provider.key === identity.providerKey,
      );
    case "metadata":
      return providers.some(
        (provider) =>
          provider.key === identity.providerKey &&
          provider.events.some(
            (event) =>
              eventCodeOf(event, metadata, type) === identity.eventCode,
          ),
      );
    case "registration":
      return providers.some(
        (provider) =>
          provider.key === identity.providerKey &&
          groupEventsByRuntimeActions(provider.events).has(
            identity.runtimeAction,
          ),
      );
    default:
      return providers.some((provider) =>
        provider.events.some(
          (event) => getNamespacedEvent(metadata, event.name) === identity.name,
        ),
      );
  }
}

/** Diffs one event kind (commerce or external) into an eventing domain plan. */
function planEventingLeaf(
  params: PlanLeafInput,
): PlanningResult<EventingDomainPlan> {
  const {
    path,
    type,
    isCommerce,
    targetSources,
    targetMetadata,
    baselineSources,
    baselineSnapshot,
    baselineMetadata,
    env,
  } = params;

  const targetProviders = sourcesToSnapshots(targetSources, type, env);
  const baselineProviders =
    baselineSnapshot?.filter((snapshot) => snapshot.type === type) ??
    sourcesToSnapshots(baselineSources, type, env);

  const targetByKey = new Map(targetProviders.map((p) => [p.key, p]));
  const baselineByKey = new Map(baselineProviders.map((p) => [p.key, p]));

  const builder = new LeafPlanBuilder(path);

  for (const snapshot of targetProviders) {
    if (baselineByKey.has(snapshot.key)) {
      continue;
    }
    // A new provider only exists in the target, so `targetMetadata` is present.
    builder.addProvider(
      snapshot,
      targetMetadata as ApplicationMetadata,
      isCommerce,
    );
  }

  for (const snapshot of baselineProviders) {
    if (targetByKey.has(snapshot.key)) {
      continue;
    }
    builder.removeProvider(snapshot);
  }

  for (const target of targetProviders) {
    const baseline = baselineByKey.get(target.key);
    if (!baseline) {
      continue;
    }
    builder.diffPersistingProvider(
      target,
      baseline,
      targetMetadata as ApplicationMetadata,
      baselineMetadata as ApplicationMetadata,
      isCommerce,
    );
  }

  // Reconcile cleanup resources carried over from prior attempts: any that no longer correspond to
  // a target or baseline resource are orphans to remove. Ones still in the target are reconverged by
  // the idempotent install; ones in the baseline are already handled by the diff removes above.
  for (const { identity } of params.unresolvedCleanupResources) {
    const inTarget =
      targetMetadata !== null &&
      isIdentityRepresented(identity, targetProviders, targetMetadata, type);
    const inBaseline =
      baselineMetadata !== null &&
      isIdentityRepresented(
        identity,
        baselineProviders,
        baselineMetadata,
        type,
      );
    if (inTarget || inBaseline) {
      continue;
    }
    builder.removeFromCleanup(identity, type);
  }

  return {
    kind: "planned",
    plan: {
      baselineMetadata,
      baselineProviders,
      // A plan always has at least one side, so at least one metadata is present.
      metadata: (targetMetadata ?? baselineMetadata) as ApplicationMetadata,
      operations: builder.operations,
      path,
      possibleCleanupResources: builder.possibleCleanupResources,
      removedProviders: builder.removedProviders,
      targetProviders,
    },
  };
}

/**
 * Plans the Commerce eventing changes between the installed baseline and the target config. Pure:
 * diffs provider/metadata/registration/subscription resources into add/remove/update operations
 * without any I/O. In-place provider/metadata changes have no update API and are left as-is;
 * registration event-set changes and Commerce subscription config changes are emitted as `update`.
 *
 * @param input - The planning input (baseline config + snapshot, target config, path).
 * @param context - The side-effect-free execution context (used to resolve the install environment).
 */
export function planCommerceEvents(
  input: PlanningInput<
    CommerceEventsConfig,
    EventingSnapshotData,
    EventingCleanupIdentity
  >,
  context: ValidationExecutionContext<EventsStepContext>,
): Promise<PlanningResult<EventingDomainPlan>> {
  return Promise.resolve(
    planEventingLeaf({
      baselineMetadata: input.baseline?.config.metadata ?? null,
      baselineSnapshot: input.baseline?.data?.providers ?? null,
      baselineSources: input.baseline?.config.eventing.commerce ?? [],
      env: getInstallCommerceEnv(context.params),
      isCommerce: true,
      path: input.path,
      targetMetadata: input.targetConfig?.metadata ?? null,
      targetSources: input.targetConfig?.eventing.commerce ?? [],
      type: COMMERCE_PROVIDER_TYPE,
      unresolvedCleanupResources: input.unresolvedCleanupResources,
    }),
  );
}

/**
 * Plans the external eventing changes between the installed baseline and the target config. Same
 * pure diff as {@link planCommerceEvents}, but for external event sources (no Commerce subscriptions).
 *
 * @param input - The planning input.
 * @param context - The side-effect-free execution context.
 */
export function planExternalEvents(
  input: PlanningInput<
    ExternalEventsConfig,
    EventingSnapshotData,
    EventingCleanupIdentity
  >,
  context: ValidationExecutionContext<EventsStepContext>,
): Promise<PlanningResult<EventingDomainPlan>> {
  return Promise.resolve(
    planEventingLeaf({
      baselineMetadata: input.baseline?.config.metadata ?? null,
      baselineSnapshot: input.baseline?.data?.providers ?? null,
      baselineSources: input.baseline?.config.eventing.external ?? [],
      env: getInstallCommerceEnv(context.params),
      isCommerce: false,
      path: input.path,
      targetMetadata: input.targetConfig?.metadata ?? null,
      targetSources: input.targetConfig?.eventing.external ?? [],
      type: EXTERNAL_PROVIDER_TYPE,
      unresolvedCleanupResources: input.unresolvedCleanupResources,
    }),
  );
}
