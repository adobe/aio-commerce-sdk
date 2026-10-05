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

import { describe, expect, test } from "vitest";

import {
  planCommerceEvents,
  planExternalEvents,
} from "#management/domains/events/plan";
import {
  COMMERCE_PROVIDER_TYPE,
  EXTERNAL_PROVIDER_TYPE,
  eventCodeOf,
  generateInstanceId,
  generateInstanceIdDeprecated,
  getNamespacedEvent,
  getProviderKey,
  getRegistrationDescription,
  getRegistrationName,
  groupEventsByRuntimeActions,
} from "#management/domains/events/utils";
import { configWithCommerceEventing } from "#test/fixtures/config";
import {
  createMockCommerceEventsConfig as commerceConfig,
  createMockEventingInstallationContext,
  createMockAppEvent as event,
  createMockExternalEventsConfig as externalConfig,
  TEST_CLIENT_ID,
  TEST_WORKSPACE_ID,
} from "#test/fixtures/eventing";

import type {
  CommerceEventProvider,
  CommerceEventSubscription,
} from "@adobe/aio-commerce-lib-events/commerce";
import type {
  EventProviderType,
  IoEventRegistration,
} from "@adobe/aio-commerce-lib-events/io-events";
import type {
  AppEvent,
  CommerceEvent,
  CommerceEventsConfig,
  ExternalEventsConfig,
} from "#config/schema/eventing";
import type { PlanningInput } from "#management/common/workflow/resource";
import type {
  EventingDomainPlan,
  EventingOperationValue,
  EventingSnapshotData,
} from "#management/domains/events/types";

const { metadata } = configWithCommerceEventing;

type LiveProvider = {
  id: string;
  instance_id: string;
  label: string;
  description?: string;
  provider_metadata: string;
  _embedded: {
    eventmetadata: { event_code: string; label: string; description: string }[];
  };
};

/** Live I/O Events and Commerce state, as the list endpoints return it. */
type World = {
  providers: LiveProvider[];
  registrations: IoEventRegistration[];
  commerceProviders: CommerceEventProvider[];
  subscriptions: CommerceEventSubscription[];
};

type Config = CommerceEventsConfig | ExternalEventsConfig;

/** Builds the live state an install of the given config leaves behind. */
function deployed(config: Config, type: EventProviderType): World {
  const isCommerce = type === COMMERCE_PROVIDER_TYPE;
  const sources = isCommerce
    ? (config as CommerceEventsConfig).eventing.commerce
    : (config as ExternalEventsConfig).eventing.external;

  const world: World = {
    commerceProviders: [],
    providers: [],
    registrations: [],
    subscriptions: [],
  };

  for (const { provider, events } of sources) {
    const id = `io-${getProviderKey(provider)}`;
    const instanceId = generateInstanceId(
      metadata,
      provider,
      TEST_WORKSPACE_ID,
    );
    const ioProvider = {
      instance_id: instanceId,
      label: provider.label,
      provider_metadata: type,
    };

    world.providers.push({
      ...ioProvider,
      _embedded: {
        eventmetadata: events.map((e: AppEvent) => ({
          description: e.description,
          event_code: eventCodeOf(e, metadata, type),
          label: e.label,
        })),
      },
      description: provider.description,
      id,
    });

    for (const [action, grouped] of groupEventsByRuntimeActions(events)) {
      world.registrations.push({
        client_id: TEST_CLIENT_ID,
        delivery_type: "webhook",
        description: getRegistrationDescription(ioProvider, grouped, action),
        enabled: true,
        events_of_interest: grouped.map((e) => ({
          event_code: eventCodeOf(e, metadata, type),
          provider_id: id,
        })),
        id: `reg-${id}-${action}`,
        integration_status: "enabled",
        name: getRegistrationName(ioProvider, action),
        registration_id: `reg-${id}-${action}`,
        runtime_action: action,
        status: "enabled",
        type: "workspace",
      } as IoEventRegistration);
    }

    if (isCommerce) {
      world.commerceProviders.push({
        description: provider.description,
        id: `commerce-${id}`,
        instance_id: instanceId,
        label: provider.label,
        provider_id: id,
      });

      for (const e of events as CommerceEvent[]) {
        world.subscriptions.push({
          destination: "default",
          fields: e.fields,
          hipaa_audit_required: e.hipaa_audit_required ?? false,
          name: getNamespacedEvent(metadata, e.name),
          parent: e.name,
          priority: e.priority ?? false,
          provider_id: id,
          rules: e.rules ?? [],
        } as CommerceEventSubscription);
      }
    }
  }

  return world;
}

function contextFor(world: World | Error) {
  const read = <T>(value: () => T) =>
    world instanceof Error
      ? () => Promise.reject(world)
      : () => Promise.resolve(value());

  const w = world as World;
  return createMockEventingInstallationContext({
    appId: metadata.id,
    commerceEventsClient: {
      getAllEventProviders: read(() => w.commerceProviders),
      getAllEventSubscriptions: read(() => w.subscriptions),
    } as never,
    ioEventsClient: {
      getAllEventProviders: read(() => ({
        _embedded: { providers: w.providers },
      })),
      getAllRegistrations: read(() => ({
        _embedded: { registrations: w.registrations },
      })),
    } as never,
    params: { AIO_COMMERCE_API_FLAVOR: "paas" },
  });
}

type PlanArgs<TConfig> = {
  baseline?: TConfig | null;
  target?: TConfig | null;
  live: World | Error;
  failedAttempt?: {
    targetConfig: TConfig | null;
    plan: EventingDomainPlan | null;
  };
};

function input<TConfig>(path: string, args: PlanArgs<TConfig>) {
  const { baseline = null, target = null, failedAttempt } = args;
  return {
    baseline: baseline ? { config: baseline, data: null } : null,
    failedAttempt,
    path: ["eventing", path],
    targetConfig: target,
  } as unknown as PlanningInput<TConfig, EventingSnapshotData>;
}

async function planCommerce(args: PlanArgs<CommerceEventsConfig>) {
  const result = await planCommerceEvents(
    input("commerce", args),
    contextFor(args.live),
  );
  expect.assert(result.kind === "planned");
  return result.plan;
}

async function planExternal(args: PlanArgs<ExternalEventsConfig>) {
  const result = await planExternalEvents(
    input("external", args),
    contextFor(args.live),
  );
  expect.assert(result.kind === "planned");
  return result.plan;
}

/** Operations as `kind resourceType reason`, plus the changeMode for subscription updates. */
function summary(plan: EventingDomainPlan): string[] {
  return plan.operations.map((op) => {
    const value: EventingOperationValue =
      op.kind === "remove" ? op.before : op.after;
    const mode =
      value.resourceType === "subscription" && value.changeMode
        ? `:${value.changeMode}`
        : "";
    return `${op.kind} ${value.resourceType}${mode} ${op.reason}`;
  });
}

const commerceEvent = (overrides: Partial<CommerceEvent> = {}): CommerceEvent =>
  ({
    ...event("observer.order_placed", ["pkg/a"]),
    fields: [{ name: "sku" }],
    ...overrides,
  }) as CommerceEvent;

const oneProvider = (
  events: AppEvent[],
  provider = { description: "d", key: "orders", label: "Orders" },
) => commerceConfig([{ events, provider }]);

const subscriptionName = getNamespacedEvent(metadata, "observer.order_placed");

describe("planCommerceEvents", () => {
  test("plans nothing when live matches the target", async () => {
    const config = oneProvider([commerceEvent()]);
    const plan = await planCommerce({
      baseline: config,
      live: deployed(config, COMMERCE_PROVIDER_TYPE),
      target: config,
    });

    expect(plan.operations).toEqual([]);
  });

  test("plans every resource of a new provider as a change", async () => {
    const plan = await planCommerce({
      live: deployed(commerceConfig([]), COMMERCE_PROVIDER_TYPE),
      target: oneProvider([commerceEvent()]),
    });

    expect(summary(plan)).toEqual([
      "add provider change",
      "add commerceProvider change",
      "add metadata change",
      "add registration change",
      "add subscription change",
    ]);
  });

  test("restores a provider the baseline declares but live lacks as drift", async () => {
    const config = oneProvider([commerceEvent()]);
    const plan = await planCommerce({
      baseline: config,
      live: deployed(commerceConfig([]), COMMERCE_PROVIDER_TYPE),
      target: config,
    });

    expect(summary(plan)).toEqual([
      "add provider drift",
      "add commerceProvider drift",
      "add metadata drift",
      "add registration drift",
      "add subscription drift",
    ]);
  });

  test("restores a missing subscription as drift", async () => {
    const config = oneProvider([commerceEvent()]);
    const live = deployed(config, COMMERCE_PROVIDER_TYPE);
    live.subscriptions = [];

    const plan = await planCommerce({ baseline: config, live, target: config });

    expect(summary(plan)).toEqual(["add subscription drift"]);
  });

  test("updates a registration that lost all its events instead of adding another", async () => {
    const config = oneProvider([commerceEvent()]);
    const live = deployed(config, COMMERCE_PROVIDER_TYPE);
    live.registrations[0].events_of_interest = [];

    const plan = await planCommerce({ baseline: config, live, target: config });

    expect(summary(plan)).toEqual(["update registration drift"]);
    expect(plan.operations[0]).toMatchObject({
      before: { registrationId: live.registrations[0].registration_id },
    });
  });

  test("removes a second registration for the same action as drift", async () => {
    const config = oneProvider([commerceEvent()]);
    const live = deployed(config, COMMERCE_PROVIDER_TYPE);
    live.registrations.push({
      ...live.registrations[0],
      name: "Old name",
      registration_id: "reg-duplicate",
    });

    const plan = await planCommerce({ baseline: config, live, target: config });

    expect(summary(plan)).toEqual(["remove registration drift"]);
    expect(plan.operations[0]).toMatchObject({
      before: { registrationId: "reg-duplicate" },
    });
  });

  test("replaces a subscription whose rules were edited out of band", async () => {
    const config = oneProvider([
      commerceEvent({
        rules: [{ field: "qty", operator: "greaterThan", value: "1" }],
      }),
    ]);
    const live = deployed(config, COMMERCE_PROVIDER_TYPE);
    live.subscriptions[0].rules = [
      { field: "sku", operator: "equal", value: "x" },
    ];

    const plan = await planCommerce({ baseline: config, live, target: config });

    expect(summary(plan)).toEqual([
      "update registration drift",
      "update subscription:replace drift",
    ]);
  });

  test("updates a subscription in place when the target adds a field", async () => {
    const baseline = oneProvider([commerceEvent()]);
    const target = oneProvider([
      commerceEvent({ fields: [{ name: "sku" }, { name: "qty" }] }),
    ]);

    const plan = await planCommerce({
      baseline,
      live: deployed(baseline, COMMERCE_PROVIDER_TYPE),
      target,
    });

    expect(summary(plan)).toEqual(["update subscription:in-place change"]);
  });

  test("replaces a subscription when the target drops a setting the baseline set", async () => {
    const baseline = oneProvider([commerceEvent({ priority: true })]);
    const target = oneProvider([commerceEvent()]);

    const plan = await planCommerce({
      baseline,
      live: deployed(baseline, COMMERCE_PROVIDER_TYPE),
      target,
    });

    expect(summary(plan)).toEqual([
      "update registration drift",
      "update subscription:replace change",
    ]);
  });

  test("keeps a live setting no config set for a field the target leaves out", async () => {
    const config = oneProvider([commerceEvent()]);
    const live = deployed(config, COMMERCE_PROVIDER_TYPE);
    live.subscriptions[0].priority = true;

    const plan = await planCommerce({ baseline: config, live, target: config });

    expect(plan.operations).toEqual([]);
  });

  test("resets a setting the failed attempt's target set", async () => {
    const config = oneProvider([commerceEvent()]);
    const live = deployed(config, COMMERCE_PROVIDER_TYPE);
    live.subscriptions[0].priority = true;

    const plan = await planCommerce({
      baseline: config,
      failedAttempt: {
        plan: null,
        targetConfig: oneProvider([commerceEvent({ priority: true })]),
      },
      live,
      target: config,
    });

    expect(summary(plan)).toEqual([
      "update registration drift",
      "update subscription:replace drift",
    ]);
  });

  test("resets a setting an earlier failed attempt set, carried by the failed plan", async () => {
    const config = oneProvider([commerceEvent()]);
    const earlier = await planCommerce({
      baseline: config,
      failedAttempt: {
        plan: null,
        targetConfig: oneProvider([commerceEvent({ priority: true })]),
      },
      live: deployed(config, COMMERCE_PROVIDER_TYPE),
      target: config,
    });

    const live = deployed(config, COMMERCE_PROVIDER_TYPE);
    live.subscriptions[0].priority = true;

    const plan = await planCommerce({
      baseline: config,
      failedAttempt: { plan: earlier, targetConfig: config },
      live,
      target: config,
    });

    expect(earlier.configuredValues?.[subscriptionName]).toContainEqual(
      expect.objectContaining({ priority: true }),
    );
    expect(summary(plan)).toEqual([
      "update registration drift",
      "update subscription:replace drift",
    ]);
  });

  test("replaces a subscription that moves from a kept provider to a new one", async () => {
    const orders = { description: "d", key: "orders", label: "Orders" };
    const moved = commerceEvent({ name: "observer.order_cancelled" });
    const baseline = commerceConfig([
      { events: [commerceEvent(), moved], provider: orders },
    ]);
    const target = commerceConfig([
      { events: [commerceEvent()], provider: orders },
      {
        events: [moved],
        provider: { description: "d", key: "other", label: "Other" },
      },
    ]);

    const plan = await planCommerce({
      baseline,
      live: deployed(baseline, COMMERCE_PROVIDER_TYPE),
      target,
    });

    expect(summary(plan)).toEqual([
      "remove metadata change",
      "update registration change",
      "update subscription:replace change",
      "add provider change",
      "add commerceProvider change",
      "add metadata change",
      "add registration change",
    ]);
  });

  test("adds the subscription of a provider whose key changed, after removing the old provider", async () => {
    const baseline = oneProvider([commerceEvent()]);
    const target = oneProvider([commerceEvent()], {
      description: "d",
      key: "orders-2",
      label: "Orders",
    });

    const plan = await planCommerce({
      baseline,
      live: deployed(baseline, COMMERCE_PROVIDER_TYPE),
      target,
    });

    expect(summary(plan)).toEqual([
      "remove subscription change",
      "remove registration change",
      "remove metadata change",
      "remove commerceProvider change",
      "remove provider change",
      "add provider change",
      "add commerceProvider change",
      "add metadata change",
      "add registration change",
      "add subscription change",
    ]);
  });

  test("blocks when a target subscription belongs to a provider the app does not own", async () => {
    const config = oneProvider([commerceEvent()]);
    const live = deployed(config, COMMERCE_PROVIDER_TYPE);
    live.subscriptions[0].provider_id = "io-somewhere-else";

    const result = await planCommerceEvents(
      input("commerce", { baseline: config, live, target: config }),
      contextFor(live),
    );

    expect(result).toEqual({
      issues: [
        expect.objectContaining({
          code: "EVENTS_SUBSCRIPTION_NOT_OWNED",
          domain: "eventing",
          message: expect.stringContaining("io-somewhere-else"),
        }),
      ],
      kind: "blocked",
    });
  });

  test("moves a subscription from an owned leftover provider to the target provider", async () => {
    const config = oneProvider([commerceEvent()]);
    const leftover = oneProvider([commerceEvent()], {
      description: "d",
      key: "leftover",
      label: "Leftover",
    });
    const live = deployed(config, COMMERCE_PROVIDER_TYPE);
    const extra = deployed(leftover, COMMERCE_PROVIDER_TYPE);
    live.providers.push(...extra.providers);
    live.commerceProviders.push(...extra.commerceProviders);
    live.subscriptions = extra.subscriptions;

    const plan = await planCommerce({ baseline: config, live, target: config });

    expect(summary(plan)).toEqual([
      "remove subscription drift",
      "remove metadata drift",
      "remove commerceProvider drift",
      "remove provider drift",
      "add subscription drift",
    ]);
  });

  test("replaces a subscription that hangs off another provider of the app", async () => {
    const config = commerceConfig([
      {
        events: [commerceEvent()],
        provider: { description: "d", key: "orders", label: "Orders" },
      },
      {
        events: [commerceEvent({ name: "observer.order_cancelled" })],
        provider: { description: "d", key: "other", label: "Other" },
      },
    ]);
    const live = deployed(config, COMMERCE_PROVIDER_TYPE);
    live.subscriptions[1].provider_id = "io-orders";

    const plan = await planCommerce({ baseline: config, live, target: config });

    expect(summary(plan)).toEqual([
      "update registration drift",
      "update subscription:replace drift",
    ]);
    expect(plan.operations[1]).toMatchObject({
      after: { changeMode: "replace", providerId: "io-other" },
    });
  });

  test("removes a subscription the target drops as a change, and an unknown one on the provider as drift", async () => {
    const baseline = oneProvider([
      commerceEvent(),
      commerceEvent({ name: "observer.order_cancelled" }),
    ]);
    const target = oneProvider([commerceEvent()]);
    const live = deployed(baseline, COMMERCE_PROVIDER_TYPE);
    live.subscriptions.push({
      ...live.subscriptions[0],
      name: getNamespacedEvent(metadata, "observer.leftover"),
    });

    const plan = await planCommerce({ baseline, live, target });

    const removedSubscriptions = plan.operations.filter(
      (op) => op.kind === "remove" && op.before.resourceType === "subscription",
    );
    expect(removedSubscriptions).toEqual([
      expect.objectContaining({
        before: expect.objectContaining({
          name: getNamespacedEvent(metadata, "observer.order_cancelled"),
        }),
        reason: "change",
      }),
      expect.objectContaining({
        before: expect.objectContaining({
          name: getNamespacedEvent(metadata, "observer.leftover"),
        }),
        reason: "drift",
      }),
    ]);
  });

  test("updates metadata whose label drifted, and labels a target label change as a change", async () => {
    const config = oneProvider([commerceEvent()]);
    const drifted = deployed(config, COMMERCE_PROVIDER_TYPE);
    drifted.providers[0]._embedded.eventmetadata[0].label = "edited";

    const driftPlan = await planCommerce({
      baseline: config,
      live: drifted,
      target: config,
    });
    const changePlan = await planCommerce({
      baseline: config,
      live: deployed(config, COMMERCE_PROVIDER_TYPE),
      target: oneProvider([commerceEvent({ label: "Renamed" })]),
    });

    expect(summary(driftPlan)).toEqual(["update metadata drift"]);
    expect(summary(changePlan)).toEqual(["update metadata change"]);
  });

  test("updates the provider and its Commerce provider, and recreates its renamed registrations, when the label changes", async () => {
    const baseline = oneProvider([commerceEvent()]);
    const target = oneProvider([commerceEvent()], {
      description: "d",
      key: "orders",
      label: "Orders Renamed",
    });

    const plan = await planCommerce({
      baseline,
      live: deployed(baseline, COMMERCE_PROVIDER_TYPE),
      target,
    });

    expect(summary(plan)).toEqual([
      "remove registration change",
      "update provider change",
      "update commerceProvider change",
      "add registration change",
    ]);
    expect(plan.operations[2]).toMatchObject({
      before: {
        commerceProviderId: "commerce-io-orders",
        providerId: "io-orders",
      },
    });
  });

  test("adds a missing registration, updates a drifted one and removes one for a dropped action", async () => {
    const baseline = oneProvider([
      commerceEvent(),
      commerceEvent({
        name: "observer.order_cancelled",
        runtimeActions: ["pkg/b"],
      }),
    ]);
    const target = oneProvider([
      commerceEvent(),
      commerceEvent({
        name: "observer.order_cancelled",
        runtimeActions: ["pkg/c"],
      }),
    ]);
    const live = deployed(baseline, COMMERCE_PROVIDER_TYPE);
    live.registrations[0].enabled = false;

    const plan = await planCommerce({ baseline, live, target });
    const registrations = plan.operations.filter((op) => {
      const value = op.kind === "remove" ? op.before : op.after;
      return value.resourceType === "registration";
    });

    expect(registrations.map((op) => `${op.kind} ${op.reason}`)).toEqual([
      "remove change",
      "update drift",
      "add change",
    ]);
  });

  test("removes an owned provider the target no longer has, with everything on it", async () => {
    const baseline = commerceConfig([
      {
        events: [commerceEvent()],
        provider: { description: "d", key: "orders", label: "Orders" },
      },
      {
        events: [commerceEvent({ name: "observer.dropped" })],
        provider: { description: "d", key: "old", label: "Old" },
      },
    ]);
    const target = oneProvider([commerceEvent()]);

    const plan = await planCommerce({
      baseline,
      live: deployed(baseline, COMMERCE_PROVIDER_TYPE),
      target,
    });

    expect(summary(plan)).toEqual([
      "remove subscription change",
      "remove registration change",
      "remove metadata change",
      "remove commerceProvider change",
      "remove provider change",
    ]);
  });

  test("removes a leftover provider proven owned by its instance id as drift", async () => {
    const leftover = oneProvider(
      [commerceEvent({ name: "observer.leftover" })],
      {
        description: "d",
        key: "leftover",
        label: "Leftover",
      },
    );
    const config = oneProvider([commerceEvent()]);
    const live = deployed(config, COMMERCE_PROVIDER_TYPE);
    const extra = deployed(leftover, COMMERCE_PROVIDER_TYPE);
    live.providers.push(...extra.providers);
    live.registrations.push(...extra.registrations);
    live.commerceProviders.push(...extra.commerceProviders);
    live.subscriptions.push(...extra.subscriptions);

    const plan = await planCommerce({ baseline: config, live, target: config });

    expect(summary(plan)).toEqual([
      "remove subscription drift",
      "remove registration drift",
      "remove metadata drift",
      "remove commerceProvider drift",
      "remove provider drift",
    ]);
    expect(plan.operations.at(-1)).toMatchObject({
      before: { providerId: "io-leftover", providerKey: "leftover" },
    });
  });

  test("leaves providers it cannot prove the app owns", async () => {
    const config = oneProvider([commerceEvent()]);
    const live = deployed(config, COMMERCE_PROVIDER_TYPE);
    live.providers.push({
      ...live.providers[0],
      id: "io-foreign",
      instance_id: `another-app-orders-${TEST_WORKSPACE_ID}`,
    });

    const plan = await planCommerce({ baseline: config, live, target: config });

    expect(plan.operations).toEqual([]);
  });

  test("matches a provider deployed under the legacy instance id", async () => {
    const config = oneProvider([commerceEvent()]);
    const live = deployed(config, COMMERCE_PROVIDER_TYPE);
    live.providers[0].instance_id = generateInstanceIdDeprecated(
      metadata,
      config.eventing.commerce[0].provider,
    );

    const plan = await planCommerce({ baseline: config, live, target: config });

    expect(summary(plan)).toEqual(["update registration drift"]);
  });

  test("removes the subscription of an event the target scopes to another environment", async () => {
    const baseline = oneProvider([
      commerceEvent(),
      commerceEvent({ name: "observer.saas_only" }),
    ]);
    const target = oneProvider([
      commerceEvent(),
      commerceEvent({ env: ["saas"], name: "observer.saas_only" }),
    ]);

    const plan = await planCommerce({
      baseline,
      live: deployed(baseline, COMMERCE_PROVIDER_TYPE),
      target,
    });

    expect(summary(plan)).toEqual([
      "remove metadata change",
      "remove subscription change",
      "update registration change",
    ]);
  });

  test("orders removes, then updates, then adds", async () => {
    const baseline = oneProvider([
      commerceEvent(),
      commerceEvent({ name: "observer.dropped" }),
    ]);
    const target = oneProvider([
      commerceEvent({ name: "observer.added" }),
      commerceEvent(),
    ]);

    const plan = await planCommerce({
      baseline,
      live: deployed(baseline, COMMERCE_PROVIDER_TYPE),
      target,
    });

    const kinds = plan.operations.map((op) => op.kind);
    expect(kinds).toEqual([...kinds].sort((a, b) => ORDER[a] - ORDER[b]));
    expect(new Set(kinds)).toEqual(new Set(["remove", "update", "add"]));
  });

  test("skips the live read when no config declares events and nothing failed", async () => {
    const plan = await planCommerce({
      baseline: commerceConfig([]),
      live: new Error("unreachable"),
      target: commerceConfig([]),
    });

    expect(plan.operations).toEqual([]);
  });

  test("reads live state for the leftovers of a failed attempt that declared events", async () => {
    const leftover = oneProvider([commerceEvent()]);
    const plan = await planCommerce({
      baseline: commerceConfig([]),
      failedAttempt: { plan: null, targetConfig: leftover },
      live: deployed(leftover, COMMERCE_PROVIDER_TYPE),
      target: commerceConfig([]),
    });

    expect(summary(plan)).toEqual([
      "remove subscription drift",
      "remove registration drift",
      "remove metadata drift",
      "remove commerceProvider drift",
      "remove provider drift",
    ]);
  });

  test("blocks planning when the live state cannot be read", async () => {
    const result = await planCommerceEvents(
      input("commerce", {
        live: new Error("boom"),
        target: oneProvider([commerceEvent()]),
      }),
      contextFor(new Error("boom")),
    );

    expect(result).toMatchObject({
      issues: [expect.objectContaining({ code: "EVENTS_LIVE_READ_FAILED" })],
      kind: "blocked",
    });
  });
});

const ORDER = { add: 2, remove: 0, update: 1 };

describe("planExternalEvents", () => {
  const external = (events: AppEvent[]) =>
    externalConfig([
      { events, provider: { description: "d", key: "ext", label: "External" } },
    ]);

  test("plans a new provider without Commerce resources", async () => {
    const plan = await planExternal({
      live: deployed(externalConfig([]), EXTERNAL_PROVIDER_TYPE),
      target: external([event("ext.created", ["pkg/a"])]),
    });

    expect(summary(plan)).toEqual([
      "add provider change",
      "add metadata change",
      "add registration change",
    ]);
    expect(plan.configuredValues).toBeUndefined();
  });

  test("updates a registration when the target routes another event to its action", async () => {
    const baseline = external([event("ext.created", ["pkg/a"])]);
    const target = external([
      event("ext.created", ["pkg/a"]),
      event("ext.deleted", ["pkg/a"]),
    ]);

    const plan = await planExternal({
      baseline,
      live: deployed(baseline, EXTERNAL_PROVIDER_TYPE),
      target,
    });

    expect(summary(plan)).toEqual([
      "update registration change",
      "add metadata change",
    ]);
  });
});
