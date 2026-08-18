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
  groupEventsByRuntimeActions,
  partitionByKey,
} from "./utils";

import type { CommerceEnv } from "@adobe/aio-commerce-lib-core/commerce";
import type { EventProviderType } from "@adobe/aio-commerce-lib-events/io-events";
import type {
  AppEvent,
  CommerceEventsConfig,
  EventProvider,
  ExternalEventsConfig,
} from "#config/schema/eventing";
import type { ApplicationMetadata } from "#config/schema/metadata";
import type {
  PlanningInput,
  PlanningResult,
  ResourceOperation,
} from "#management/common/workflow/resource";
import type { ValidationExecutionContext } from "#management/common/workflow/step";
import type { EventsStepContext } from "./context";
import type {
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
  env: CommerceEnv;
};

/** Reduces config event sources to env-scoped provider snapshots (skipping empty providers). */
function sourcesToSnapshots(
  sources: EventSource[],
  type: EventProviderType,
  env: CommerceEnv,
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

/** Accumulates the operations and removed providers for one leaf. */
class LeafPlanBuilder {
  public readonly operations: ResourceOperation<EventingOperationValue>[] = [];
  public readonly removedProviders: EventingProviderSnapshot[] = [];

  private add(value: EventingOperationValue, label: string): void {
    this.operations.push({
      after: value,
      id: operationId("add", value),
      kind: "add",
      label,
    });
  }

  private remove(value: EventingOperationValue, label: string): void {
    this.operations.push({
      before: value,
      id: operationId("remove", value),
      kind: "remove",
      label,
    });
  }

  private update(
    before: EventingOperationValue,
    after: EventingOperationValue,
    label: string,
  ): void {
    this.operations.push({
      after,
      before,
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
    );

    for (const event of events) {
      const eventCode = eventCodeOf(event, metadata, type);
      this.add(
        {
          description: event.description,
          eventCode,
          label: event.label,
          providerKey: key,
          resourceType: "metadata",
          type,
        },
        `Register event metadata: ${eventCode}`,
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
          resourceType: "registration",
          runtimeAction,
          type,
        },
        `Create registration: ${provider.label} → ${runtimeAction}`,
      );
    }

    if (isCommerce) {
      for (const event of events) {
        const name = getNamespacedEvent(metadata, event.name);
        this.add(
          { name, providerKey: key, resourceType: "subscription" },
          `Create Commerce subscription: ${name}`,
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
    // Provider label/description are real data, but our events client exposes no provider-update
    // endpoint (only create/delete), so drift in them is left as-is rather than tearing down and
    // recreating the whole provider for a display-only change. Only sub-resources diff.
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
    const { key, type } = target;
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
          resourceType: "metadata",
          type,
        },
        `Register event metadata: ${eventCode}`,
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
        resourceType: "registration",
        runtimeAction,
        type,
      };

      if (!baselineForAction) {
        this.add(
          after,
          `Create registration: ${provider.label} → ${runtimeAction}`,
        );
        continue;
      }

      const before: EventingOperationValue = {
        eventCodes: codes(baselineForAction, baselineMetadata),
        providerKey: key,
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
      );
    }

    for (const event of removed) {
      const name = getNamespacedEvent(baselineMetadata, event.name);
      this.remove(
        { name, providerKey: key, resourceType: "subscription" },
        `Remove Commerce subscription: ${name}`,
      );
    }
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

  const builder = new LeafPlanBuilder();

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

  return {
    kind: "planned",
    plan: {
      baselineMetadata,
      baselineProviders,
      // A plan always has at least one side, so at least one metadata is present.
      metadata: (targetMetadata ?? baselineMetadata) as ApplicationMetadata,
      operations: builder.operations,
      path,
      removedProviders: builder.removedProviders,
      targetProviders,
    },
  };
}

/**
 * Plans the Commerce eventing changes between the installed baseline and the target config. Pure:
 * diffs provider/metadata/registration/subscription resources into add/remove/update operations
 * without any I/O. In-place provider/metadata/subscription changes have no update API and are left
 * as-is; registration event-set changes are emitted as `update` (applied via a full-replace PUT).
 *
 * @param input - The planning input (baseline config + snapshot, target config, path).
 * @param context - The side-effect-free execution context (used to resolve the install environment).
 */
export function planCommerceEvents(
  input: PlanningInput<CommerceEventsConfig, EventingSnapshotData>,
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
  input: PlanningInput<ExternalEventsConfig, EventingSnapshotData>,
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
    }),
  );
}
