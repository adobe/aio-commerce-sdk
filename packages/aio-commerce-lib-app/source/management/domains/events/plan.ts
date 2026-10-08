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
import stringify from "safe-stable-stringify";

import { getInstallCommerceEnv } from "#config/lib/environment";

import {
  findLiveProvider,
  planExistingProvider,
  planLeftoverProvider,
  planNewProvider,
} from "./diff";
import { readLiveEventingState } from "./live";
import { toSubscriptionValues } from "./operations";
import {
  COMMERCE_PROVIDER_TYPE,
  EXTERNAL_PROVIDER_TYPE,
  getNamespacedEvent,
  getProviderSnapshots,
  isIoProviderProvenOwnedByApp,
} from "./utils";

import type { CommerceEventSubscription } from "@adobe/aio-commerce-lib-events/commerce";
import type { EventProviderType } from "@adobe/aio-commerce-lib-events/io-events";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type {
  CommerceEvent,
  CommerceEventsConfig,
  ExternalEventsConfig,
} from "#config/schema/eventing";
import type { ApplicationMetadata } from "#config/schema/metadata";
import type {
  PlanningInput,
  PlanningIssue,
  PlanningResult,
} from "#management/common/workflow/resource";
import type { ValidationExecutionContext } from "#management/common/workflow/step";
import type { EventsStepContext } from "./context";
import type { LiveEventingProvider, LiveEventingState } from "./live";
import type { LeafPlanContext, Operation } from "./operations";
import type {
  EventingDomainPlan,
  EventingProviderSnapshot,
  EventingSnapshotData,
  SubscriptionValues,
} from "./types";

/** What differs between the Commerce and the external event leaves. */
type EventingLeaf = {
  type: EventProviderType;
  isCommerce: boolean;
};

/** The order operations are listed in, by kind. */
const KIND_ORDER: Record<Operation["kind"], number> = {
  add: 2,
  remove: 0,
  update: 1,
};

const COMMERCE_LEAF: EventingLeaf = {
  isCommerce: true,
  type: COMMERCE_PROVIDER_TYPE,
};

const EXTERNAL_LEAF: EventingLeaf = {
  isCommerce: false,
  type: EXTERNAL_PROVIDER_TYPE,
};

/**
 * Plans the Commerce eventing changes by diffing live I/O Events and Commerce state against the
 * target config. Blocks with `EVENTS_LIVE_READ_FAILED` if the live state cannot be read, and with
 * `EVENTS_SUBSCRIPTION_NOT_OWNED` if a target subscription name is taken under a provider the app
 * does not own.
 *
 * @param input - The planning input (baseline, target config, failed attempt, path).
 * @param context - The execution context with the eventing clients.
 */
export function planCommerceEvents(
  input: PlanningInput<CommerceEventsConfig, EventingSnapshotData>,
  context: ValidationExecutionContext<EventsStepContext>,
): Promise<PlanningResult<EventingDomainPlan>> {
  return planEventingLeaf(input, context, COMMERCE_LEAF);
}

/**
 * Plans the external eventing changes by diffing live I/O Events state against the target config.
 * Same as {@link planCommerceEvents}, without Commerce providers and subscriptions.
 *
 * @param input - The planning input.
 * @param context - The execution context with the eventing clients.
 */
export function planExternalEvents(
  input: PlanningInput<ExternalEventsConfig, EventingSnapshotData>,
  context: ValidationExecutionContext<EventsStepContext>,
): Promise<PlanningResult<EventingDomainPlan>> {
  return planEventingLeaf(input, context, EXTERNAL_LEAF);
}

/** The env-scoped providers of the configs one leaf plans against. */
type LeafConfigs = {
  target: EventingProviderSnapshot[];
  declared: EventingProviderSnapshot[];
  failed: EventingProviderSnapshot[];
  failedPlan: EventingDomainPlan | null;
};

/** The target providers paired with their live copies, and the owned live providers left over. */
type ProviderMatches = {
  /** Every target provider with its live copy, or `null` when it does not exist live. */
  matched: {
    target: EventingProviderSnapshot;
    live: LiveEventingProvider | null;
  }[];

  /** The live providers the app owns that no target provider matches. */
  leftovers: LiveEventingProvider[];
};

/** Plans one event kind against its live state. */
async function planEventingLeaf(
  input: PlanningInput<CommerceAppConfigOutputModel, EventingSnapshotData>,
  context: ValidationExecutionContext<EventsStepContext>,
  leaf: EventingLeaf,
): Promise<PlanningResult<EventingDomainPlan>> {
  const { path } = input;
  const configs = resolveLeafConfigs(input, context, leaf);
  if (!hasEventsToPlan(configs)) {
    return { kind: "planned", plan: { operations: [], path } };
  }

  let live: LiveEventingState;
  try {
    live = await readLiveEventingState(context, leaf.type, leaf.isCommerce);
  } catch (error) {
    return blocked([
      {
        code: "EVENTS_LIVE_READ_FAILED",
        domain: "eventing",
        message: `Could not read the live event state to plan against: ${await unwrapHttpError(error)}`,
      },
    ]);
  }

  const ctx = createLeafPlanContext(configs, live, context, leaf);
  const matches = matchProviders(configs, live, context.appId, ctx);

  const foreignSubscriptions = findForeignSubscriptions(configs, matches, ctx);
  if (foreignSubscriptions.length > 0) {
    return blocked(
      foreignSubscriptions.map((subscription) => ({
        code: "EVENTS_SUBSCRIPTION_NOT_OWNED",
        domain: "eventing",
        message: `Commerce subscription "${subscription.name}" belongs to provider "${subscription.provider_id}", which this app does not own.`,
      })),
    );
  }

  const operations = planProviders(configs, matches, context.appId, ctx);
  return {
    kind: "planned",
    plan: {
      configuredValues: leaf.isCommerce ? ctx.configuredValues : undefined,
      operations: operations.sort(
        (a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind],
      ),
      path,
    },
  };
}

/** A blocked planning result with the given issues. */
function blocked(issues: PlanningIssue[]): PlanningResult<EventingDomainPlan> {
  return { issues, kind: "blocked" };
}

/** Reads the leaf's providers from the target, the baseline and the failed attempt's target. */
function resolveLeafConfigs(
  input: PlanningInput<CommerceAppConfigOutputModel, EventingSnapshotData>,
  context: ValidationExecutionContext<EventsStepContext>,
  leaf: EventingLeaf,
): LeafConfigs {
  const env = getInstallCommerceEnv(context.params);
  const toSnapshots = (config: CommerceAppConfigOutputModel | null) =>
    getProviderSnapshots(config, leaf.type, env);

  return {
    declared: toSnapshots(input.baseline?.config ?? null),
    failed: toSnapshots(input.failedAttempt?.targetConfig ?? null),
    failedPlan: input.failedAttempt?.plan as EventingDomainPlan | null,
    target: toSnapshots(input.targetConfig),
  };
}

/**
 * Whether any config declares events of the leaf, or the failed attempt planned some. Without
 * either there is nothing of ours live to plan for.
 */
function hasEventsToPlan(configs: LeafConfigs) {
  return (
    configs.target.length > 0 ||
    configs.declared.length > 0 ||
    configs.failed.length > 0 ||
    (configs.failedPlan?.operations.length ?? 0) > 0
  );
}

/** Builds what the per-provider planners share. */
function createLeafPlanContext(
  configs: LeafConfigs,
  live: LiveEventingState,
  context: ValidationExecutionContext<EventsStepContext>,
  leaf: EventingLeaf,
): LeafPlanContext {
  const metadata = { id: context.appId };
  const configuredValues = leaf.isCommerce
    ? collectConfiguredValues(
        [...configs.declared, ...configs.failed],
        metadata,
        { ...configs.failedPlan?.configuredValues },
      )
    : {};

  return {
    configuredValues,
    declared: new Map(configs.declared.map((p) => [p.key, p])),
    emptyRegistrations: live.emptyRegistrations,
    isCommerce: leaf.isCommerce,
    metadata,
    subscriptions: live.subscriptions,
    type: leaf.type,
    workspaceId: context.appData.workspaceId,
  };
}

/**
 * Pairs every target provider with its live copy, and collects the live providers the app owns
 * that no target provider matches: proven by instance id, or declared by the baseline.
 */
function matchProviders(
  configs: LeafConfigs,
  live: LiveEventingState,
  appId: string,
  ctx: LeafPlanContext,
): ProviderMatches {
  const matched = configs.target.map((target) => ({
    live: findLiveProvider(live.providers, target.provider, ctx),
    target,
  }));

  const leftovers = live.providers.filter((provider) => {
    const isMatched = matched.some((m) => m.live === provider);
    const isOwned =
      isIoProviderProvenOwnedByApp(
        provider.ioProvider.instance_id,
        appId,
        ctx.workspaceId,
      ) ||
      configs.declared.some(
        (declared) =>
          findLiveProvider([provider], declared.provider, ctx) !== null,
      );

    return isOwned && !isMatched;
  });

  return { leftovers, matched };
}

/** The live Commerce subscriptions with a target name under a provider the app does not own. */
function findForeignSubscriptions(
  configs: LeafConfigs,
  matches: ProviderMatches,
  ctx: LeafPlanContext,
): CommerceEventSubscription[] {
  const ownedProviderIds = new Set(
    [
      ...matches.matched.flatMap((m) => (m.live ? [m.live] : [])),
      ...matches.leftovers,
    ].map((provider) => provider.ioProvider.id),
  );

  // Commerce subscription names are unique, so taking one over would delete another owner's subscription.
  return [...getTargetSubscriptionNames(configs, ctx)].flatMap((name) => {
    const current = ctx.subscriptions.get(name);
    return current && !ownedProviderIds.has(current.provider_id)
      ? [current]
      : [];
  });
}

/** Plans every leftover provider's removal, then every target provider against its live copy. */
function planProviders(
  configs: LeafConfigs,
  matches: ProviderMatches,
  appId: string,
  ctx: LeafPlanContext,
): Operation[] {
  const names = getTargetSubscriptionNames(configs, ctx);
  const leftoverProviderIds = new Set(
    matches.leftovers.map((provider) => provider.ioProvider.id),
  );

  return [
    ...matches.leftovers.flatMap((provider) =>
      planLeftoverProvider(provider, appId, ctx),
    ),
    ...matches.matched.flatMap(({ target, live }) =>
      live
        ? planExistingProvider(target, live, names, leftoverProviderIds, ctx)
        : planNewProvider(target, leftoverProviderIds, ctx),
    ),
  ];
}

/** The Commerce subscription names of every target event. */
function getTargetSubscriptionNames(
  configs: LeafConfigs,
  ctx: LeafPlanContext,
): Set<string> {
  return new Set(
    configs.target.flatMap((target) =>
      target.events.map((event) =>
        getNamespacedEvent(ctx.metadata, event.name),
      ),
    ),
  );
}

/** Adds the subscription values of the given providers' Commerce events, skipping exact duplicates. */
function collectConfiguredValues(
  providers: EventingProviderSnapshot[],
  metadata: Pick<ApplicationMetadata, "id">,
  into: Record<string, Partial<SubscriptionValues>[]>,
): Record<string, Partial<SubscriptionValues>[]> {
  for (const event of providers.flatMap((p) => p.events as CommerceEvent[])) {
    const name = getNamespacedEvent(metadata, event.name);
    const values = toSubscriptionValues(event);
    const known = into[name] ?? [];

    if (!known.some((other) => stringify(other) === stringify(values))) {
      into[name] = [...known, values];
    }
  }

  return into;
}
