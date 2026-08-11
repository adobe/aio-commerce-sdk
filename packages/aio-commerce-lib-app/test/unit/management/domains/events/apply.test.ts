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
  COMMERCE_PROVIDER_TYPE,
  EXTERNAL_PROVIDER_TYPE,
  generateInstanceId,
  getIoEventCode,
  getNamespacedEvent,
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

function externalConfig(sources: Source[]): ExternalEventsConfig {
  return {
    eventing: { external: sources },
    metadata,
  } as unknown as ExternalEventsConfig;
}

async function planExternal(
  baseline: ExternalEventsConfig,
  target: ExternalEventsConfig,
): Promise<EventingDomainPlan> {
  const input = {
    baseline: { config: baseline, data: null },
    path: ["eventing", "external"],
    targetConfig: target,
    unresolvedCleanupResources: [],
  } as unknown as PlanningInput<
    ExternalEventsConfig,
    EventingSnapshotData,
    never
  >;

  const result = await planExternalEvents(input, {
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

  test("deletes metadata and subscription for an event dropped from a persisting provider", async () => {
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
    const providerData = createMockIoEventProvider({
      id: "prov-1",
      instance_id: instanceId,
      label: "P1",
      provider_metadata: "dx_commerce_events",
    });
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

    // Both a and b route to pkg/a; dropping b keeps the registration (updated), but its
    // metadata must be deleted from I/O Events and its Commerce subscription removed.
    const plan = await planCommerce(
      commerceConfig([
        { events: [event("a", ["pkg/a"]), event("b", ["pkg/a"])], provider },
      ]),
      commerceConfig([{ events: [event("a", ["pkg/a"])], provider }]),
    );

    await applyCommerceEvents(plan, context as ApplyContext<EventsStepContext>);

    const droppedCode = getIoEventCode(
      getNamespacedEvent(metadata, "b"),
      COMMERCE_PROVIDER_TYPE,
    );
    const droppedName = getNamespacedEvent(metadata, "b");

    expect(
      context.ioEventsClient.deleteEventMetadataForProvider,
    ).toHaveBeenCalledTimes(1);
    expect(
      context.ioEventsClient.deleteEventMetadataForProvider,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ eventCode: droppedCode, providerId: "prov-1" }),
    );
    expect(
      context.commerceEventsClient.deleteEventSubscription,
    ).toHaveBeenCalledTimes(1);
    expect(
      context.commerceEventsClient.deleteEventSubscription,
    ).toHaveBeenCalledWith({ name: droppedName });
    // The shared pkg/a registration persists: its event set shrank from {a,b} to {a}, so it is
    // PUT-updated to the surviving event, never deleted.
    expect(updateRegistration).toHaveBeenCalledTimes(1);
    const putParams = updateRegistration.mock.calls[0][0] as {
      eventsOfInterest: unknown[];
    };
    expect(putParams.eventsOfInterest).toHaveLength(1);
    expect(context.ioEventsClient.deleteRegistration).not.toHaveBeenCalled();
  });

  test("deletes the registration, metadata, and subscription when a runtime action is fully dropped", async () => {
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
    const providerData = createMockIoEventProvider({
      id: "prov-1",
      instance_id: instanceId,
      label: "P1",
      provider_metadata: "dx_commerce_events",
    });
    const droppedRegistrationName = getRegistrationName(providerData, "pkg/b");

    const context = createMockEventingInstallationContext({
      ioEventsClient: ioEventsClient({
        providers: [{ ...providerData, _embedded: { eventmetadata: [] } }],
        registrations: [
          createMockIoEventRegistration({
            client_id: "test-client-id",
            name: droppedRegistrationName,
            registration_id: "reg-b",
          }),
        ],
      }) as never,
      params: { AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id" },
    });

    // b is the only event on pkg/b; dropping it removes the whole registration along with
    // its metadata and Commerce subscription. The provider itself persists (a still routes to pkg/a).
    const plan = await planCommerce(
      commerceConfig([
        { events: [event("a", ["pkg/a"]), event("b", ["pkg/b"])], provider },
      ]),
      commerceConfig([{ events: [event("a", ["pkg/a"])], provider }]),
    );

    await applyCommerceEvents(plan, context as ApplyContext<EventsStepContext>);

    const droppedCode = getIoEventCode(
      getNamespacedEvent(metadata, "b"),
      COMMERCE_PROVIDER_TYPE,
    );

    expect(context.ioEventsClient.deleteRegistration).toHaveBeenCalledTimes(1);
    expect(context.ioEventsClient.deleteRegistration).toHaveBeenCalledWith(
      expect.objectContaining({ registrationId: "reg-b" }),
    );
    expect(
      context.ioEventsClient.deleteEventMetadataForProvider,
    ).toHaveBeenCalledWith(expect.objectContaining({ eventCode: droppedCode }));
    expect(
      context.commerceEventsClient.deleteEventSubscription,
    ).toHaveBeenCalledWith({ name: getNamespacedEvent(metadata, "b") });
    // The persisting pkg/a registration's event set is unchanged, so no PUT is issued.
    expect(context.ioEventsClient.updateRegistration).not.toHaveBeenCalled();
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

  test("offboards dropped external providers through uninstall", async () => {
    vi.spyOn(externalEventsStep, "install").mockResolvedValue([]);
    const uninstall = vi
      .spyOn(
        externalEventsStep as unknown as {
          uninstall: (
            config: ExternalEventsConfig,
            context: unknown,
          ) => Promise<void>;
        },
        "uninstall",
      )
      .mockResolvedValue(undefined);
    const context = createMockEventingInstallationContext({
      ioEventsClient: ioEventsClient() as never,
    });

    const plan = await planExternal(
      externalConfig([
        { events: [event("a", ["pkg/a"])], provider: { label: "EP1" } },
        { events: [event("b", ["pkg/b"])], provider: { label: "EP2" } },
      ]),
      externalConfig([
        { events: [event("a", ["pkg/a"])], provider: { label: "EP1" } },
      ]),
    );

    await applyExternalEvents(plan, context as ApplyContext<EventsStepContext>);

    expect(uninstall).toHaveBeenCalledTimes(1);
    const [[removedConfig]] = uninstall.mock.calls;
    expect(
      removedConfig.eventing.external.map((s) => s.provider.label),
    ).toEqual(["EP2"]);
  });

  test("deletes metadata and registration for a dropped external event without touching Commerce subscriptions", async () => {
    vi.spyOn(externalEventsStep, "install").mockResolvedValue([]);

    const provider: EventProvider = {
      description: "EP1",
      key: "k1",
      label: "EP1",
    };
    const instanceId = generateInstanceId(
      metadata,
      provider,
      "test-workspace-id",
    );
    const providerData = createMockIoEventProvider({
      id: "prov-ext",
      instance_id: instanceId,
      label: "EP1",
      provider_metadata: EXTERNAL_PROVIDER_TYPE,
    });
    const droppedRegistrationName = getRegistrationName(providerData, "pkg/b");

    const context = createMockEventingInstallationContext({
      ioEventsClient: ioEventsClient({
        providers: [{ ...providerData, _embedded: { eventmetadata: [] } }],
        registrations: [
          createMockIoEventRegistration({
            client_id: "test-client-id",
            name: droppedRegistrationName,
            registration_id: "reg-ext-b",
          }),
        ],
      }) as never,
      params: { AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id" },
    });

    // b is the only event on pkg/b; dropping it removes the registration and its metadata.
    const plan = await planExternal(
      externalConfig([
        { events: [event("a", ["pkg/a"]), event("b", ["pkg/b"])], provider },
      ]),
      externalConfig([{ events: [event("a", ["pkg/a"])], provider }]),
    );

    await applyExternalEvents(plan, context as ApplyContext<EventsStepContext>);

    // External event codes are not prefixed with `com.adobe.commerce.`.
    const droppedCode = getIoEventCode(
      getNamespacedEvent(metadata, "b"),
      EXTERNAL_PROVIDER_TYPE,
    );
    expect(droppedCode).not.toContain("com.adobe.commerce.");

    expect(context.ioEventsClient.deleteRegistration).toHaveBeenCalledTimes(1);
    expect(context.ioEventsClient.deleteRegistration).toHaveBeenCalledWith(
      expect.objectContaining({ registrationId: "reg-ext-b" }),
    );
    expect(
      context.ioEventsClient.deleteEventMetadataForProvider,
    ).toHaveBeenCalledWith(expect.objectContaining({ eventCode: droppedCode }));
    // External events never create Commerce subscriptions, so none are removed either.
    expect(
      context.commerceEventsClient.deleteEventSubscription,
    ).not.toHaveBeenCalled();
  });

  test("PUT-updates a persisting external registration when a shared-action event is dropped", async () => {
    vi.spyOn(externalEventsStep, "install").mockResolvedValue([]);

    const provider: EventProvider = {
      description: "EP1",
      key: "k1",
      label: "EP1",
    };
    const instanceId = generateInstanceId(
      metadata,
      provider,
      "test-workspace-id",
    );
    const providerData = createMockIoEventProvider({
      id: "prov-ext",
      instance_id: instanceId,
      label: "EP1",
      provider_metadata: EXTERNAL_PROVIDER_TYPE,
    });
    const registrationName = getRegistrationName(providerData, "pkg/a");
    const updateRegistration = vi.fn().mockResolvedValue(undefined);

    const context = createMockEventingInstallationContext({
      ioEventsClient: ioEventsClient({
        providers: [{ ...providerData, _embedded: { eventmetadata: [] } }],
        registrations: [
          createMockIoEventRegistration({
            client_id: "test-client-id",
            name: registrationName,
            registration_id: "reg-ext-a",
          }),
        ],
        updateRegistration,
      }) as never,
      params: { AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id" },
    });

    // a and b both route to pkg/a; dropping b shrinks the shared registration's event set, so it is
    // PUT-updated (not deleted), its metadata is removed, and no Commerce subscription is touched.
    const plan = await planExternal(
      externalConfig([
        { events: [event("a", ["pkg/a"]), event("b", ["pkg/a"])], provider },
      ]),
      externalConfig([{ events: [event("a", ["pkg/a"])], provider }]),
    );

    await applyExternalEvents(plan, context as ApplyContext<EventsStepContext>);

    expect(updateRegistration).toHaveBeenCalledTimes(1);
    const putParams = updateRegistration.mock.calls[0][0] as {
      registrationId: string;
      eventsOfInterest: { eventCode: string }[];
    };
    expect(putParams.registrationId).toBe("reg-ext-a");
    expect(putParams.eventsOfInterest).toHaveLength(1);
    expect(putParams.eventsOfInterest[0].eventCode).not.toContain(
      "com.adobe.commerce.",
    );
    expect(context.ioEventsClient.deleteRegistration).not.toHaveBeenCalled();
    expect(
      context.ioEventsClient.deleteEventMetadataForProvider,
    ).toHaveBeenCalledTimes(1);
    expect(
      context.commerceEventsClient.deleteEventSubscription,
    ).not.toHaveBeenCalled();
  });
});
