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

import { applyCommerceEvents } from "#management/domains/events/commerce";
import { applyExternalEvents } from "#management/domains/events/external";
import {
  COMMERCE_PROVIDER_TYPE,
  EXTERNAL_PROVIDER_TYPE,
  eventCodeOf,
  getNamespacedEvent,
  pruneStoredEventProviders,
  storeEventProviders,
} from "#management/domains/events/utils";
import { configWithCommerceEventing } from "#test/fixtures/config";
import {
  createMockEventingInstallationContext,
  createMockAppEvent as event,
} from "#test/fixtures/eventing";

import type { EventProviderType } from "@adobe/aio-commerce-lib-events/io-events";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { CommerceEvent } from "#config/schema/eventing";
import type {
  ApplyContext,
  ResourceOperation,
} from "#management/common/workflow/resource";
import type { EventsStepContext } from "#management/domains/events/context";
import type {
  EventingDomainPlan,
  EventingOperationValue,
  EventingProviderSnapshot,
} from "#management/domains/events/types";

vi.mock("#management/domains/events/utils", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("#management/domains/events/utils")
  >()),
  pruneStoredEventProviders: vi.fn(),
  storeEventProviders: vi.fn(),
}));

const { metadata } = configWithCommerceEventing;
type Operation = ResourceOperation<EventingOperationValue>;

/** Builds a ky `HTTPError` carrying the given status, for exercising HTTP failure paths. */
function httpError(status: number, body: string | null = null) {
  return new HTTPError(
    new Response(body, { status }),
    new Request("https://example.test"),
    {} as never,
  );
}

const orderPlaced = {
  ...event("observer.order_placed", ["pkg/a"]),
  fields: [{ name: "sku" }],
  priority: true,
} as CommerceEvent;

const ordersProvider: EventingProviderSnapshot = {
  events: [orderPlaced],
  key: "orders",
  provider: { description: "d", key: "orders", label: "Orders" },
  type: COMMERCE_PROVIDER_TYPE,
};

const subscriptionName = getNamespacedEvent(metadata, orderPlaced.name);

function op(
  kind: Operation["kind"],
  value: EventingOperationValue,
  before: EventingOperationValue = value,
): Operation {
  const base = {
    id: `${kind}:${value.resourceType}`,
    label: kind,
    reason: "change" as const,
  };
  if (kind === "add") {
    return { ...base, after: value, kind };
  }

  return kind === "remove"
    ? { ...base, before: value, kind }
    : { ...base, after: value, before, kind };
}

function plan(
  operations: Operation[],
  extra: Partial<EventingDomainPlan> = {},
): EventingDomainPlan {
  return {
    operations,
    path: ["eventing", "commerce"],
    providerIds: { orders: "io-orders" },
    ...extra,
  };
}

/** A subscription replace, under the given live provider id when it exists. */
function replaceOp(providerId?: string): Operation {
  const subscription = {
    name: subscriptionName,
    providerId,
    providerKey: "orders",
    resourceType: "subscription" as const,
  };

  return op("update", { ...subscription, changeMode: "replace" }, subscription);
}

/** Records the order of client calls by name. */
function recorder() {
  const calls: string[] = [];
  const record =
    <TResult>(name: string, result?: TResult) =>
    () => {
      calls.push(name);
      return Promise.resolve(result);
    };

  return { calls, record };
}

/** A config declaring the given providers, of the kind their type says. */
function configWith(providers: EventingProviderSnapshot[]) {
  const sources = providers.map(({ provider, events }) => ({
    events,
    provider,
  }));
  const isCommerce = providers[0]?.type !== EXTERNAL_PROVIDER_TYPE;
  return {
    eventing: isCommerce ? { commerce: sources } : { external: sources },
    metadata,
  } as unknown as CommerceAppConfigOutputModel;
}

function context(
  overrides: Parameters<typeof createMockEventingInstallationContext>[0] = {},
  targetConfig: CommerceAppConfigOutputModel | null = configWith([
    ordersProvider,
  ]),
) {
  return {
    ...createMockEventingInstallationContext({
      appId: metadata.id,
      ...overrides,
      params: { AIO_COMMERCE_API_FLAVOR: "paas" },
    }),
    targetConfig,
  } as unknown as ApplyContext<EventsStepContext>;
}

const removals: Operation[] = [
  op("remove", {
    label: "Old",
    providerId: "io-old",
    providerKey: "old",
    resourceType: "provider",
    type: COMMERCE_PROVIDER_TYPE,
  }),
  op("remove", {
    eventCode: "code.old",
    label: "l",
    providerId: "io-old",
    providerKey: "old",
    resourceType: "metadata",
    type: COMMERCE_PROVIDER_TYPE,
  }),
  op("remove", {
    commerceProviderId: "7",
    instanceId: "i-old",
    label: "Old",
    providerId: "io-old",
    providerKey: "old",
    resourceType: "commerceProvider",
  }),
  op("remove", {
    eventCodes: [],
    name: "Reg Old",
    providerKey: "old",
    registrationId: "reg-old",
    resourceType: "registration",
    runtimeAction: "pkg/old",
    type: COMMERCE_PROVIDER_TYPE,
  }),
  op("remove", {
    name: "test_app.observer.old",
    providerKey: "old",
    resourceType: "subscription",
  }),
];

describe("applyCommerceEvents", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("returns the target providers as snapshot data and stores their event data", async () => {
    const result = await applyCommerceEvents(plan([]), context());

    expect(result).toEqual({ snapshotData: { providers: [ordersProvider] } });
    expect(storeEventProviders).toHaveBeenCalledWith({
      orders: {
        events: {
          [orderPlaced.name]: {
            code: eventCodeOf(orderPlaced, metadata, COMMERCE_PROVIDER_TYPE),
            isPhiData: false,
          },
        },
        id: "io-orders",
      },
    });
  });

  test("stores only the providers with an explicit key", async () => {
    const unkeyed = {
      ...ordersProvider,
      key: "Orders",
      provider: { description: "d", label: "Orders" },
    };
    await applyCommerceEvents(
      plan([], { providerIds: { Orders: "io-orders" } }),
      context({}, configWith([unkeyed])),
    );

    expect(storeEventProviders).toHaveBeenCalledWith({});
  });

  test("leaves out the events scoped to another environment", async () => {
    const saasOnly = {
      ...ordersProvider,
      events: [{ ...orderPlaced, env: ["saas" as const] }],
    };
    const result = await applyCommerceEvents(
      plan([]),
      context({}, configWith([saasOnly])),
    );

    expect(result).toEqual({ snapshotData: { providers: [] } });
    expect(storeEventProviders).toHaveBeenCalledWith({});
  });

  test("creates a new provider's resources in dependency order under the created provider", async () => {
    const { calls, record } = recorder();
    const ctx = context({
      commerceEventsClient: {
        createEventProvider: record("commerce provider") as never,
        createEventSubscription: record("subscription") as never,
        updateEventingConfiguration: record("eventing module", true) as never,
      },
      ioEventsClient: {
        createEventMetadataForProvider: record("metadata") as never,
        createEventProvider: record("provider", { id: "io-new" }) as never,
        createRegistration: record("registration") as never,
        updateEventMetadataForProvider: record("metadata label") as never,
      },
    });

    const eventCode = eventCodeOf(
      orderPlaced,
      metadata,
      COMMERCE_PROVIDER_TYPE,
    );
    await applyCommerceEvents(
      plan(
        [
          op("add", {
            name: subscriptionName,
            providerKey: "orders",
            resourceType: "subscription",
          }),
          op("add", {
            eventCodes: [eventCode],
            name: "Reg",
            providerKey: "orders",
            resourceType: "registration",
            runtimeAction: "pkg/a",
            type: COMMERCE_PROVIDER_TYPE,
          }),
          op("add", {
            eventCode,
            label: "A",
            providerKey: "orders",
            resourceType: "metadata",
            type: COMMERCE_PROVIDER_TYPE,
          }),
          op("add", {
            instanceId: "i-orders",
            label: "Orders",
            providerKey: "orders",
            resourceType: "commerceProvider",
          }),
          op("add", {
            instanceId: "i-orders",
            label: "Orders",
            providerKey: "orders",
            resourceType: "provider",
            type: COMMERCE_PROVIDER_TYPE,
          }),
        ],
        {
          eventingModule: {
            instanceId: "i-orders",
            isDefaultProviderConfigured: false,
            isDefaultWorkspaceConfigurationEmpty: true,
          },
          providerIds: {},
        },
      ),
      ctx,
    );

    expect(calls).toEqual([
      "provider",
      "eventing module",
      "commerce provider",
      "metadata",
      "subscription",
      "metadata label",
      "registration",
    ]);
    expect(ctx.ioEventsClient.createEventProvider).toHaveBeenCalledWith(
      expect.objectContaining({ instanceId: "i-orders", label: "Orders" }),
    );
    expect(ctx.commerceEventsClient.createEventProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        instance_id: "i-orders",
        provider_id: "io-new",
        workspace_configuration: expect.any(String),
      }),
    );
    expect(
      ctx.ioEventsClient.createEventMetadataForProvider,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ eventCode, providerId: "io-new" }),
    );
    expect(
      ctx.commerceEventsClient.createEventSubscription,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        fields: [{ name: "sku" }],
        name: subscriptionName,
        parent: orderPlaced.name,
        priority: true,
        provider_id: "io-new",
      }),
    );
    expect(ctx.ioEventsClient.createRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        eventsOfInterest: [{ eventCode, providerId: "io-new" }],
        name: "Reg",
        runtimeAction: "pkg/a",
      }),
    );
    expect(storeEventProviders).toHaveBeenCalledWith({
      orders: expect.objectContaining({ id: "io-new" }),
    });
  });

  test("configures the eventing module only when the plan found it unconfigured", async () => {
    const eventingModule = {
      instanceId: "i-orders",
      isDefaultProviderConfigured: false,
      isDefaultWorkspaceConfigurationEmpty: false,
    };
    const ctx = context({
      commerceEventsClient: {
        updateEventingConfiguration: () => Promise.resolve(true),
      },
    });

    await applyCommerceEvents(plan([], { eventingModule }), ctx);
    expect(
      ctx.commerceEventsClient.updateEventingConfiguration,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true, instance_id: "i-orders" }),
    );

    const configured = context();
    await applyCommerceEvents(
      plan([], {
        eventingModule: {
          ...eventingModule,
          isDefaultProviderConfigured: true,
        },
      }),
      configured,
    );
    expect(
      configured.commerceEventsClient.updateEventingConfiguration,
    ).not.toHaveBeenCalled();
  });

  test("fails the apply when an add has no provider to go under", async () => {
    await expect(
      applyCommerceEvents(
        plan(
          [
            op("add", {
              eventCode: "code.a",
              label: "A",
              providerKey: "orders",
              resourceType: "metadata",
              type: COMMERCE_PROVIDER_TYPE,
            }),
          ],
          { providerIds: {} },
        ),
        context(),
      ),
    ).rejects.toThrow('Event provider "orders" does not exist.');
  });

  test("removes in dependency order and forgets removed providers' stored data", async () => {
    const calls: string[] = [];
    const record = (name: string) => () => {
      calls.push(name);
      return Promise.resolve();
    };

    const ctx = context({
      commerceEventsClient: {
        deleteEventProvider: record("commerce provider"),
        deleteEventSubscription: record("subscription"),
      },
      ioEventsClient: {
        deleteEventMetadataForProvider: record("metadata"),
        deleteEventProvider: record("provider"),
        deleteRegistration: record("registration"),
      },
    });
    await applyCommerceEvents(plan(removals), ctx);

    expect(calls).toEqual([
      "subscription",
      "registration",
      "metadata",
      "commerce provider",
      "provider",
    ]);
    expect(ctx.ioEventsClient.deleteRegistration).toHaveBeenCalledWith(
      expect.objectContaining({ registrationId: "reg-old" }),
    );
    expect(ctx.commerceEventsClient.deleteEventProvider).toHaveBeenCalledWith({
      provider_id: "io-old",
    });
    expect(pruneStoredEventProviders).toHaveBeenCalledWith(["old"]);
  });

  test("updates providers, metadata and registrations with their target values", async () => {
    const ctx = context();
    await applyCommerceEvents(
      plan([
        op(
          "update",
          {
            description: "d",
            label: "Orders",
            providerKey: "orders",
            resourceType: "provider",
            type: COMMERCE_PROVIDER_TYPE,
          },
          {
            label: "Old",
            providerId: "io-orders",
            providerKey: "orders",
            resourceType: "provider",
            type: COMMERCE_PROVIDER_TYPE,
          },
        ),
        op(
          "update",
          {
            description: "d",
            label: "Orders",
            providerKey: "orders",
            resourceType: "commerceProvider",
          },
          {
            commerceProviderId: "7",
            instanceId: "i-orders",
            label: "Old",
            providerId: "io-orders",
            providerKey: "orders",
            resourceType: "commerceProvider",
          },
        ),
        op("update", {
          description: "desc",
          eventCode: "code.a",
          label: "A",
          providerId: "io-orders",
          providerKey: "orders",
          resourceType: "metadata",
          type: COMMERCE_PROVIDER_TYPE,
        }),
        op(
          "update",
          {
            description: "rd",
            eventCodes: ["code.a"],
            name: "Reg",
            providerId: "io-orders",
            providerKey: "orders",
            resourceType: "registration",
            runtimeAction: "pkg/a",
            type: COMMERCE_PROVIDER_TYPE,
          },
          {
            eventCodes: [],
            name: "Reg Old",
            providerKey: "orders",
            registrationId: "reg-1",
            resourceType: "registration",
            runtimeAction: "pkg/a",
            type: COMMERCE_PROVIDER_TYPE,
          },
        ),
      ]),
      ctx,
    );

    expect(ctx.ioEventsClient.updateEventProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "d",
        label: "Orders",
        providerId: "io-orders",
      }),
    );
    expect(ctx.commerceEventsClient.updateEventProvider).toHaveBeenCalledWith({
      description: "d",
      id: 7,
      instance_id: "i-orders",
      label: "Orders",
      provider_id: "io-orders",
    });
    expect(
      ctx.ioEventsClient.updateEventMetadataForProvider,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "desc",
        eventCode: "code.a",
        label: "A",
        providerId: "io-orders",
      }),
    );
    expect(ctx.ioEventsClient.updateRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "rd",
        enabled: true,
        eventsOfInterest: [{ eventCode: "code.a", providerId: "io-orders" }],
        name: "Reg",
        registrationId: "reg-1",
        runtimeAction: "pkg/a",
      }),
    );
  });

  test("removes a renamed registration only after its successor is created", async () => {
    const calls: string[] = [];
    const ctx = context({
      ioEventsClient: {
        createRegistration: (({ name }: { name: string }) => {
          calls.push(`create ${name}`);
          return Promise.resolve();
        }) as never,
        deleteRegistration: (({
          registrationId,
        }: {
          registrationId: string;
        }) => {
          calls.push(`delete ${registrationId}`);
          return Promise.resolve();
        }) as never,
      },
    });

    const registration = {
      eventCodes: ["code.a"],
      providerKey: "orders",
      resourceType: "registration" as const,
      runtimeAction: "pkg/a",
      type: COMMERCE_PROVIDER_TYPE as EventProviderType,
    };

    await applyCommerceEvents(
      plan([
        op("remove", {
          ...registration,
          name: "Reg Old Label",
          registrationId: "reg-renamed",
        }),
        op("remove", {
          ...registration,
          name: "Reg Dropped",
          registrationId: "reg-dropped",
          runtimeAction: "pkg/dropped",
        }),
        op("add", { ...registration, name: "Reg New Label" }),
      ]),
      ctx,
    );

    expect(calls).toEqual([
      "delete reg-dropped",
      "create Reg New Label",
      "delete reg-renamed",
    ]);
  });

  test("updates registrations after the metadata they route is created", async () => {
    const { calls, record } = recorder();
    const ctx = context({
      ioEventsClient: {
        createEventMetadataForProvider: record("create metadata") as never,
        updateEventMetadataForProvider: record("update metadata") as never,
        updateRegistration: record("registration") as never,
      },
    });

    await applyCommerceEvents(
      plan([
        op("update", {
          eventCodes: ["code.a"],
          name: "Reg",
          providerId: "io-orders",
          providerKey: "orders",
          resourceType: "registration",
          runtimeAction: "pkg/a",
          type: COMMERCE_PROVIDER_TYPE,
        }),
        op("update", {
          description: "desc",
          eventCode: "code.a",
          label: "A",
          providerId: "io-orders",
          providerKey: "orders",
          resourceType: "metadata",
          type: COMMERCE_PROVIDER_TYPE,
        }),
        op("add", {
          eventCode: "code.b",
          label: "B",
          providerKey: "orders",
          resourceType: "metadata",
          type: COMMERCE_PROVIDER_TYPE,
        }),
      ]),
      ctx,
    );

    expect(calls).toEqual([
      "update metadata",
      "create metadata",
      "registration",
    ]);
  });

  test("updates a subscription in place with the target event settings", async () => {
    const ctx = context();
    await applyCommerceEvents(
      plan([
        op("update", {
          changeMode: "in-place",
          name: subscriptionName,
          providerId: "io-orders",
          providerKey: "orders",
          resourceType: "subscription",
        }),
      ]),
      ctx,
    );

    expect(
      ctx.commerceEventsClient.updateEventSubscription,
    ).toHaveBeenCalledWith({
      fields: [{ name: "sku" }],
      hipaa_audit_required: undefined,
      name: subscriptionName,
      parent: orderPlaced.name,
      priority: true,
      provider_id: "io-orders",
      rules: undefined,
    });
  });

  test("unsubscribes a replaced subscription with the removes and subscribes it again after its metadata", async () => {
    const { calls, record } = recorder();
    const ctx = context({
      commerceEventsClient: {
        createEventSubscription: record("subscribe") as never,
        deleteEventSubscription: record("unsubscribe") as never,
      },
      ioEventsClient: {
        createEventMetadataForProvider: record("create metadata") as never,
        deleteEventMetadataForProvider: () => {
          calls.push("delete metadata");
          return Promise.reject(httpError(404));
        },
        updateEventMetadataForProvider: record("metadata label") as never,
      },
    });

    const eventMetadata = {
      eventCode: eventCodeOf(orderPlaced, metadata, COMMERCE_PROVIDER_TYPE),
      label: orderPlaced.label,
      providerId: "io-orders",
      providerKey: "orders",
      resourceType: "metadata" as const,
      type: COMMERCE_PROVIDER_TYPE as EventProviderType,
    };

    await applyCommerceEvents(
      plan([
        op("remove", eventMetadata),
        replaceOp("io-orders"),
        op("add", eventMetadata),
      ]),
      ctx,
    );

    expect(calls).toEqual([
      "unsubscribe",
      "delete metadata",
      "create metadata",
      "subscribe",
      "metadata label",
    ]);
    expect(
      ctx.commerceEventsClient.updateEventSubscription,
    ).not.toHaveBeenCalled();
  });

  test("replaces a subscription that moves to a new provider once that provider exists", async () => {
    const { calls, record } = recorder();
    const ctx = context({
      commerceEventsClient: {
        createEventSubscription: record("subscribe") as never,
        deleteEventSubscription: record("unsubscribe") as never,
      },
      ioEventsClient: {
        createEventProvider: record("provider", { id: "io-new" }) as never,
      },
    });

    await applyCommerceEvents(
      plan(
        [
          replaceOp(),
          op("add", {
            instanceId: "i-orders",
            label: "Orders",
            providerKey: "orders",
            resourceType: "provider",
            type: COMMERCE_PROVIDER_TYPE,
          }),
        ],
        { providerIds: {} },
      ),
      ctx,
    );

    expect(calls).toEqual(["unsubscribe", "provider", "subscribe"]);
    expect(
      ctx.commerceEventsClient.createEventSubscription,
    ).toHaveBeenCalledWith(expect.objectContaining({ provider_id: "io-new" }));
  });

  describe("failure handling", () => {
    test("fails the apply when a registration cannot be deleted", async () => {
      const ctx = context({
        ioEventsClient: {
          deleteRegistration: () => Promise.reject(httpError(500)),
        },
      });

      await expect(applyCommerceEvents(plan(removals), ctx)).rejects.toThrow(
        "Failed to delete registration",
      );
      expect(storeEventProviders).not.toHaveBeenCalled();
    });

    test("fails the apply when a create is rejected", async () => {
      const ctx = context({
        ioEventsClient: {
          createEventMetadataForProvider: () => Promise.reject(httpError(409)),
        },
      });

      await expect(
        applyCommerceEvents(
          plan([
            op("add", {
              eventCode: "code.a",
              label: "A",
              providerKey: "orders",
              resourceType: "metadata",
              type: COMMERCE_PROVIDER_TYPE,
            }),
          ]),
          ctx,
        ),
      ).rejects.toThrow('Failed to create event metadata "code.a"');
    });

    test("tolerates a subscription that is already gone", async () => {
      const ctx = context({
        commerceEventsClient: {
          deleteEventSubscription: () => Promise.reject(httpError(404)),
        },
      });

      await expect(
        applyCommerceEvents(plan(removals), ctx),
      ).resolves.toBeDefined();
    });

    test("tolerates the 400 Commerce answers for an unsubscribe of a missing subscription", async () => {
      const ctx = context({
        commerceEventsClient: {
          deleteEventSubscription: () =>
            Promise.reject(
              httpError(
                400,
                JSON.stringify({
                  message:
                    'The "%1" event is not registered. You cannot unsubscribe from it.',
                  parameters: ["test_app.observer.old"],
                }),
              ),
            ),
        },
      });

      await expect(
        applyCommerceEvents(plan(removals), ctx),
      ).resolves.toBeDefined();
    });

    test("fails the apply on any other 400 from an unsubscribe", async () => {
      const ctx = context({
        commerceEventsClient: {
          deleteEventSubscription: () =>
            Promise.reject(httpError(400, '{"message":"Something else"}')),
        },
      });

      await expect(applyCommerceEvents(plan(removals), ctx)).rejects.toThrow(
        "Failed to delete Commerce event subscription",
      );
    });

    test("fails the apply when a subscription cannot be deleted", async () => {
      const ctx = context({
        commerceEventsClient: {
          deleteEventSubscription: () => Promise.reject(httpError(500)),
        },
      });

      await expect(applyCommerceEvents(plan(removals), ctx)).rejects.toThrow(
        "Failed to delete Commerce event subscription",
      );
    });

    test("tolerates metadata that is already gone", async () => {
      const ctx = context({
        ioEventsClient: {
          deleteEventMetadataForProvider: () => Promise.reject(httpError(404)),
        },
      });

      await applyCommerceEvents(plan(removals), ctx);
      expect(ctx.ioEventsClient.deleteEventProvider).toHaveBeenCalled();
    });

    test("fails the apply when metadata cannot be deleted", async () => {
      const ctx = context({
        ioEventsClient: {
          deleteEventMetadataForProvider: () => Promise.reject(httpError(500)),
        },
      });

      await expect(applyCommerceEvents(plan(removals), ctx)).rejects.toThrow(
        "Failed to delete event metadata",
      );
      expect(ctx.ioEventsClient.deleteEventProvider).not.toHaveBeenCalled();
    });

    test("fails the apply when an update is rejected", async () => {
      const ctx = context({
        ioEventsClient: {
          updateEventMetadataForProvider: () => Promise.reject(httpError(400)),
        },
      });

      await expect(
        applyCommerceEvents(
          plan([
            op("update", {
              description: "d",
              eventCode: "code.a",
              label: "A",
              providerId: "io-orders",
              providerKey: "orders",
              resourceType: "metadata",
              type: COMMERCE_PROVIDER_TYPE,
            }),
          ]),
          ctx,
        ),
      ).rejects.toThrow("Failed to update event metadata");
    });
  });
});

describe("applyExternalEvents", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test("creates external resources without touching Commerce", async () => {
    const external: EventingProviderSnapshot = {
      events: [event("ext.created", ["pkg/a"])],
      key: "ext",
      provider: { description: "d", key: "ext", label: "External" },
      type: EXTERNAL_PROVIDER_TYPE,
    };
    const ctx = context(
      {
        ioEventsClient: {
          createEventMetadataForProvider: () => Promise.resolve() as never,
          createEventProvider: () => Promise.resolve({ id: "io-ext" }) as never,
        },
      },
      configWith([external]),
    );

    await applyExternalEvents(
      plan(
        [
          op("add", {
            instanceId: "i-ext",
            label: "External",
            providerKey: "ext",
            resourceType: "provider",
            type: EXTERNAL_PROVIDER_TYPE,
          }),
          op("add", {
            eventCode: "code.ext",
            label: "Ext",
            providerKey: "ext",
            resourceType: "metadata",
            type: EXTERNAL_PROVIDER_TYPE,
          }),
        ],
        { providerIds: {} },
      ),
      ctx,
    );

    expect(
      ctx.ioEventsClient.createEventMetadataForProvider,
    ).toHaveBeenCalledWith(expect.objectContaining({ providerId: "io-ext" }));
    expect(ctx.commerceEventsClient.createEventProvider).not.toHaveBeenCalled();
    expect(storeEventProviders).toHaveBeenCalledWith({
      ext: expect.objectContaining({ id: "io-ext" }),
    });
  });
});
