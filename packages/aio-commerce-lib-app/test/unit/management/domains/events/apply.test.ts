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

import { HTTPError } from "ky";
import { afterEach, describe, expect, test, vi } from "vitest";

import {
  applyCommerceEvents,
  commerceEventsStep,
} from "#management/domains/events/commerce";
import {
  applyExternalEvents,
  externalEventsStep,
} from "#management/domains/events/external";
import {
  planCommerceEvents,
  planExternalEvents,
} from "#management/domains/events/plan";
import {
  COMMERCE_PROVIDER_TYPE,
  EXTERNAL_PROVIDER_TYPE,
  getIoEventCode,
  getNamespacedEvent,
  getRegistrationName,
} from "#management/domains/events/utils";
import { configWithCommerceEventing } from "#test/fixtures/config";
import {
  createMockCommerceEventsConfig as commerceConfig,
  createMockDeployedIoProvider,
  createMockDeployedRegistration,
  createMockEventingInstallationContext,
  createMockAppEvent as event,
  createMockExternalEventsConfig as externalConfig,
  createMockIoEventsListClient as ioEventsClient,
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

/** Builds a ky `HTTPError` carrying the given status, for exercising HTTP failure paths. */
function httpError(status: number) {
  return new HTTPError(
    new Response(null, { status }),
    new Request("https://example.test"),
    {} as never,
  );
}

async function planCommerce(
  baseline: CommerceEventsConfig,
  target: CommerceEventsConfig,
): Promise<EventingDomainPlan> {
  const input = {
    baseline: { config: baseline, data: null },
    path: ["eventing", "commerce"],
    targetConfig: target,
  } as unknown as PlanningInput<CommerceEventsConfig, EventingSnapshotData>;

  const result = await planCommerceEvents(input, {
    params: { AIO_COMMERCE_API_FLAVOR: "saas" },
  } as never);
  return (result as { kind: "planned"; plan: EventingDomainPlan }).plan;
}

async function planExternal(
  baseline: ExternalEventsConfig,
  target: ExternalEventsConfig,
): Promise<EventingDomainPlan> {
  const input = {
    baseline: { config: baseline, data: null },
    path: ["eventing", "external"],
    targetConfig: target,
  } as unknown as PlanningInput<ExternalEventsConfig, EventingSnapshotData>;

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
      ioEventsClient: ioEventsClient({
        providers: [
          createMockDeployedIoProvider({
            id: "prov-1",
            provider: { label: "P1" },
          }),
        ],
      }) as never,
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
      ioEventsClient: ioEventsClient({
        providers: [
          createMockDeployedIoProvider({
            id: "prov-1",
            provider: { label: "P1" },
          }),
        ],
      }) as never,
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
    const providerData = createMockDeployedIoProvider({
      id: "prov-1",
      provider,
    });
    const registrationName = getRegistrationName(providerData, "pkg/a");
    const updateRegistration = vi.fn().mockResolvedValue(undefined);

    const context = createMockEventingInstallationContext({
      ioEventsClient: ioEventsClient({
        providers: [providerData],
        registrations: [
          createMockDeployedRegistration(registrationName, "reg-1"),
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
    const providerData = createMockDeployedIoProvider({
      id: "prov-1",
      provider,
    });
    const registrationName = getRegistrationName(providerData, "pkg/a");
    const updateRegistration = vi.fn().mockResolvedValue(undefined);

    const context = createMockEventingInstallationContext({
      ioEventsClient: ioEventsClient({
        providers: [providerData],
        registrations: [
          createMockDeployedRegistration(registrationName, "reg-1"),
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
    const providerData = createMockDeployedIoProvider({
      id: "prov-1",
      provider,
    });
    const droppedRegistrationName = getRegistrationName(providerData, "pkg/b");

    const context = createMockEventingInstallationContext({
      ioEventsClient: ioEventsClient({
        providers: [providerData],
        registrations: [
          createMockDeployedRegistration(droppedRegistrationName, "reg-b"),
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

  describe("failure handling", () => {
    const provider: EventProvider = {
      description: "P1",
      key: "k1",
      label: "P1",
    };

    function providerData() {
      return createMockDeployedIoProvider({ id: "prov-1", provider });
    }

    const registration = createMockDeployedRegistration;

    test("fails the apply when updating a registration's event set errors", async () => {
      vi.spyOn(commerceEventsStep, "install").mockResolvedValue([]);
      const data = providerData();

      const context = createMockEventingInstallationContext({
        ioEventsClient: ioEventsClient({
          providers: [data],
          registrations: [
            registration(getRegistrationName(data, "pkg/a"), "reg-1"),
          ],
          updateRegistration: () => Promise.reject(httpError(500)),
        }) as never,
        params: { AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id" },
      });

      // Adding "b" to the existing pkg/a registration changes its event set → PUT.
      const plan = await planCommerce(
        commerceConfig([{ events: [event("a", ["pkg/a"])], provider }]),
        commerceConfig([
          { events: [event("a", ["pkg/a"]), event("b", ["pkg/a"])], provider },
        ]),
      );

      await expect(
        applyCommerceEvents(plan, context as ApplyContext<EventsStepContext>),
      ).rejects.toThrow("Failed to update registration");
    });

    test("recreates a missing registration from the target config", async () => {
      vi.spyOn(commerceEventsStep, "install").mockResolvedValue([]);
      const data = providerData();
      const createRegistration = vi.fn().mockResolvedValue({ id: "reg-new" });

      const context = createMockEventingInstallationContext({
        ioEventsClient: ioEventsClient({
          createRegistration,
          providers: [data],
          registrations: [],
        }) as never,
        params: { AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id" },
      });

      const plan = await planCommerce(
        commerceConfig([{ events: [event("a", ["pkg/a"])], provider }]),
        commerceConfig([
          { events: [event("a", ["pkg/a"]), event("b", ["pkg/a"])], provider },
        ]),
      );

      // The registration was removed out-of-band, so it is recreated from the target config
      // (both events) instead of failing the upgrade.
      await applyCommerceEvents(
        plan,
        context as ApplyContext<EventsStepContext>,
      );

      expect(createRegistration).toHaveBeenCalledTimes(1);
      const createParams = createRegistration.mock.calls[0][0] as {
        eventsOfInterest: unknown[];
      };
      expect(createParams.eventsOfInterest).toHaveLength(2);
      expect(context.ioEventsClient.updateRegistration).not.toHaveBeenCalled();
    });

    test("fails the apply when recreating a missing registration errors", async () => {
      vi.spyOn(commerceEventsStep, "install").mockResolvedValue([]);
      const data = providerData();

      const context = createMockEventingInstallationContext({
        ioEventsClient: ioEventsClient({
          createRegistration: () => Promise.reject(httpError(500)),
          providers: [data],
          registrations: [],
        }) as never,
        params: { AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id" },
      });

      const plan = await planCommerce(
        commerceConfig([{ events: [event("a", ["pkg/a"])], provider }]),
        commerceConfig([
          { events: [event("a", ["pkg/a"]), event("b", ["pkg/a"])], provider },
        ]),
      );

      await expect(
        applyCommerceEvents(plan, context as ApplyContext<EventsStepContext>),
      ).rejects.toThrow("Failed to create registration");
    });

    test("fails the apply when deleting a dropped registration errors", async () => {
      vi.spyOn(commerceEventsStep, "install").mockResolvedValue([]);
      const data = providerData();

      const context = createMockEventingInstallationContext({
        ioEventsClient: ioEventsClient({
          deleteRegistration: () => Promise.reject(httpError(500)),
          providers: [data],
          registrations: [
            registration(getRegistrationName(data, "pkg/b"), "reg-b"),
          ],
        }) as never,
        params: { AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id" },
      });

      // Dropping the only event on pkg/b removes its whole registration.
      const plan = await planCommerce(
        commerceConfig([
          { events: [event("a", ["pkg/a"]), event("b", ["pkg/b"])], provider },
        ]),
        commerceConfig([{ events: [event("a", ["pkg/a"])], provider }]),
      );

      await expect(
        applyCommerceEvents(plan, context as ApplyContext<EventsStepContext>),
      ).rejects.toThrow("Failed to delete registration");
    });

    test("fails the apply when deleting a dropped Commerce subscription errors", async () => {
      vi.spyOn(commerceEventsStep, "install").mockResolvedValue([]);
      const data = providerData();

      const context = createMockEventingInstallationContext({
        commerceEventsClient: {
          deleteEventSubscription: () => Promise.reject(httpError(500)),
        },
        ioEventsClient: ioEventsClient({
          providers: [data],
          registrations: [
            registration(getRegistrationName(data, "pkg/a"), "reg-1"),
          ],
        }) as never,
        params: { AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id" },
      });

      // Dropping "b" from the shared pkg/a action removes its subscription (registration persists).
      const plan = await planCommerce(
        commerceConfig([
          { events: [event("a", ["pkg/a"]), event("b", ["pkg/a"])], provider },
        ]),
        commerceConfig([{ events: [event("a", ["pkg/a"])], provider }]),
      );

      await expect(
        applyCommerceEvents(plan, context as ApplyContext<EventsStepContext>),
      ).rejects.toThrow("Failed to delete Commerce event subscription");
    });

    test("tolerates a not-found when deleting a Commerce subscription", async () => {
      vi.spyOn(commerceEventsStep, "install").mockResolvedValue([]);
      const data = providerData();

      const context = createMockEventingInstallationContext({
        commerceEventsClient: {
          deleteEventSubscription: () => Promise.reject(httpError(404)),
        },
        ioEventsClient: ioEventsClient({
          providers: [data],
          registrations: [
            registration(getRegistrationName(data, "pkg/a"), "reg-1"),
          ],
        }) as never,
        params: { AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id" },
      });

      const plan = await planCommerce(
        commerceConfig([
          { events: [event("a", ["pkg/a"]), event("b", ["pkg/a"])], provider },
        ]),
        commerceConfig([{ events: [event("a", ["pkg/a"])], provider }]),
      );

      await applyCommerceEvents(
        plan,
        context as ApplyContext<EventsStepContext>,
      );

      // The subscription is already gone, but the apply proceeds to delete the metadata.
      expect(
        context.ioEventsClient.deleteEventMetadataForProvider,
      ).toHaveBeenCalledTimes(1);
    });

    test("tolerates metadata already removed by the subscription cascade", async () => {
      vi.spyOn(commerceEventsStep, "install").mockResolvedValue([]);
      const data = providerData();

      const context = createMockEventingInstallationContext({
        ioEventsClient: ioEventsClient({
          deleteEventMetadataForProvider: () => Promise.reject(httpError(404)),
          providers: [data],
          registrations: [
            registration(getRegistrationName(data, "pkg/a"), "reg-1"),
          ],
        }) as never,
        params: { AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id" },
      });

      const plan = await planCommerce(
        commerceConfig([
          { events: [event("a", ["pkg/a"]), event("b", ["pkg/a"])], provider },
        ]),
        commerceConfig([{ events: [event("a", ["pkg/a"])], provider }]),
      );

      // The subscription cascade already deleted the metadata, so the not-found does not fail.
      await applyCommerceEvents(
        plan,
        context as ApplyContext<EventsStepContext>,
      );

      expect(
        context.commerceEventsClient.deleteEventSubscription,
      ).toHaveBeenCalledTimes(1);
    });

    test("keeps applying when deleting dropped metadata errors (best-effort)", async () => {
      vi.spyOn(commerceEventsStep, "install").mockResolvedValue([]);
      const data = providerData();

      const context = createMockEventingInstallationContext({
        ioEventsClient: ioEventsClient({
          deleteEventMetadataForProvider: () => Promise.reject(httpError(500)),
          providers: [data],
          registrations: [
            registration(getRegistrationName(data, "pkg/a"), "reg-1"),
          ],
        }) as never,
        params: { AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id" },
      });

      const plan = await planCommerce(
        commerceConfig([
          { events: [event("a", ["pkg/a"]), event("b", ["pkg/a"])], provider },
        ]),
        commerceConfig([{ events: [event("a", ["pkg/a"])], provider }]),
      );

      // Metadata deletion is best-effort, so a failure does not abort the apply.
      await applyCommerceEvents(
        plan,
        context as ApplyContext<EventsStepContext>,
      );

      expect(
        context.commerceEventsClient.deleteEventSubscription,
      ).toHaveBeenCalledTimes(1);
    });

    test("deletes the Commerce subscription before the I/O Events metadata", async () => {
      vi.spyOn(commerceEventsStep, "install").mockResolvedValue([]);
      const data = providerData();

      const context = createMockEventingInstallationContext({
        ioEventsClient: ioEventsClient({
          providers: [data],
          registrations: [
            registration(getRegistrationName(data, "pkg/a"), "reg-1"),
          ],
        }) as never,
        params: { AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id" },
      });

      const plan = await planCommerce(
        commerceConfig([
          { events: [event("a", ["pkg/a"]), event("b", ["pkg/a"])], provider },
        ]),
        commerceConfig([{ events: [event("a", ["pkg/a"])], provider }]),
      );

      await applyCommerceEvents(
        plan,
        context as ApplyContext<EventsStepContext>,
      );

      const [subOrder] = (
        context.commerceEventsClient.deleteEventSubscription as ReturnType<
          typeof vi.fn
        >
      ).mock.invocationCallOrder;
      const [metadataOrder] = (
        context.ioEventsClient.deleteEventMetadataForProvider as ReturnType<
          typeof vi.fn
        >
      ).mock.invocationCallOrder;
      expect(subOrder).toBeLessThan(metadataOrder);
    });

    test("fails the apply when the deployed provider cannot be resolved", async () => {
      vi.spyOn(commerceEventsStep, "install").mockResolvedValue([]);

      // No providers in live state → the persisting provider cannot be resolved.
      const context = createMockEventingInstallationContext({
        ioEventsClient: ioEventsClient({ providers: [] }) as never,
        params: { AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id" },
      });

      const plan = await planCommerce(
        commerceConfig([
          { events: [event("a", ["pkg/a"]), event("b", ["pkg/a"])], provider },
        ]),
        commerceConfig([{ events: [event("a", ["pkg/a"])], provider }]),
      );

      await expect(
        applyCommerceEvents(plan, context as ApplyContext<EventsStepContext>),
      ).rejects.toThrow("Could not resolve deployed provider");
    });
  });

  /** Builds a context whose deployed provider resolves to `prov-1` for a persisting provider. */
  function persistingProviderContext(
    provider: EventProvider,
    overrides?: {
      commerceEventsClient?: Record<string, unknown>;
    },
  ) {
    const providerData = createMockDeployedIoProvider({
      id: "prov-1",
      provider,
    });
    const registrationName = getRegistrationName(providerData, "pkg/a");

    return createMockEventingInstallationContext({
      commerceEventsClient: overrides?.commerceEventsClient as never,
      ioEventsClient: ioEventsClient({
        providers: [providerData],
        registrations: [
          createMockDeployedRegistration(registrationName, "reg-1"),
        ],
      }) as never,
      params: { AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id" },
    });
  }

  test("updates a persisting subscription in place for an additive config change", async () => {
    vi.spyOn(commerceEventsStep, "install").mockResolvedValue([]);
    const provider: EventProvider = {
      description: "P1",
      key: "k1",
      label: "P1",
    };
    const context = persistingProviderContext(provider);

    const plan = await planCommerce(
      commerceConfig([
        {
          events: [{ ...event("a", ["pkg/a"]), fields: [{ name: "field_a" }] }],
          provider,
        },
      ]),
      commerceConfig([
        {
          events: [
            {
              ...event("a", ["pkg/a"]),
              fields: [{ name: "field_a" }, { name: "field_b" }],
            },
          ],
          provider,
        },
      ]),
    );

    await applyCommerceEvents(plan, context as ApplyContext<EventsStepContext>);

    const name = getNamespacedEvent(metadata, "a");
    expect(
      context.commerceEventsClient.updateEventSubscription,
    ).toHaveBeenCalledTimes(1);
    expect(
      context.commerceEventsClient.updateEventSubscription,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: [{ name: "field_a" }, { name: "field_b" }],
        name,
        provider_id: "prov-1",
      }),
    );
    expect(
      context.commerceEventsClient.deleteEventSubscription,
    ).not.toHaveBeenCalled();
  });

  test("updates a persisting subscription in place when a scalar is disabled (true -> false)", async () => {
    vi.spyOn(commerceEventsStep, "install").mockResolvedValue([]);
    const provider: EventProvider = {
      description: "P1",
      key: "k1",
      label: "P1",
    };
    const context = persistingProviderContext(provider);

    // Only the scalars change (fields/rules are identical), so the change is mergeable and must
    // reach Commerce as an in-place update carrying the `false` values — never a recreate.
    const plan = await planCommerce(
      commerceConfig([
        {
          events: [
            {
              ...event("a", ["pkg/a"]),
              fields: [{ name: "field_a" }],
              hipaa_audit_required: true,
              priority: true,
            },
          ],
          provider,
        },
      ]),
      commerceConfig([
        {
          events: [
            {
              ...event("a", ["pkg/a"]),
              fields: [{ name: "field_a" }],
              hipaa_audit_required: false,
              priority: false,
            },
          ],
          provider,
        },
      ]),
    );

    await applyCommerceEvents(plan, context as ApplyContext<EventsStepContext>);

    const name = getNamespacedEvent(metadata, "a");
    expect(
      context.commerceEventsClient.updateEventSubscription,
    ).toHaveBeenCalledTimes(1);
    expect(
      context.commerceEventsClient.updateEventSubscription,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        hipaa_audit_required: false,
        name,
        priority: false,
        provider_id: "prov-1",
      }),
    );
    expect(
      context.commerceEventsClient.deleteEventSubscription,
    ).not.toHaveBeenCalled();
    expect(
      context.commerceEventsClient.createEventSubscription,
    ).not.toHaveBeenCalled();
  });

  test("recreates a persisting subscription (unsubscribe then resubscribe) for an orphaning change", async () => {
    vi.spyOn(commerceEventsStep, "install").mockResolvedValue([]);
    const provider: EventProvider = {
      description: "P1",
      key: "k1",
      label: "P1",
    };
    const context = persistingProviderContext(provider);

    const plan = await planCommerce(
      commerceConfig([
        {
          events: [
            {
              ...event("a", ["pkg/a"]),
              fields: [{ name: "field_a" }, { name: "field_b" }],
            },
          ],
          provider,
        },
      ]),
      commerceConfig([
        {
          events: [{ ...event("a", ["pkg/a"]), fields: [{ name: "field_a" }] }],
          provider,
        },
      ]),
    );

    await applyCommerceEvents(plan, context as ApplyContext<EventsStepContext>);

    const name = getNamespacedEvent(metadata, "a");
    expect(
      context.commerceEventsClient.deleteEventSubscription,
    ).toHaveBeenCalledWith({ name });
    expect(
      context.commerceEventsClient.createEventSubscription,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: [{ name: "field_a" }],
        name,
        provider_id: "prov-1",
      }),
    );
    expect(
      context.commerceEventsClient.updateEventSubscription,
    ).not.toHaveBeenCalled();

    const firstCallOrder = (fn: unknown) => {
      const { mock } = fn as { mock: { invocationCallOrder: number[] } };
      return mock.invocationCallOrder[0];
    };
    expect(
      firstCallOrder(context.commerceEventsClient.deleteEventSubscription),
    ).toBeLessThan(
      firstCallOrder(context.commerceEventsClient.createEventSubscription),
    );
  });

  test("fails the apply when a subscription config update cannot be applied", async () => {
    vi.spyOn(commerceEventsStep, "install").mockResolvedValue([]);
    const provider: EventProvider = {
      description: "P1",
      key: "k1",
      label: "P1",
    };
    const context = persistingProviderContext(provider, {
      commerceEventsClient: {
        updateEventSubscription: () =>
          Promise.reject(new Error("update failed")),
      },
    });

    const plan = await planCommerce(
      commerceConfig([
        {
          events: [{ ...event("a", ["pkg/a"]), fields: [{ name: "field_a" }] }],
          provider,
        },
      ]),
      commerceConfig([
        {
          events: [
            {
              ...event("a", ["pkg/a"]),
              fields: [{ name: "field_a" }, { name: "field_b" }],
            },
          ],
          provider,
        },
      ]),
    );

    await expect(
      applyCommerceEvents(plan, context as ApplyContext<EventsStepContext>),
    ).rejects.toThrow();
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
      } as unknown as PlanningInput<ExternalEventsConfig, EventingSnapshotData>,
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
      ioEventsClient: ioEventsClient({
        providers: [
          createMockDeployedIoProvider({
            id: "prov-ext-1",
            provider: { label: "EP1" },
          }),
        ],
      }) as never,
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
    const providerData = createMockDeployedIoProvider({
      id: "prov-ext",
      provider,
      type: EXTERNAL_PROVIDER_TYPE,
    });
    const droppedRegistrationName = getRegistrationName(providerData, "pkg/b");

    const context = createMockEventingInstallationContext({
      ioEventsClient: ioEventsClient({
        providers: [providerData],
        registrations: [
          createMockDeployedRegistration(droppedRegistrationName, "reg-ext-b"),
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
    const providerData = createMockDeployedIoProvider({
      id: "prov-ext",
      provider,
      type: EXTERNAL_PROVIDER_TYPE,
    });
    const registrationName = getRegistrationName(providerData, "pkg/a");
    const updateRegistration = vi.fn().mockResolvedValue(undefined);

    const context = createMockEventingInstallationContext({
      ioEventsClient: ioEventsClient({
        providers: [providerData],
        registrations: [
          createMockDeployedRegistration(registrationName, "reg-ext-a"),
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
