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

import { toItemRef } from "#management/common/workflow/resource";

import {
  eventRef,
  metadataReason,
  providerReason,
  registrationReason,
  registrationRefs,
  registrationValues,
  subscriptionReason,
} from "./operations";
import {
  COMMERCE_PROVIDER_TYPE,
  getNamespacedEvent,
  getProviderSnapshots,
} from "./utils";

import type { EventProviderType } from "@adobe/aio-commerce-lib-events/io-events";
import type { getInstallCommerceEnv } from "#config/lib/environment";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { AppEvent } from "#config/schema/eventing";
import type {
  ItemRef,
  ResourceChange,
} from "#management/common/workflow/resource";
import type { LeafPlanContext } from "./operations";
import type { EventingProviderSnapshot } from "./types";

/**
 * The events the target declares that the baseline does not (`add`), the other way around
 * (`remove`), and those both declare that the planner would change from the baseline (`update`).
 * Events match by provider key and namespaced name, and only the events that apply to the
 * environment count. An event is changed when the reason of any operation that serves it is
 * `change`: its provider, its metadata, its subscription or a registration routing it.
 *
 * @param baselineConfig - The installed config, or `null` when the domain was absent.
 * @param targetConfig - The config to install, or `null` when the domain should be absent.
 * @param type - The provider type, which selects Commerce or external events.
 * @param env - The Commerce environment the app is installed in.
 * @param appId - The app's `metadata.id`, which namespaces the event names.
 */
export function planEventChanges(
  baselineConfig: CommerceAppConfigOutputModel | null,
  targetConfig: CommerceAppConfigOutputModel | null,
  type: EventProviderType,
  env: ReturnType<typeof getInstallCommerceEnv>,
  appId: string,
): ResourceChange[] {
  const baseline = getProviderSnapshots(baselineConfig, type, env);
  const target = getProviderSnapshots(targetConfig, type, env);
  const ctx = createConfigContext(baseline, type, appId);

  const baselineRefs = new Map(
    baseline.flatMap((snapshot) => toEventRefs(snapshot, ctx)),
  );

  const targetRefs = target.flatMap((snapshot) => {
    const changed = getChangedKeys(snapshot, ctx);
    return toEventRefs(snapshot, ctx).map(([key, ref]) => {
      const kind = baselineRefs.has(key) ? "update" : "add";
      return { changed: changed.has(key), key, kind, ref } as const;
    });
  });

  const targetKeys = new Set(targetRefs.map(({ key }) => key));
  return [
    ...targetRefs
      .filter(({ kind, changed }) => kind === "add" || changed)
      .map(({ key, kind, ref }) => ({ itemRef: ref, key, kind })),
    ...[...baselineRefs]
      .filter(([key]) => !targetKeys.has(key))
      .map(([key, ref]) => ({ itemRef: ref, key, kind: "remove" as const })),
  ];
}

/**
 * The context the reason functions read the baseline from. The live fields stay empty, since the
 * reasons only compare against the baseline's providers.
 */
function createConfigContext(
  baseline: EventingProviderSnapshot[],
  type: EventProviderType,
  appId: string,
): LeafPlanContext {
  return {
    configuredValues: {},
    declared: new Map(baseline.map((snapshot) => [snapshot.key, snapshot])),
    emptyRegistrations: [],
    isCommerce: type === COMMERCE_PROVIDER_TYPE,
    metadata: { id: appId },
    subscriptions: new Map(),
    type,
    workspaceId: "",
  };
}

/** The reference of every event of a provider, by its key. */
function toEventRefs(
  snapshot: EventingProviderSnapshot,
  ctx: LeafPlanContext,
): [string, ItemRef][] {
  return snapshot.events.map((event) => {
    const { key } = eventRef(
      snapshot.key,
      getNamespacedEvent(ctx.metadata, event.name),
    );

    return [key, toItemRef(key, event)];
  });
}

/** The keys of the events of a provider that the planner would change from the baseline. */
function getChangedKeys(
  snapshot: EventingProviderSnapshot,
  ctx: LeafPlanContext,
): Set<string> {
  const refKey = (event: AppEvent) =>
    eventRef(snapshot.key, getNamespacedEvent(ctx.metadata, event.name)).key;

  const isProviderChanged = providerReason(snapshot, ctx) === "change";
  const changed = snapshot.events.filter(
    (event) =>
      isProviderChanged ||
      metadataReason(snapshot, event, ctx) === "change" ||
      (ctx.isCommerce && subscriptionReason(snapshot, event, ctx) === "change"),
  );

  const viaRegistrations = registrationValues(snapshot, "", ctx)
    .filter((value) => registrationReason(snapshot, value, ctx) === "change")
    .flatMap((value) =>
      registrationRefs(snapshot.key, snapshot.events, value.runtimeAction, ctx),
    );

  return new Set([
    ...changed.map(refKey),
    ...viaRegistrations.map((r) => r.key),
  ]);
}
