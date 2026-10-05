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
  createCommerceEvents,
  createExternalEvents,
} from "#management/domains/events/provisioning";
import {
  COMMERCE_PROVIDER_TYPE,
  EXTERNAL_PROVIDER_TYPE,
  getNamespacedEvent,
  pruneStoredEventProviders,
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

// The install handlers are covered by the leaf tests; here they only need to be observable.
vi.mock("#management/domains/events/provisioning", () => ({
  createCommerceEvents: vi.fn(),
  createExternalEvents: vi.fn(),
  removeCommerceEvents: vi.fn(),
  removeExternalEvents: vi.fn(),
}));

vi.mock("#management/domains/events/utils", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("#management/domains/events/utils")
  >()),
  pruneStoredEventProviders: vi.fn(),
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

function plan(operations: Operation[]): EventingDomainPlan {
  return { operations, path: ["eventing", "commerce"] };
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

  test("runs the install for the target providers and returns them as snapshot data", async () => {
    const ctx = context();
    const result = await applyCommerceEvents(plan([]), ctx);

    expect(createCommerceEvents).toHaveBeenCalledWith(
      {
        eventing: {
          commerce: [
            { events: [orderPlaced], provider: ordersProvider.provider },
          ],
        },
        metadata,
      },
      ctx,
    );
    expect(result).toEqual({ snapshotData: { providers: [ordersProvider] } });
  });

  test("leaves out of the install the events scoped to another environment", async () => {
    const saasOnly = {
      ...ordersProvider,
      events: [{ ...orderPlaced, env: ["saas" as const] }],
    };
    const result = await applyCommerceEvents(
      plan([]),
      context({}, configWith([saasOnly])),
    );

    expect(createCommerceEvents).not.toHaveBeenCalled();
    expect(result).toEqual({ snapshotData: { providers: [] } });
  });

  test("skips the install when the target has no providers", async () => {
    await applyCommerceEvents(plan([]), context({}, null));
    expect(createCommerceEvents).not.toHaveBeenCalled();
  });

  test("removes in dependency order, before the install, and forgets removed providers' stored data", async () => {
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
    vi.mocked(createCommerceEvents).mockImplementation(
      record("install") as never,
    );

    await applyCommerceEvents(plan(removals), ctx);

    expect(calls).toEqual([
      "subscription",
      "registration",
      "metadata",
      "commerce provider",
      "provider",
      "install",
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

  test("removes a renamed registration only after the install creates its successor", async () => {
    const calls: string[] = [];
    const ctx = context({
      ioEventsClient: {
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
    vi.mocked(createCommerceEvents).mockImplementation((() => {
      calls.push("install");
      return Promise.resolve();
    }) as never);

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
      "install",
      "delete reg-renamed",
    ]);
  });

  test("updates registrations after the install creates the metadata they route", async () => {
    const calls: string[] = [];
    const record = (name: string) => () => {
      calls.push(name);
      return Promise.resolve();
    };
    const ctx = context({
      ioEventsClient: {
        updateEventMetadataForProvider: record("metadata") as never,
        updateRegistration: record("registration") as never,
      },
    });
    vi.mocked(createCommerceEvents).mockImplementation(
      record("install") as never,
    );

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
      ]),
      ctx,
    );

    expect(calls).toEqual(["metadata", "install", "registration"]);
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

  test("replaces a subscription by unsubscribing it before the install subscribes it again", async () => {
    const calls: string[] = [];
    const ctx = context({
      commerceEventsClient: {
        deleteEventSubscription: () => {
          calls.push("unsubscribe");
          return Promise.resolve();
        },
      },
    });
    vi.mocked(createCommerceEvents).mockImplementation((() => {
      calls.push("install");
      return Promise.resolve();
    }) as never);

    await applyCommerceEvents(
      plan([
        op("update", {
          changeMode: "replace",
          name: subscriptionName,
          providerId: "io-orders",
          providerKey: "orders",
          resourceType: "subscription",
        }),
      ]),
      ctx,
    );

    expect(calls).toEqual(["unsubscribe", "install"]);
    expect(
      ctx.commerceEventsClient.updateEventSubscription,
    ).not.toHaveBeenCalled();
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
      expect(createCommerceEvents).not.toHaveBeenCalled();
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

  test("runs the external install for the target providers", async () => {
    const external: EventingProviderSnapshot = {
      events: [event("ext.created", ["pkg/a"])],
      key: "ext",
      provider: { description: "d", key: "ext", label: "External" },
      type: EXTERNAL_PROVIDER_TYPE,
    };

    await applyExternalEvents(plan([]), context({}, configWith([external])));

    expect(createExternalEvents).toHaveBeenCalledWith(
      {
        eventing: {
          external: [{ events: external.events, provider: external.provider }],
        },
        metadata,
      },
      expect.anything(),
    );
    expect(createCommerceEvents).not.toHaveBeenCalled();
  });
});
