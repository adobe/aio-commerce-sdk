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
import { configWithCommerceEventing } from "#test/fixtures/config";

import type {
  CommerceEventsConfig,
  ExternalEventsConfig,
} from "#config/schema/eventing";
import type { PlanningInput } from "#management/common/workflow/resource";
import type { ValidationExecutionContext } from "#management/common/workflow/step";
import type { EventsStepContext } from "#management/domains/events/context";
import type {
  EventingDomainPlan,
  EventingOperationValue,
  EventingProviderSnapshot,
  EventingSnapshotData,
} from "#management/domains/events/types";

const { metadata } = configWithCommerceEventing;

const context = {
  params: { AIO_COMMERCE_API_FLAVOR: "paas" },
} as unknown as ValidationExecutionContext<EventsStepContext>;

type Source = { provider: { label: string; key?: string }; events: unknown[] };

function event(name: string, runtimeActions: string[]) {
  return { description: name, fields: [], label: name, name, runtimeActions };
}

function commerceConfig(sources: Source[]): CommerceEventsConfig {
  return {
    eventing: { commerce: sources },
    metadata,
  } as unknown as CommerceEventsConfig;
}

function externalConfig(sources: Source[]): ExternalEventsConfig {
  return {
    eventing: { external: sources },
    metadata,
  } as unknown as ExternalEventsConfig;
}

function commerceInput(
  baseline: CommerceEventsConfig | null,
  target: CommerceEventsConfig | null,
  data?: EventingSnapshotData,
): PlanningInput<CommerceEventsConfig, EventingSnapshotData, never> {
  return {
    baseline: baseline ? { config: baseline, data: data ?? null } : null,
    path: ["eventing", "commerce"],
    targetConfig: target,
    unresolvedCleanupResources: [],
  } as unknown as PlanningInput<
    CommerceEventsConfig,
    EventingSnapshotData,
    never
  >;
}

async function planCommerce(
  input: PlanningInput<CommerceEventsConfig, EventingSnapshotData, never>,
): Promise<EventingDomainPlan> {
  const result = await planCommerceEvents(input, context);
  expect(result.kind).toBe("planned");
  return (result as { kind: "planned"; plan: EventingDomainPlan }).plan;
}

/** Filters operations by kind and (optionally) resource type. */
function pick(
  plan: EventingDomainPlan,
  kind: "add" | "remove" | "update",
  resourceType?: EventingOperationValue["resourceType"],
): EventingOperationValue[] {
  return plan.operations
    .filter((operation) => operation.kind === kind)
    .map((operation) =>
      operation.kind === "remove" ? operation.before : operation.after,
    )
    .filter((value) => !resourceType || value.resourceType === resourceType);
}

describe("planCommerceEvents", () => {
  test("no changes yields an empty operation set and retains the provider", async () => {
    const config = commerceConfig([
      { events: [event("order.placed", ["pkg/a"])], provider: { label: "P1" } },
    ]);

    const plan = await planCommerce(commerceInput(config, config));

    expect(plan.operations).toHaveLength(0);
    expect(plan.removedProviders).toHaveLength(0);
    expect(plan.targetProviders.map((p) => p.key)).toEqual(["P1"]);
  });

  test("added provider emits provider + metadata + registration + subscription adds", async () => {
    const baseline = commerceConfig([
      { events: [event("a", ["pkg/a"])], provider: { label: "P1" } },
    ]);
    const target = commerceConfig([
      { events: [event("a", ["pkg/a"])], provider: { label: "P1" } },
      { events: [event("b", ["pkg/b"])], provider: { label: "P2" } },
    ]);

    const plan = await planCommerce(commerceInput(baseline, target));

    // Only the added provider P2 produces operations; P1 is unchanged.
    expect(pick(plan, "add", "provider").map((v) => v.providerKey)).toEqual([
      "P2",
    ]);
    expect(pick(plan, "add", "metadata")).toHaveLength(1);
    expect(pick(plan, "add", "registration")).toHaveLength(1);
    expect(pick(plan, "add", "subscription")).toHaveLength(1);
    expect(plan.targetProviders.map((p) => p.key)).toEqual(["P1", "P2"]);
  });

  test("removed provider emits a provider remove and records it for teardown", async () => {
    const baseline = commerceConfig([
      { events: [event("a", ["pkg/a"])], provider: { label: "P1" } },
      { events: [event("b", ["pkg/b"])], provider: { label: "P2" } },
    ]);
    const target = commerceConfig([
      { events: [event("a", ["pkg/a"])], provider: { label: "P1" } },
    ]);

    const plan = await planCommerce(commerceInput(baseline, target));

    expect(pick(plan, "remove", "provider").map((v) => v.providerKey)).toEqual([
      "P2",
    ]);
    expect(plan.removedProviders.map((p) => p.key)).toEqual(["P2"]);
    expect(plan.targetProviders.map((p) => p.key)).toEqual(["P1"]);
  });

  test("event added under a new runtime action adds metadata + registration + subscription", async () => {
    const baseline = commerceConfig([
      { events: [event("a", ["pkg/a"])], provider: { label: "P1" } },
    ]);
    const target = commerceConfig([
      {
        events: [event("a", ["pkg/a"]), event("b", ["pkg/b"])],
        provider: { label: "P1" },
      },
    ]);

    const plan = await planCommerce(commerceInput(baseline, target));

    expect(pick(plan, "add", "metadata")).toHaveLength(1);
    expect(pick(plan, "add", "registration")).toHaveLength(1);
    expect(pick(plan, "add", "subscription")).toHaveLength(1);
    expect(pick(plan, "update")).toHaveLength(0);
  });

  test("event added to an existing runtime action updates the registration", async () => {
    const baseline = commerceConfig([
      { events: [event("a", ["pkg/a"])], provider: { label: "P1" } },
    ]);
    const target = commerceConfig([
      {
        events: [event("a", ["pkg/a"]), event("b", ["pkg/a"])],
        provider: { label: "P1" },
      },
    ]);

    const plan = await planCommerce(commerceInput(baseline, target));

    // b's metadata + subscription are added; the shared registration pkg/a is updated, not re-added.
    expect(pick(plan, "add", "metadata")).toHaveLength(1);
    expect(pick(plan, "add", "subscription")).toHaveLength(1);
    expect(pick(plan, "add", "registration")).toHaveLength(0);

    const updates = pick(plan, "update", "registration");
    expect(updates).toHaveLength(1);
    expect((updates[0] as { runtimeAction: string }).runtimeAction).toBe(
      "pkg/a",
    );
  });

  test("removed event drops metadata + subscription and updates the shared registration", async () => {
    const baseline = commerceConfig([
      {
        events: [event("a", ["pkg/a"]), event("b", ["pkg/a"])],
        provider: { label: "P1" },
      },
    ]);
    const target = commerceConfig([
      { events: [event("a", ["pkg/a"])], provider: { label: "P1" } },
    ]);

    const plan = await planCommerce(commerceInput(baseline, target));

    expect(pick(plan, "remove", "metadata")).toHaveLength(1);
    expect(pick(plan, "remove", "subscription")).toHaveLength(1);
    expect(pick(plan, "update", "registration")).toHaveLength(1);
  });

  test("a provider matched by key ignores a cosmetic label change", async () => {
    const baseline = commerceConfig([
      {
        events: [event("a", ["pkg/a"])],
        provider: { key: "k1", label: "Old Label" },
      },
    ]);
    const target = commerceConfig([
      {
        events: [event("a", ["pkg/a"])],
        provider: { key: "k1", label: "New Label" },
      },
    ]);

    const plan = await planCommerce(commerceInput(baseline, target));

    expect(plan.operations).toHaveLength(0);
    expect(plan.targetProviders.map((p) => p.key)).toEqual(["k1"]);
  });

  test("uses baseline snapshot data over baseline config when present", async () => {
    // Baseline config declares nothing, but the recorded snapshot owns P1 — so dropping it from the
    // target must still be detected as a removal.
    const snapshot: EventingSnapshotData = {
      providers: [
        {
          events: [event("a", ["pkg/a"])],
          key: "P1",
          provider: { description: "P1", label: "P1" },
          type: "dx_commerce_events",
        } as EventingProviderSnapshot,
      ],
    };
    const baseline = commerceConfig([]);
    const target = commerceConfig([]);

    const plan = await planCommerce(commerceInput(baseline, target, snapshot));

    expect(plan.removedProviders.map((p) => p.key)).toEqual(["P1"]);
    expect(pick(plan, "remove", "provider")).toHaveLength(1);
  });
});

describe("planExternalEvents", () => {
  test("never emits Commerce subscription operations", async () => {
    const baseline = externalConfig([]);
    const target = externalConfig([
      { events: [event("ext", ["pkg/x"])], provider: { label: "EP" } },
    ]);

    const result = await planExternalEvents(
      {
        baseline: { config: baseline, data: null },
        path: ["eventing", "external"],
        targetConfig: target,
        unresolvedCleanupResources: [],
      } as unknown as PlanningInput<
        ExternalEventsConfig,
        EventingSnapshotData,
        never
      >,
      context,
    );

    expect(result.kind).toBe("planned");
    const { plan } = result as { kind: "planned"; plan: EventingDomainPlan };

    expect(
      plan.operations.some((operation) => {
        const value =
          operation.kind === "remove" ? operation.before : operation.after;
        return value.resourceType === "subscription";
      }),
    ).toBe(false);
    expect(pick(plan, "add", "provider").map((v) => v.providerKey)).toEqual([
      "EP",
    ]);
  });
});
