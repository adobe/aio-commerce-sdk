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

import { afterEach, describe, expect, test, vi } from "vitest";

import {
  applyCommerceEvents,
  applyExternalEvents,
} from "#management/domains/events/apply";
import { commerceEventsStep } from "#management/domains/events/commerce";
import { externalEventsStep } from "#management/domains/events/external";
import {
  planCommerceEvents,
  planExternalEvents,
} from "#management/domains/events/plan";
import {
  generateInstanceId,
  getRegistrationName,
} from "#management/domains/events/utils";
import { configWithCommerceEventing } from "#test/fixtures/config";
import {
  createMockEventingInstallationContext,
  createMockIoEventProvider,
  createMockIoEventRegistration,
} from "#test/fixtures/eventing";

import type {
  CommerceEventsConfig,
  EventProvider,
  ExternalEventsConfig,
} from "#config/schema/eventing";
import type {
  ApplyContext,
  PlanningInput,
} from "#management/common/workflow/resource";
import type { EventsStepContext } from "#management/domains/events/context";
import type {
  EventingDomainPlan,
  EventingSnapshotData,
} from "#management/domains/events/types";

const { metadata } = configWithCommerceEventing;

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

/** A mock io-events client whose list endpoints return the given (defaulted-empty) HAL payloads. */
function ioEventsClient(options?: {
  providers?: unknown[];
  registrations?: unknown[];
  updateRegistration?: ReturnType<typeof vi.fn>;
}) {
  return {
    getAllEventProviders: () =>
      Promise.resolve({ _embedded: { providers: options?.providers ?? [] } }),
    getAllRegistrations: () =>
      Promise.resolve({
        _embedded: { registrations: options?.registrations ?? [] },
      }),
    updateRegistration: options?.updateRegistration ?? vi.fn(),
  };
}

async function planCommerce(
  baseline: CommerceEventsConfig,
  target: CommerceEventsConfig,
): Promise<EventingDomainPlan> {
  const input = {
    baseline: { config: baseline, data: null },
    path: ["eventing", "commerce"],
    targetConfig: target,
    unresolvedCleanupResources: [],
  } as unknown as PlanningInput<
    CommerceEventsConfig,
    EventingSnapshotData,
    never
  >;

  const result = await planCommerceEvents(input, {
    params: { AIO_COMMERCE_API_FLAVOR: "saas" },
  } as never);
  return (result as { kind: "planned"; plan: EventingDomainPlan }).plan;
}

describe("applyCommerceEvents", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("converges the target providers through the (idempotent) install", async () => {
    const install = vi
      .spyOn(commerceEventsStep, "install")
      .mockResolvedValue([]);
    const context = createMockEventingInstallationContext({
      ioEventsClient: ioEventsClient() as never,
    });

    const plan = await planCommerce(
      commerceConfig([
        { events: [event("a", ["pkg/a"])], provider: { label: "P1" } },
      ]),
      commerceConfig([
        { events: [event("a", ["pkg/a"])], provider: { label: "P1" } },
        { events: [event("b", ["pkg/b"])], provider: { label: "P2" } },
      ]),
    );

    const result = await applyCommerceEvents(
      plan,
      context as ApplyContext<EventsStepContext>,
    );

    expect(install).toHaveBeenCalledTimes(1);
    const installedConfig = install.mock
      .calls[0][0] as unknown as CommerceEventsConfig;
    expect(
      installedConfig.eventing.commerce.map((s) => s.provider.label),
    ).toEqual(["P1", "P2"]);
    expect(result.snapshotData?.providers.map((p) => p.key)).toEqual([
      "P1",
      "P2",
    ]);
    expect(result.resolvedCleanupResources.length).toBeGreaterThan(0);
  });

  test("offboards providers dropped from the target through uninstall", async () => {
    vi.spyOn(commerceEventsStep, "install").mockResolvedValue([]);
    const uninstall = vi
      .spyOn(
        commerceEventsStep as unknown as {
          uninstall: (
            config: CommerceEventsConfig,
            context: unknown,
          ) => Promise<void>;
        },
        "uninstall",
      )
      .mockResolvedValue(undefined);
    const context = createMockEventingInstallationContext({
      ioEventsClient: ioEventsClient() as never,
    });

    const plan = await planCommerce(
      commerceConfig([
        { events: [event("a", ["pkg/a"])], provider: { label: "P1" } },
        { events: [event("b", ["pkg/b"])], provider: { label: "P2" } },
      ]),
      commerceConfig([
        { events: [event("a", ["pkg/a"])], provider: { label: "P1" } },
      ]),
    );

    await applyCommerceEvents(plan, context as ApplyContext<EventsStepContext>);

    expect(uninstall).toHaveBeenCalledTimes(1);
    const [[removedConfig]] = uninstall.mock.calls;
    expect(
      removedConfig.eventing.commerce.map((s) => s.provider.label),
    ).toEqual(["P2"]);
  });

  test("PUT-updates a registration whose event set changed on a persisting provider", async () => {
    vi.spyOn(commerceEventsStep, "install").mockResolvedValue([]);

    const provider: EventProvider = {
      description: "P1",
      key: "k1",
      label: "P1",
    };
    const instanceId = generateInstanceId(
      metadata,
      provider,
      "test-workspace-id",
    );
    const providerData = {
      ...createMockIoEventProvider({
        id: "prov-1",
        instance_id: instanceId,
        label: "P1",
        provider_metadata: "dx_commerce_events",
      }),
    };
    const registrationName = getRegistrationName(providerData, "pkg/a");
    const updateRegistration = vi.fn().mockResolvedValue(undefined);

    const context = createMockEventingInstallationContext({
      ioEventsClient: ioEventsClient({
        providers: [{ ...providerData, _embedded: { eventmetadata: [] } }],
        registrations: [
          createMockIoEventRegistration({
            client_id: "test-client-id",
            name: registrationName,
            registration_id: "reg-1",
          }),
        ],
        updateRegistration,
      }) as never,
      params: { AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id" },
    });

    // Event "b" joins the existing "pkg/a" registration → its event set changes → PUT.
    const plan = await planCommerce(
      commerceConfig([{ events: [event("a", ["pkg/a"])], provider }]),
      commerceConfig([
        { events: [event("a", ["pkg/a"]), event("b", ["pkg/a"])], provider },
      ]),
    );

    await applyCommerceEvents(plan, context as ApplyContext<EventsStepContext>);

    expect(updateRegistration).toHaveBeenCalledTimes(1);
    const putParams = updateRegistration.mock.calls[0][0] as {
      registrationId: string;
      eventsOfInterest: unknown[];
    };
    expect(putParams.registrationId).toBe("reg-1");
    expect(putParams.eventsOfInterest).toHaveLength(2);
  });
});

describe("applyExternalEvents", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("converges external providers without touching Commerce subscriptions", async () => {
    const install = vi
      .spyOn(externalEventsStep, "install")
      .mockResolvedValue([]);
    const context = createMockEventingInstallationContext({
      ioEventsClient: ioEventsClient() as never,
    });

    const baseline = {
      eventing: { external: [] },
      metadata,
    } as unknown as ExternalEventsConfig;
    const target = {
      eventing: {
        external: [
          { events: [event("ext", ["pkg/x"])], provider: { label: "EP" } },
        ],
      },
      metadata,
    } as unknown as ExternalEventsConfig;

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
      { params: { AIO_COMMERCE_API_FLAVOR: "saas" } } as never,
    );
    const { plan } = result as { kind: "planned"; plan: EventingDomainPlan };

    await applyExternalEvents(plan, context as ApplyContext<EventsStepContext>);

    expect(install).toHaveBeenCalledTimes(1);
    const installedConfig = install.mock.calls[0][0] as unknown as {
      eventing: { external: { provider: { label: string } }[] };
    };
    expect(
      installedConfig.eventing.external.map((s) => s.provider.label),
    ).toEqual(["EP"]);
  });
});
