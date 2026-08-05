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

import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, test, vi } from "vitest";

import type { ImsAuthParams } from "@adobe/aio-commerce-lib-auth";

vi.mock("@adobe/aio-commerce-lib-auth", async () => {
  const original = await vi.importActual("@adobe/aio-commerce-lib-auth");
  return {
    ...original,
    getImsAuthProvider: vi.fn((params: ImsAuthParams) => ({
      getHeaders: vi.fn(() => ({
        Authorization: "Bearer mock-token",
        "x-api-key": params.clientId,
      })),
    })),
  };
});

import { createCustomScriptSteps } from "#management/installation/custom-installation/custom-scripts";
import {
  COMMERCE_PROVIDER_TYPE,
  getIoEventCode,
  getNamespacedEvent,
} from "#management/installation/events/utils";
import {
  createInitialInstallationState,
  runUpdate,
} from "#management/installation/runner";
import { isSucceededState } from "#management/installation/workflow/types";
import { diffConfig } from "#management/upgrade/diff";
import { mockMetadata } from "#test/fixtures/config";
import {
  createMockIoEventMetadata,
  createMockIoEventMetadataHalModel,
  createMockIoEventProvider,
  createMockIoEventProviderHalModel,
  createMockIoEventRegistration,
  createMockIoEventRegistrationHalModel,
} from "#test/fixtures/eventing";
import {
  createMockInstallationContext,
  createMockInstallationContextWithScripts,
} from "#test/fixtures/installation";
import { createMockExistingCommerceWebhook } from "#test/fixtures/webhooks";
import { apiServer, setupApiTestLifecycle } from "#test/setup/api";

import type {
  IoEventProvider,
  IoEventRegistration,
} from "@adobe/aio-commerce-lib-events/io-events";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { InstallationContext } from "#management/installation/workflow/step";
import type { UpdatePlan } from "#management/upgrade/types";

const IO_EVENTS_BASE_URL = "https://api.adobe.io/events";
const COMMERCE_BASE_URL = "https://api.commerce.adobe.com/V1";

setupApiTestLifecycle();
afterEach(() => {
  vi.unstubAllEnvs();
});

/** Builds a minimal `UpdatePlan` around a computed diff and target config. */
function createUpdatePlan(
  oldConfig: CommerceAppConfigOutputModel,
  newConfig: CommerceAppConfigOutputModel,
): UpdatePlan {
  return {
    createdAt: "2026-08-05T00:00:00.000Z",
    deploymentVersion: "1",
    diff: diffConfig(oldConfig, newConfig),
    planId: "plan-1",
    targetConfig: newConfig,
  };
}

/** Runs `runUpdate` against the target config with the given installation context. */
async function runUpdateFor(
  oldConfig: CommerceAppConfigOutputModel,
  newConfig: CommerceAppConfigOutputModel,
  installationContext: InstallationContext = createMockInstallationContext(),
) {
  const plan = createUpdatePlan(oldConfig, newConfig);
  const initialState = createInitialInstallationState({ config: newConfig });

  return runUpdate({
    config: newConfig,
    initialState,
    installationContext,
    plan,
  });
}

describe("I/O Events registration reconcile", () => {
  test("added registration fires create, changed registration fires the full-replace PUT", async () => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");

    const installationContext = createMockInstallationContext();
    const {
      consumerOrgId: orgId,
      projectId,
      workspaceId,
    } = installationContext.appData;

    const providerConfig = {
      description: "Provides commerce events",
      key: "orders",
      label: "Order Events Provider",
    };

    const baseEvent = {
      description: "Triggered when an order is placed",
      fields: [{ name: "order_id" }],
      label: "Order Placed",
      name: "plugin.order_placed",
    };

    const shippedEvent = {
      description: "Triggered when an order ships",
      fields: [{ name: "order_id" }],
      label: "Order Shipped",
      name: "plugin.order_shipped",
    };

    const metadata = { ...mockMetadata, id: "test-app-reconcile-registration" };

    const oldConfig = {
      eventing: {
        commerce: [
          {
            events: [
              { ...baseEvent, runtimeActions: ["my-package/handle-order"] },
              { ...shippedEvent, runtimeActions: ["my-package/handle-order"] },
            ],
            provider: providerConfig,
          },
        ],
      },
      metadata,
    } satisfies CommerceAppConfigOutputModel;

    const newConfig = {
      eventing: {
        commerce: [
          {
            events: [
              // Rerouted to a brand new runtime action — its own registration is "added".
              { ...baseEvent, runtimeActions: ["my-package/handle-order-v2"] },
              // Stays on the original action — its registration's event set shrinks (`changed`).
              { ...shippedEvent, runtimeActions: ["my-package/handle-order"] },
            ],
            provider: providerConfig,
          },
        ],
      },
      metadata,
    } satisfies CommerceAppConfigOutputModel;

    const deployedProvider: IoEventProvider = createMockIoEventProvider({
      description: providerConfig.description,
      id: "io-provider-orders",
      instance_id: `${metadata.id}-orders-${workspaceId}`.toLowerCase(),
      label: providerConfig.label,
      provider_metadata: "dx_commerce_events",
    });

    const existingRegistration: IoEventRegistration =
      createMockIoEventRegistration({
        client_id: installationContext.params.AIO_COMMERCE_AUTH_IMS_CLIENT_ID,
        id: "registration-existing",
        name: "Commerce Event Registration: Order Events Provider - Handle Order (My Package)",
        registration_id: "registration-id-existing",
      });

    const capture = {
      createRegistrationBody: null as Record<string, unknown> | null,
      updateRegistrationBody: null as Record<string, unknown> | null,
    };

    apiServer.use(
      http.get(`${IO_EVENTS_BASE_URL}/${orgId}/providers`, () =>
        HttpResponse.json({
          _embedded: {
            providers: [createMockIoEventProviderHalModel(deployedProvider)],
          },
          _links: { self: { href: "/providers" } },
        }),
      ),

      http.get(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/registrations`,
        () =>
          HttpResponse.json({
            _embedded: {
              registrations: [
                createMockIoEventRegistrationHalModel(existingRegistration),
              ],
            },
            _links: { self: { href: "/registrations" } },
          }),
      ),

      http.post(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/registrations`,
        async ({ request }) => {
          capture.createRegistrationBody = (await request.json()) as Record<
            string,
            unknown
          >;

          return HttpResponse.json(
            createMockIoEventRegistrationHalModel(
              createMockIoEventRegistration({
                id: "registration-new",
                name: "Commerce Event Registration: Order Events Provider - Handle Order V2 (My Package)",
                registration_id: "registration-id-new",
              }),
            ),
          );
        },
      ),

      http.put(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/registrations/${existingRegistration.registration_id}`,
        async ({ request }) => {
          capture.updateRegistrationBody = (await request.json()) as Record<
            string,
            unknown
          >;

          return HttpResponse.json(
            createMockIoEventRegistrationHalModel(existingRegistration),
          );
        },
      ),
    );

    const result = await runUpdateFor(
      oldConfig,
      newConfig,
      installationContext,
    );

    expect.assert(isSucceededState(result), "Expected the update to succeed");

    // "added" registration: full create body for the new runtime action.
    expect(capture.createRegistrationBody).toMatchObject({
      name: "Commerce Event Registration: Order Events Provider - Handle Order V2 (My Package)",
      runtime_action: "my-package/handle-order-v2",
    });

    // "changed" registration: full-replace PUT, rebuilt from the target config —
    // only the shipped event now routes to "handle-order".
    const sanitizedId = metadata.id.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    expect(capture.updateRegistrationBody).toMatchObject({
      events_of_interest: [
        expect.objectContaining({
          event_code: `com.adobe.commerce.${sanitizedId}.plugin.order_shipped`,
        }),
      ],
      name: "Commerce Event Registration: Order Events Provider - Handle Order (My Package)",
      runtime_action: "my-package/handle-order",
    });
  });
});

describe("I/O Events provider reconcile — added & removed", () => {
  test("a brand new provider is created and a fully-removed provider is deleted", async () => {
    const installationContext = createMockInstallationContext();
    const {
      consumerOrgId: orgId,
      projectId,
      workspaceId,
    } = installationContext.appData;

    const metadata = {
      ...mockMetadata,
      id: "test-app-reconcile-provider-lifecycle",
    };

    const removedProviderConfig = {
      description: "Provides events for vendor A",
      key: "vendor-a",
      label: "Vendor A Provider",
    };
    const removedEvent = {
      description: "An event from vendor A",
      label: "Vendor A Event",
      name: "vendor_a_event",
      runtimeActions: ["my-package/handle-vendor-a"],
    };

    const addedProviderConfig = {
      description: "Provides events for vendor B",
      key: "vendor-b",
      label: "Vendor B Provider",
    };
    const addedEvent = {
      description: "An event from vendor B",
      label: "Vendor B Event",
      name: "vendor_b_event",
      runtimeActions: ["my-package/handle-vendor-b"],
    };

    const oldConfig = {
      eventing: {
        external: [{ events: [removedEvent], provider: removedProviderConfig }],
      },
      metadata,
    } satisfies CommerceAppConfigOutputModel;

    const newConfig = {
      eventing: {
        external: [{ events: [addedEvent], provider: addedProviderConfig }],
      },
      metadata,
    } satisfies CommerceAppConfigOutputModel;

    const deployedRemovedProvider = createMockIoEventProvider({
      description: removedProviderConfig.description,
      id: "io-provider-vendor-a",
      instance_id: `${metadata.id}-vendor-a-${workspaceId}`.toLowerCase(),
      label: removedProviderConfig.label,
      provider_metadata: "3rd_party_custom_events",
    });

    const removedRegistration = createMockIoEventRegistration({
      client_id: installationContext.params.AIO_COMMERCE_AUTH_IMS_CLIENT_ID,
      id: "registration-vendor-a",
      name: "External Event Registration: Vendor A Provider - Handle Vendor A (My Package)",
      registration_id: "registration-id-vendor-a",
    });

    const capture = {
      createProviderBody: null as Record<string, unknown> | null,
      deletedMetadataEventCode: null as string | null,
      deletedProviderId: null as string | null,
      deletedRegistrationId: null as string | null,
    };

    apiServer.use(
      http.get(`${IO_EVENTS_BASE_URL}/${orgId}/providers`, () =>
        HttpResponse.json({
          _embedded: {
            providers: [
              {
                ...createMockIoEventProviderHalModel(deployedRemovedProvider),
                _embedded: {
                  eventmetadata: [
                    createMockIoEventMetadataHalModel(
                      createMockIoEventMetadata({
                        event_code: getIoEventCode(
                          getNamespacedEvent(metadata, removedEvent.name),
                          "3rd_party_custom_events",
                        ),
                      }),
                    ),
                  ],
                },
              },
            ],
          },
          _links: { self: { href: "/providers" } },
        }),
      ),

      http.get(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/registrations`,
        () =>
          HttpResponse.json({
            _embedded: {
              registrations: [
                createMockIoEventRegistrationHalModel(removedRegistration),
              ],
            },
            _links: { self: { href: "/registrations" } },
          }),
      ),

      http.post(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/providers`,
        async ({ request }) => {
          capture.createProviderBody = (await request.json()) as Record<
            string,
            unknown
          >;

          return HttpResponse.json(
            createMockIoEventProviderHalModel(
              createMockIoEventProvider({
                id: "io-provider-vendor-b",
                instance_id:
                  `${metadata.id}-vendor-b-${workspaceId}`.toLowerCase(),
                label: addedProviderConfig.label,
                provider_metadata: "3rd_party_custom_events",
              }),
            ),
          );
        },
      ),

      http.post(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/providers/:providerId/eventmetadata`,
        async ({ request }) => {
          const body = (await request.json()) as { event_code: string };
          return HttpResponse.json(
            createMockIoEventMetadataHalModel(
              createMockIoEventMetadata({ event_code: body.event_code }),
            ),
          );
        },
      ),

      http.post(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/registrations`,
        async ({ request }) => {
          const body = (await request.json()) as { name: string };
          return HttpResponse.json(
            createMockIoEventRegistrationHalModel(
              createMockIoEventRegistration({ name: body.name }),
            ),
          );
        },
      ),

      http.delete(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/registrations/${removedRegistration.registration_id}`,
        () => {
          capture.deletedRegistrationId = removedRegistration.registration_id;
          return new HttpResponse(null, { status: 204 });
        },
      ),

      http.delete(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/providers/${deployedRemovedProvider.id}/eventmetadata/:eventCode`,
        ({ params }) => {
          capture.deletedMetadataEventCode = params.eventCode as string;
          return new HttpResponse(null, { status: 204 });
        },
      ),

      http.delete(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/providers/${deployedRemovedProvider.id}`,
        () => {
          capture.deletedProviderId = deployedRemovedProvider.id;
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );

    const result = await runUpdateFor(
      oldConfig,
      newConfig,
      installationContext,
    );

    expect.assert(isSucceededState(result), "Expected the update to succeed");
    expect(capture.createProviderBody).toMatchObject({
      label: addedProviderConfig.label,
      provider_metadata: "3rd_party_custom_events",
    });
    expect(capture.deletedProviderId).toBe(deployedRemovedProvider.id);
    expect(capture.deletedRegistrationId).toBe(
      removedRegistration.registration_id,
    );
    expect(capture.deletedMetadataEventCode).toBe(
      getIoEventCode(
        getNamespacedEvent(metadata, removedEvent.name),
        "3rd_party_custom_events",
      ),
    );
  });
});

describe("I/O Events provider & metadata reconcile — unsupported changes", () => {
  function mockEmptyIoEventsExistingData(
    installationContext: ReturnType<typeof createMockInstallationContext>,
  ) {
    const {
      consumerOrgId: orgId,
      projectId,
      workspaceId,
    } = installationContext.appData;

    apiServer.use(
      http.get(`${IO_EVENTS_BASE_URL}/${orgId}/providers`, () =>
        HttpResponse.json({
          _embedded: { providers: [] },
          _links: { self: { href: "/providers" } },
        }),
      ),
      http.get(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/registrations`,
        () =>
          HttpResponse.json({
            _embedded: { registrations: [] },
            _links: { self: { href: "/registrations" } },
          }),
      ),
    );
  }

  test("changed provider surfaces UnsupportedReconcileChangeError", async () => {
    const installationContext = createMockInstallationContext();
    mockEmptyIoEventsExistingData(installationContext);

    const metadata = { ...mockMetadata, id: "test-app-reconcile-provider" };
    const event = {
      description: "An external event",
      label: "External Event",
      name: "external_event",
      runtimeActions: ["my-package/handle-external"],
    };

    const oldConfig = {
      eventing: {
        external: [
          {
            events: [event],
            provider: {
              description: "Original description",
              label: "Vendor Provider",
            },
          },
        ],
      },
      metadata,
    } satisfies CommerceAppConfigOutputModel;

    const newConfig = {
      eventing: {
        external: [
          {
            events: [event],
            provider: {
              description: "Updated description",
              label: "Vendor Provider",
            },
          },
        ],
      },
      metadata,
    } satisfies CommerceAppConfigOutputModel;

    const result = await runUpdateFor(
      oldConfig,
      newConfig,
      installationContext,
    );

    expect.assert(!isSucceededState(result), "Expected the update to fail");
    expect(result.error.message).toContain(
      'Cannot reconcile a "changed" ioEventsProvider resource',
    );
  });

  test("changed metadata surfaces UnsupportedReconcileChangeError", async () => {
    const installationContext = createMockInstallationContext();
    mockEmptyIoEventsExistingData(installationContext);

    const metadata = { ...mockMetadata, id: "test-app-reconcile-metadata" };
    const provider = {
      description: "Provides external events",
      label: "Vendor Provider",
    };

    const oldConfig = {
      eventing: {
        external: [
          {
            events: [
              {
                description: "An external event",
                label: "External Event",
                name: "external_event",
                runtimeActions: ["my-package/handle-external"],
              },
            ],
            provider,
          },
        ],
      },
      metadata,
    } satisfies CommerceAppConfigOutputModel;

    const newConfig = {
      eventing: {
        external: [
          {
            events: [
              {
                description: "An external event",
                label: "External Event V2",
                name: "external_event",
                runtimeActions: ["my-package/handle-external"],
              },
            ],
            provider,
          },
        ],
      },
      metadata,
    } satisfies CommerceAppConfigOutputModel;

    const result = await runUpdateFor(
      oldConfig,
      newConfig,
      installationContext,
    );

    expect.assert(!isSucceededState(result), "Expected the update to fail");
    expect(result.error.message).toContain(
      'Cannot reconcile a "changed" ioEventsMetadata resource',
    );
  });
});

describe("I/O Events registration/metadata + Commerce subscription reconcile — removed", () => {
  test("removing an event entirely deletes its registration, metadata, and Commerce subscription", async () => {
    const installationContext = createMockInstallationContext();
    const {
      consumerOrgId: orgId,
      projectId,
      workspaceId,
    } = installationContext.appData;

    const metadata = { ...mockMetadata, id: "test-app-reconcile-removed" };
    const providerConfig = {
      description: "Provides commerce events",
      key: "orders",
      label: "Order Events Provider",
    };

    const keptEvent = {
      description: "Triggered when an order is placed",
      fields: [{ name: "order_id" }],
      label: "Order Placed",
      name: "plugin.order_placed",
      runtimeActions: ["my-package/handle-order"],
    };

    const removedEvent = {
      description: "Triggered when an order ships",
      fields: [{ name: "order_id" }],
      label: "Order Shipped",
      name: "plugin.order_shipped",
      runtimeActions: ["my-package/handle-shipped"],
    };

    const oldConfig = {
      eventing: {
        commerce: [
          { events: [keptEvent, removedEvent], provider: providerConfig },
        ],
      },
      metadata,
    } satisfies CommerceAppConfigOutputModel;

    const newConfig = {
      eventing: {
        commerce: [{ events: [keptEvent], provider: providerConfig }],
      },
      metadata,
    } satisfies CommerceAppConfigOutputModel;

    const removedEventCode = getIoEventCode(
      getNamespacedEvent(metadata, removedEvent.name),
      COMMERCE_PROVIDER_TYPE,
    );
    const removedNamespacedName = getNamespacedEvent(
      metadata,
      removedEvent.name,
    );

    const deployedProvider = createMockIoEventProvider({
      description: providerConfig.description,
      id: "io-provider-orders",
      instance_id: `${metadata.id}-orders-${workspaceId}`.toLowerCase(),
      label: providerConfig.label,
      provider_metadata: "dx_commerce_events",
    });

    const keptRegistration = createMockIoEventRegistration({
      client_id: installationContext.params.AIO_COMMERCE_AUTH_IMS_CLIENT_ID,
      id: "registration-kept",
      name: "Commerce Event Registration: Order Events Provider - Handle Order (My Package)",
      registration_id: "registration-id-kept",
    });

    const removedRegistration = createMockIoEventRegistration({
      client_id: installationContext.params.AIO_COMMERCE_AUTH_IMS_CLIENT_ID,
      id: "registration-removed",
      name: "Commerce Event Registration: Order Events Provider - Handle Shipped (My Package)",
      registration_id: "registration-id-removed",
    });

    const capture = {
      deleteMetadataEventCode: null as string | null,
      deleteRegistrationId: null as string | null,
      unsubscribedName: null as string | null,
    };

    apiServer.use(
      http.get(`${IO_EVENTS_BASE_URL}/${orgId}/providers`, () =>
        HttpResponse.json({
          _embedded: {
            providers: [
              {
                ...createMockIoEventProviderHalModel(deployedProvider),
                _embedded: {
                  eventmetadata: [
                    createMockIoEventMetadataHalModel(
                      createMockIoEventMetadata({
                        event_code: getIoEventCode(
                          getNamespacedEvent(metadata, keptEvent.name),
                          COMMERCE_PROVIDER_TYPE,
                        ),
                      }),
                    ),
                    createMockIoEventMetadataHalModel(
                      createMockIoEventMetadata({
                        event_code: removedEventCode,
                      }),
                    ),
                  ],
                },
              },
            ],
          },
          _links: { self: { href: "/providers" } },
        }),
      ),

      http.get(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/registrations`,
        () =>
          HttpResponse.json({
            _embedded: {
              registrations: [
                createMockIoEventRegistrationHalModel(keptRegistration),
                createMockIoEventRegistrationHalModel(removedRegistration),
              ],
            },
            _links: { self: { href: "/registrations" } },
          }),
      ),

      http.delete(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/registrations/${removedRegistration.registration_id}`,
        () => {
          capture.deleteRegistrationId = removedRegistration.registration_id;
          return new HttpResponse(null, { status: 204 });
        },
      ),

      http.delete(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/providers/${deployedProvider.id}/eventmetadata/:eventCode`,
        ({ params }) => {
          capture.deleteMetadataEventCode = params.eventCode as string;
          return new HttpResponse(null, { status: 204 });
        },
      ),

      http.get(`${COMMERCE_BASE_URL}/eventing/eventProvider`, () =>
        HttpResponse.json([{ workspace_configuration: '{"project":{}}' }]),
      ),

      http.get(`${COMMERCE_BASE_URL}/eventing/getEventSubscriptions`, () =>
        HttpResponse.json([]),
      ),

      http.post(
        `${COMMERCE_BASE_URL}/eventing/eventUnsubscribe/${removedNamespacedName}`,
        () => {
          capture.unsubscribedName = removedNamespacedName;
          return HttpResponse.json([]);
        },
      ),
    );

    const result = await runUpdateFor(
      oldConfig,
      newConfig,
      installationContext,
    );

    expect.assert(isSucceededState(result), "Expected the update to succeed");
    expect(capture.deleteRegistrationId).toBe(
      removedRegistration.registration_id,
    );
    expect(capture.deleteMetadataEventCode).toBe(removedEventCode);
    expect(capture.unsubscribedName).toBe(removedNamespacedName);
  });
});

describe("Commerce subscription reconcile", () => {
  test("added event onboards I/O Events and creates the Commerce subscription", async () => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");

    const installationContext = createMockInstallationContext();
    const {
      consumerOrgId: orgId,
      projectId,
      workspaceId,
    } = installationContext.appData;

    const metadata = { ...mockMetadata, id: "test-app-reconcile-subscription" };
    const providerConfig = {
      description: "Provides commerce events",
      key: "orders",
      label: "Order Events Provider",
    };

    const keptEvent = {
      description: "Triggered when an order is placed",
      fields: [{ name: "order_id" }],
      label: "Order Placed",
      name: "plugin.order_placed",
      runtimeActions: ["my-package/handle-order"],
    };

    const addedEvent = {
      description: "Triggered when an order ships",
      fields: [{ name: "order_id" }],
      label: "Order Shipped",
      name: "plugin.order_shipped",
      runtimeActions: ["my-package/handle-shipped"],
    };

    const oldConfig = {
      eventing: {
        commerce: [{ events: [keptEvent], provider: providerConfig }],
      },
      metadata,
    } satisfies CommerceAppConfigOutputModel;

    const newConfig = {
      eventing: {
        commerce: [
          { events: [keptEvent, addedEvent], provider: providerConfig },
        ],
      },
      metadata,
    } satisfies CommerceAppConfigOutputModel;

    const deployedProvider = createMockIoEventProvider({
      description: providerConfig.description,
      id: "io-provider-orders",
      instance_id: `${metadata.id}-orders-${workspaceId}`.toLowerCase(),
      label: providerConfig.label,
      provider_metadata: "dx_commerce_events",
    });

    // Mutable "deployed state" so a resource created earlier in this reconcile pass
    // (e.g. by the metadata/registration domain) is visible to a later GET in the
    // same pass (e.g. the commerceSubscription domain's own onboarding call) —
    // mirrors how a real backend would behave, and confirms create-or-get is
    // genuinely idempotent across the two reconcile calls in `reconcileCommerceEvents`.
    const deployedMetadata = [
      createMockIoEventMetadata({
        event_code: getIoEventCode(
          getNamespacedEvent(metadata, keptEvent.name),
          COMMERCE_PROVIDER_TYPE,
        ),
      }),
    ];
    const deployedRegistrations = [
      createMockIoEventRegistration({
        client_id: installationContext.params.AIO_COMMERCE_AUTH_IMS_CLIENT_ID,
        id: "registration-kept",
        name: "Commerce Event Registration: Order Events Provider - Handle Order (My Package)",
        registration_id: "registration-id-kept",
      }),
    ];

    const capture = {
      subscribeBody: null as Record<string, unknown> | null,
    };

    apiServer.use(
      http.get(`${IO_EVENTS_BASE_URL}/${orgId}/providers`, () =>
        HttpResponse.json({
          _embedded: {
            providers: [
              {
                ...createMockIoEventProviderHalModel(deployedProvider),
                _embedded: {
                  eventmetadata: deployedMetadata.map((meta) =>
                    createMockIoEventMetadataHalModel(meta),
                  ),
                },
              },
            ],
          },
          _links: { self: { href: "/providers" } },
        }),
      ),

      http.get(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/registrations`,
        () =>
          HttpResponse.json({
            _embedded: {
              registrations: deployedRegistrations.map((reg) =>
                createMockIoEventRegistrationHalModel(reg),
              ),
            },
            _links: { self: { href: "/registrations" } },
          }),
      ),

      http.post(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/providers/:providerId/eventmetadata`,
        async ({ request }) => {
          const body = (await request.json()) as {
            event_code: string;
            label: string;
          };
          const created = createMockIoEventMetadata({
            event_code: body.event_code,
            label: body.label,
          });

          deployedMetadata.push(created);
          return HttpResponse.json(createMockIoEventMetadataHalModel(created));
        },
      ),

      http.post(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/registrations`,
        async ({ request }) => {
          const body = (await request.json()) as { name: string };
          const created = createMockIoEventRegistration({
            client_id:
              installationContext.params.AIO_COMMERCE_AUTH_IMS_CLIENT_ID,
            id: "registration-shipped",
            name: body.name,
            registration_id: "registration-id-shipped",
          });

          deployedRegistrations.push(created);
          return HttpResponse.json(
            createMockIoEventRegistrationHalModel(created),
          );
        },
      ),

      http.get(`${COMMERCE_BASE_URL}/eventing/eventProvider`, () =>
        HttpResponse.json([{ workspace_configuration: '{"project":{}}' }]),
      ),
      http.get(`${COMMERCE_BASE_URL}/eventing/getEventSubscriptions`, () =>
        HttpResponse.json([]),
      ),
      http.put(`${COMMERCE_BASE_URL}/eventing/updateConfiguration`, () =>
        HttpResponse.json(true),
      ),
      http.post(
        `${COMMERCE_BASE_URL}/eventing/eventProvider`,
        async ({ request }) => {
          const { eventProvider } = (await request.json()) as {
            eventProvider: {
              id: string;
              label: string;
              description?: string;
              instance_id?: string;
            };
          };

          return HttpResponse.json({
            description: eventProvider.description,
            id: "commerce-provider-1",
            instance_id: eventProvider.instance_id,
            label: eventProvider.label,
            provider_id: eventProvider.id,
            workspace_configuration: '{"project":{}}',
          });
        },
      ),
      http.post(
        `${COMMERCE_BASE_URL}/eventing/eventSubscribe`,
        async ({ request }) => {
          capture.subscribeBody = (await request.json()) as Record<
            string,
            unknown
          >;
          return HttpResponse.json([]);
        },
      ),
    );

    const result = await runUpdateFor(
      oldConfig,
      newConfig,
      installationContext,
    );

    expect.assert(isSucceededState(result), "Expected the update to succeed");
    expect(capture.subscribeBody).toEqual(
      expect.objectContaining({
        event: expect.objectContaining({
          name: getNamespacedEvent(metadata, addedEvent.name),
          parent: addedEvent.name,
        }),
      }),
    );
  });

  test("changed subscription surfaces UnsupportedReconcileChangeError", async () => {
    const installationContext = createMockInstallationContext();
    const {
      consumerOrgId: orgId,
      projectId,
      workspaceId,
    } = installationContext.appData;

    const metadata = { ...mockMetadata, id: "test-app-reconcile-sub-changed" };
    const providerConfig = {
      description: "Provides commerce events",
      key: "orders",
      label: "Order Events Provider",
    };

    const baseEvent = {
      description: "Triggered when an order is placed",
      fields: [{ name: "order_id" }],
      label: "Order Placed",
      name: "plugin.order_placed",
      runtimeActions: ["my-package/handle-order"],
    };

    const oldConfig = {
      eventing: {
        commerce: [
          {
            events: [
              {
                ...baseEvent,
                rules: [
                  {
                    field: "order_total",
                    operator: "greaterThan" as const,
                    value: "100",
                  },
                ],
              },
            ],
            provider: providerConfig,
          },
        ],
      },
      metadata,
    } satisfies CommerceAppConfigOutputModel;

    const newConfig = {
      eventing: {
        commerce: [
          {
            events: [
              {
                ...baseEvent,
                rules: [
                  {
                    field: "order_total",
                    operator: "greaterThan" as const,
                    value: "200",
                  },
                ],
              },
            ],
            provider: providerConfig,
          },
        ],
      },
      metadata,
    } satisfies CommerceAppConfigOutputModel;

    apiServer.use(
      http.get(`${IO_EVENTS_BASE_URL}/${orgId}/providers`, () =>
        HttpResponse.json({
          _embedded: { providers: [] },
          _links: { self: { href: "/providers" } },
        }),
      ),
      http.get(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/registrations`,
        () =>
          HttpResponse.json({
            _embedded: { registrations: [] },
            _links: { self: { href: "/registrations" } },
          }),
      ),
      http.get(`${COMMERCE_BASE_URL}/eventing/eventProvider`, () =>
        HttpResponse.json([{ workspace_configuration: '{"project":{}}' }]),
      ),
      http.get(`${COMMERCE_BASE_URL}/eventing/getEventSubscriptions`, () =>
        HttpResponse.json([]),
      ),
    );

    const result = await runUpdateFor(
      oldConfig,
      newConfig,
      installationContext,
    );

    expect.assert(!isSucceededState(result), "Expected the update to fail");
    expect(result.error.message).toContain(
      'Cannot reconcile a "changed" commerceSubscription resource',
    );
  });
});

describe("Commerce webhook reconcile", () => {
  const metadata = { ...mockMetadata, id: "test-app-reconcile-webhook" };

  const orderCreatedWebhook = {
    category: "modification" as const,
    description: "Webhook for order created",
    label: "Order Created Webhook",
    requireAdobeAuth: true,
    runtimeAction: "my-package/handle-webhook",
    webhook: {
      batch_name: "default",
      hook_name: "order_created",
      method: "POST",
      webhook_method: "plugin.order.api.order_created",
      webhook_type: "after",
    },
  };

  const orderCancelledWebhook = {
    category: "modification" as const,
    description: "Webhook for order cancelled",
    label: "Order Cancelled Webhook",
    requireAdobeAuth: true,
    runtimeAction: "my-package/handle-cancel-webhook",
    webhook: {
      batch_name: "default",
      hook_name: "order_cancelled",
      method: "POST",
      webhook_method: "plugin.order.api.order_cancelled",
      webhook_type: "after",
    },
  };

  test("added webhook fires the subscribe call", async () => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");
    const installationContext = createMockInstallationContext();

    const oldConfig = {
      metadata,
      webhooks: [orderCreatedWebhook],
    } satisfies CommerceAppConfigOutputModel;

    const newConfig = {
      metadata,
      webhooks: [orderCreatedWebhook, orderCancelledWebhook],
    } satisfies CommerceAppConfigOutputModel;

    const capture = { subscribeBody: null as Record<string, unknown> | null };

    apiServer.use(
      http.get(`${COMMERCE_BASE_URL}/webhooks/list`, () =>
        HttpResponse.json([]),
      ),
      http.post(
        `${COMMERCE_BASE_URL}/webhooks/subscribe`,
        async ({ request }) => {
          capture.subscribeBody = (await request.json()) as Record<
            string,
            unknown
          >;
          return HttpResponse.json({});
        },
      ),
    );

    const result = await runUpdateFor(
      oldConfig,
      newConfig,
      installationContext,
    );

    expect.assert(isSucceededState(result), "Expected the update to succeed");
    expect(capture.subscribeBody).toEqual({
      webhook: expect.objectContaining({
        batch_name: "test_app_reconcile_webhook_default",
        hook_name: "test_app_reconcile_webhook_order_cancelled",
      }),
    });
  });

  test("removed webhook fires the unsubscribe call", async () => {
    const installationContext = createMockInstallationContext();

    const oldConfig = {
      metadata,
      webhooks: [orderCreatedWebhook, orderCancelledWebhook],
    } satisfies CommerceAppConfigOutputModel;

    const newConfig = {
      metadata,
      webhooks: [orderCreatedWebhook],
    } satisfies CommerceAppConfigOutputModel;

    const capture = { unsubscribeBody: null as Record<string, unknown> | null };

    apiServer.use(
      http.get(`${COMMERCE_BASE_URL}/webhooks/list`, () =>
        HttpResponse.json([
          createMockExistingCommerceWebhook({
            batch_name: "test_app_reconcile_webhook_default",
            hook_name: "test_app_reconcile_webhook_order_cancelled",
            webhook_method: orderCancelledWebhook.webhook.webhook_method,
            webhook_type: orderCancelledWebhook.webhook.webhook_type,
          }),
        ]),
      ),
      http.post(
        `${COMMERCE_BASE_URL}/webhooks/unsubscribe`,
        async ({ request }) => {
          capture.unsubscribeBody = (await request.json()) as Record<
            string,
            unknown
          >;
          return HttpResponse.json({});
        },
      ),
    );

    const result = await runUpdateFor(
      oldConfig,
      newConfig,
      installationContext,
    );

    expect.assert(isSucceededState(result), "Expected the update to succeed");
    expect(capture.unsubscribeBody).toEqual({
      webhook: expect.objectContaining({
        batch_name: "test_app_reconcile_webhook_default",
        hook_name: "test_app_reconcile_webhook_order_cancelled",
      }),
    });
  });

  test("changed webhook surfaces UnsupportedReconcileChangeError", async () => {
    const installationContext = createMockInstallationContext();

    const oldConfig = {
      metadata,
      webhooks: [orderCreatedWebhook],
    } satisfies CommerceAppConfigOutputModel;

    const newConfig = {
      metadata,
      webhooks: [
        {
          ...orderCreatedWebhook,
          description: "Updated webhook for order created",
        },
      ],
    } satisfies CommerceAppConfigOutputModel;

    apiServer.use(
      http.get(`${COMMERCE_BASE_URL}/webhooks/list`, () =>
        HttpResponse.json([]),
      ),
    );

    const result = await runUpdateFor(
      oldConfig,
      newConfig,
      installationContext,
    );

    expect.assert(!isSucceededState(result), "Expected the update to fail");
    expect(result.error.message).toContain(
      'Cannot reconcile a "changed" commerceWebhook resource',
    );
  });
});

describe("Admin UI reconcile", () => {
  test("makes no external calls even when the adminUi config changed", async () => {
    // No admin-ui msw handlers are registered at all: `setupApiTestLifecycle` configures
    // `onUnhandledRequest: "error"`, so if the no-op reconcile regressed into calling
    // `enableAdminUiSdk`/`registerExtension`, this test would fail on the unhandled request.
    const installationContext = createMockInstallationContext();
    const metadata = { ...mockMetadata, id: "test-app-reconcile-admin-ui" };

    const oldConfig = {
      adminUi: {
        order: {
          gridColumns: {
            columns: [
              {
                align: "left" as const,
                id: "fulfillment_status",
                label: "Fulfillment",
                type: "string" as const,
              },
            ],
            description: "Adds fulfillment status to the order grid",
            label: "Order fulfillment data",
            runtimeAction: "orders/fetch-order-grid-data",
          },
        },
      },
      metadata,
    } satisfies CommerceAppConfigOutputModel;

    const newConfig = {
      adminUi: {
        order: {
          gridColumns: {
            columns: [
              {
                align: "left" as const,
                id: "loyalty_tier",
                label: "Loyalty Tier",
                type: "string" as const,
              },
            ],
            description: "Adds loyalty tier to the order grid",
            label: "Order loyalty data",
            runtimeAction: "orders/fetch-loyalty-grid-data",
          },
        },
      },
      metadata,
    } satisfies CommerceAppConfigOutputModel;

    const plan = createUpdatePlan(oldConfig, newConfig);
    expect(
      plan.diff.changes.some(
        (change) => change.domain === "adminUi" && change.kind === "changed",
      ),
    ).toBe(true);

    const result = await runUpdateFor(
      oldConfig,
      newConfig,
      installationContext,
    );
    expect.assert(isSucceededState(result), "Expected the update to succeed");
  });
});

describe("Custom installation step reconcile", () => {
  const metadata = { ...mockMetadata, id: "test-app-reconcile-custom-step" };

  function configWithStep(script: {
    description: string;
    name: string;
    script: string;
  }): CommerceAppConfigOutputModel {
    return {
      installation: { customInstallationSteps: [script] },
      metadata,
    } satisfies CommerceAppConfigOutputModel;
  }

  test("added step runs install", async () => {
    const install = vi.fn().mockResolvedValue({ status: "ok" });
    const installationContext = createMockInstallationContextWithScripts({
      "./my-script.js": { install },
    });

    const oldConfig = { metadata } satisfies CommerceAppConfigOutputModel;
    const newConfig = configWithStep({
      description: "A test script",
      name: "My Script",
      script: "./my-script.js",
    });

    const result = await runUpdateFor(
      oldConfig,
      newConfig,
      installationContext,
    );

    expect.assert(isSucceededState(result), "Expected the update to succeed");
    expect(install).toHaveBeenCalledTimes(1);
  });

  // NOTE ON SCOPE: custom installation steps are dynamically generated ONE LEAF PER
  // SCRIPT from the *target* config only (`createCustomScriptSteps`, called from
  // `createRootInstallationStep(plan.targetConfig)`). A script that's removed in the
  // target config has no corresponding leaf step in the executed update tree at all —
  // unlike the branch-level `when` guards used by eventing/webhooks/admin-ui (which key
  // off "does *any* item of this kind exist"), there's no leaf left whose `reconcile`
  // could ever run `uninstall` for a removed script, regardless of sibling steps. This
  // is a structural gap in how the update tree is built (out of scope for this task's
  // per-leaf `reconcile` handlers — fixing it means changing tree construction to also
  // account for scripts present in the old snapshot but absent from the target config).
  // The test below exercises the `removed` branch of the reconcile handler directly
  // (real code, no mocks) rather than through `runUpdate`, since the full workflow can
  // never reach it as currently built.
  test("removed step's reconcile handler runs uninstall (direct invocation — see scope note above)", async () => {
    const uninstall = vi.fn().mockResolvedValue(undefined);
    const installationContext = createMockInstallationContextWithScripts({
      "./my-script.js": { install: vi.fn(), uninstall },
    });

    const scriptConfig = {
      description: "A test script",
      name: "My Script",
      script: "./my-script.js",
    };

    const config = configWithStep(scriptConfig);
    const [step] = createCustomScriptSteps(config);
    const diff = {
      changes: [
        {
          destructive: false,
          domain: "customStep" as const,
          identity: "My Script",
          kind: "removed" as const,
          supported: true,
        },
      ],
    };

    expect.assert(
      !!step?.reconcile,
      "Expected the custom script step to define reconcile",
    );
    await step.reconcile(config, diff, installationContext);

    expect(uninstall).toHaveBeenCalledTimes(1);
  });

  test("changed step skips with a warning instead of re-running install", async () => {
    const install = vi.fn().mockResolvedValue({ status: "first-run" });
    const installationContext = createMockInstallationContextWithScripts({
      "./my-script.js": { install },
    });

    const oldConfig = configWithStep({
      description: "A test script",
      name: "My Script",
      script: "./my-script.js",
    });

    const newConfig = configWithStep({
      description: "A test script (updated)",
      name: "My Script",
      script: "./my-script.js",
    });

    const result = await runUpdateFor(
      oldConfig,
      newConfig,
      installationContext,
    );

    expect.assert(isSucceededState(result), "Expected the update to succeed");
    expect(install).not.toHaveBeenCalled();
    expect(installationContext.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        'Skipping re-apply of custom installation script "My Script"',
      ),
    );
  });
});
