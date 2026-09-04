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
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { isSucceededState } from "#management/common/workflow/types";
import { applyCommerceEvents } from "#management/domains/events/commerce";
import { createEventsStepContext } from "#management/domains/events/context";
import { planCommerceEvents } from "#management/domains/events/plan";
import {
  COMMERCE_PROVIDER_TYPE,
  getNamespacedEvent,
  getProviderKey,
} from "#management/domains/events/utils";
import {
  createInitialInstallationState,
  runInstallation,
} from "#management/installation/runner";
import {
  configWithCommerceEventing,
  configWithFullEventing,
} from "#test/fixtures/config";
import {
  createMockCommerceEventProvider,
  createMockIoEventMetadata,
  createMockIoEventMetadataHalModel,
  createMockIoEventProvider,
  createMockIoEventProviderHalModel,
  createMockIoEventRegistration,
  createMockIoEventRegistrationHalModel,
} from "#test/fixtures/eventing";
import { createMockInstallationContext } from "#test/fixtures/installation";
import { apiServer, setupApiTestLifecycle } from "#test/setup/api";

import type { ImsAuthParams } from "@adobe/aio-commerce-lib-auth";
import type {
  EventProviderCreateParams as CommerceEventProviderCreateParams,
  UpdateEventingConfigurationParams,
} from "@adobe/aio-commerce-lib-events/commerce";
import type { EventingSnapshotData } from "#management/domains/events/types";

type IoEventProviderRequestBody = {
  label: string;
  description?: string;
  provider_metadata: "dx_commerce_events" | "3rd_party_custom_events" | string;
  instance_id: string;
};

type IoEventMetadataRequestBody = {
  label: string;
  description?: string;
  event_code: string;
};

type IoEventRegistrationRequestBody = {
  client_id: string;
  name: string;
  description?: string;
};

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

vi.mock("@adobe/aio-commerce-lib-config", async () => {
  const actual = await vi.importActual<
    typeof import("@adobe/aio-commerce-lib-config")
  >("@adobe/aio-commerce-lib-config");
  return {
    ...actual,
    getSystemConfigByKey: vi.fn().mockResolvedValue(null),
    setSystemConfigByKey: vi.fn().mockResolvedValue(undefined),
  };
});

const IO_EVENTS_BASE_URL = "https://api.adobe.io/events";
const COMMERCE_BASE_URL = "https://api.commerce.adobe.com/V1";

const config = configWithFullEventing;
const installationContext = createMockInstallationContext();

const [commerceSource] = config.eventing.commerce;
const [commerceEvent] = commerceSource.events;
const [externalSource] = config.eventing.external;
const [externalEvent] = externalSource.events;

setupApiTestLifecycle();
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("eventing installation", () => {
  let capture: {
    updateConfiguration: UpdateEventingConfigurationParams | null;
    subscribeBody: unknown;
  };

  beforeEach(() => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");

    const {
      consumerOrgId: orgId,
      projectId,
      workspaceId,
    } = installationContext.appData;

    capture = {
      subscribeBody: null,
      updateConfiguration: null,
    };

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

      http.post(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/providers`,
        async ({ request }) => {
          const requestBody =
            (await request.json()) as IoEventProviderRequestBody;

          const provider = createMockIoEventProvider({
            description: requestBody.description,
            id:
              requestBody.provider_metadata === "dx_commerce_events"
                ? "io-provider-commerce"
                : "io-provider-external",
            instance_id: requestBody.instance_id,

            label: requestBody.label,
            provider_metadata: requestBody.provider_metadata,
          });

          return HttpResponse.json(createMockIoEventProviderHalModel(provider));
        },
      ),

      http.post(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/providers/:providerId/eventmetadata`,
        async ({ request }) => {
          const requestBody =
            (await request.json()) as IoEventMetadataRequestBody;

          const metadata = createMockIoEventMetadata({
            description: requestBody.description,
            event_code: requestBody.event_code,
            label: requestBody.label,
          });

          return HttpResponse.json(createMockIoEventMetadataHalModel(metadata));
        },
      ),

      http.post(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/registrations`,
        async ({ request }) => {
          const requestBody =
            (await request.json()) as IoEventRegistrationRequestBody;

          const registration = createMockIoEventRegistration({
            client_id: requestBody.client_id,
            description: requestBody.description,
            id: requestBody.name.startsWith(
              "Commerce Event Registration: Order Events Provider -",
            )
              ? "registration-1"
              : "registration-2",

            name: requestBody.name,
          });

          return HttpResponse.json(
            createMockIoEventRegistrationHalModel(registration),
          );
        },
      ),

      http.get(`${COMMERCE_BASE_URL}/eventing/eventProvider`, () =>
        HttpResponse.json([{ workspace_configuration: "" }]),
      ),

      http.get(`${COMMERCE_BASE_URL}/eventing/getEventSubscriptions`, () =>
        HttpResponse.json([]),
      ),

      http.put(
        `${COMMERCE_BASE_URL}/eventing/updateConfiguration`,
        async ({ request }) => {
          capture.updateConfiguration =
            (await request.json()) as UpdateEventingConfigurationParams;

          return HttpResponse.json(true);
        },
      ),

      http.post(
        `${COMMERCE_BASE_URL}/eventing/eventProvider`,
        async ({ request }) => {
          const { eventProvider } = (await request.json()) as {
            eventProvider: CommerceEventProviderCreateParams;
          };

          return HttpResponse.json(
            createMockCommerceEventProvider({
              description: eventProvider.description,
              id: "commerce-provider-1",
              instance_id: eventProvider.instance_id,
              label: eventProvider.label,
              provider_id: eventProvider.provider_id,
              workspace_configuration:
                typeof eventProvider.workspace_configuration === "string"
                  ? eventProvider.workspace_configuration
                  : JSON.stringify(eventProvider.workspace_configuration ?? {}),
            }),
          );
        },
      ),

      http.post(
        `${COMMERCE_BASE_URL}/eventing/eventSubscribe`,
        async ({ request }) => {
          capture.subscribeBody = await request.json();
          return HttpResponse.json([]);
        },
      ),
    );
  });

  test("runs the real eventing branches and stores the installed entities", async () => {
    const { workspaceId } = installationContext.appData;
    const initialState = createInitialInstallationState({ config });
    const result = await runInstallation({
      config,
      initialState,
      installationContext,
    });

    expect.assert(isSucceededState(result), "Expected installation to succeed");
    expect(capture.updateConfiguration).toEqual({
      config: expect.objectContaining({
        enabled: true,
        workspace_configuration: expect.any(String),
      }),
    });

    expect(capture.subscribeBody).toEqual(
      expect.objectContaining({
        event: expect.objectContaining({ rules: commerceEvent.rules }),
      }),
    );

    const sanitizedMetadataId = config.metadata.id
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_");

    expect(result.data).toMatchObject({
      installation: {
        eventing: {
          commerce: [
            {
              provider: {
                config: commerceSource.provider,
                data: {
                  commerce: {
                    id: "commerce-provider-1",
                    instance_id: `${config.metadata.id}-order-events-provider-${workspaceId}`,
                    label: commerceSource.provider.label,
                    provider_id: "io-provider-commerce",
                  },
                  events: [
                    {
                      config: {
                        ...commerceEvent,
                        name: commerceEvent.name,
                        providerType: "dx_commerce_events",
                      },
                      data: {
                        metadata: {
                          event_code:
                            `com.adobe.commerce.${sanitizedMetadataId}.${commerceEvent.name}`.toLowerCase(),
                          label: commerceEvent.label,
                        },
                        registrations: [
                          {
                            id: "registration-1",
                            name: "Commerce Event Registration: Order Events Provider - Handle Order (My Package)",
                          },
                        ],
                        subscription: {
                          name: `${sanitizedMetadataId}.${commerceEvent.name}`.toLowerCase(),
                          parent: commerceEvent.name,
                          provider_id: "io-provider-commerce",
                          rules: commerceEvent.rules,
                        },
                      },
                    },
                  ],
                  ioEvents: {
                    id: "io-provider-commerce",
                    instance_id: `${config.metadata.id}-order-events-provider-${workspaceId}`,
                    label: commerceSource.provider.label,
                    provider_metadata: "dx_commerce_events",
                  },
                },
              },
            },
          ],
          external: [
            {
              provider: {
                config: externalSource.provider,
                data: {
                  events: {
                    config: externalSource.events,
                    data: [
                      {
                        config: {
                          ...externalEvent,
                          name: externalEvent.name,
                          providerType: "3rd_party_custom_events",
                        },
                        data: {
                          metadata: {
                            event_code:
                              `${sanitizedMetadataId}.${externalEvent.name}`.toLowerCase(),
                            label: externalEvent.label,
                          },
                          registrations: [
                            {
                              id: "registration-2",
                              name: "External Event Registration: Third Party Events Provider - Handle External Event (My Package)",
                            },
                          ],
                        },
                      },
                    ],
                  },
                  ioEvents: {
                    id: "io-provider-external",
                    instance_id: `${config.metadata.id}-third-party-events-provider-${workspaceId}`,
                    label: externalSource.provider.label,
                    provider_metadata: "3rd_party_custom_events",
                  },
                },
              },
            },
          ],
        },
      },
    });
  });
});

describe("eventing upgrade recovery integration", () => {
  const UPGRADE_PATH = ["upgrade", "eventing", "commerce"];

  test("rolls back an added subscription when Commerce rejects a sibling during an upgrade", async () => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");

    const {
      consumerOrgId: orgId,
      projectId,
      workspaceId,
    } = installationContext.appData;

    const baselineConfig = configWithCommerceEventing;
    const [baselineProvider] = baselineConfig.eventing.commerce;
    // The upgrade adds two events; Commerce accepts one and rejects the other.
    const addedValidEvent = {
      description: "Triggered when an order is accepted",
      fields: [{ name: "order_id" }],
      label: "Order Accepted",
      name: "plugin.order_accepted",
      runtimeActions: ["my-package/handle-order"],
    };
    const addedRejectedEvent = {
      description: "An event Commerce does not support",
      fields: [{ name: "order_id" }],
      label: "Invented",
      name: "plugin.invented_event",
      runtimeActions: ["my-package/handle-order"],
    };
    const targetConfig = {
      ...baselineConfig,
      eventing: {
        commerce: [
          {
            ...baselineProvider,
            events: [
              ...baselineProvider.events,
              addedValidEvent,
              addedRejectedEvent,
            ],
          },
        ],
      },
    };

    // Maps each event's parent (raw) name to the namespaced subscription name Commerce received.
    const subscribedByParent: Record<string, string> = {};
    const unsubscribed: string[] = [];

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
      http.post(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/providers`,
        async ({ request }) => {
          const body = (await request.json()) as IoEventProviderRequestBody;
          return HttpResponse.json(
            createMockIoEventProviderHalModel(
              createMockIoEventProvider({
                description: body.description,
                id: "io-provider-commerce",
                instance_id: body.instance_id,
                label: body.label,
                provider_metadata: body.provider_metadata,
              }),
            ),
          );
        },
      ),
      http.post(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/providers/:providerId/eventmetadata`,
        async ({ request }) => {
          const body = (await request.json()) as IoEventMetadataRequestBody;
          return HttpResponse.json(
            createMockIoEventMetadataHalModel(
              createMockIoEventMetadata({
                description: body.description,
                event_code: body.event_code,
                label: body.label,
              }),
            ),
          );
        },
      ),
      http.post(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/registrations`,
        async ({ request }) => {
          const body = (await request.json()) as IoEventRegistrationRequestBody;
          return HttpResponse.json(
            createMockIoEventRegistrationHalModel(
              createMockIoEventRegistration({
                client_id: body.client_id,
                description: body.description,
                id: "registration-1",
                name: body.name,
              }),
            ),
          );
        },
      ),
      http.get(`${COMMERCE_BASE_URL}/eventing/eventProvider`, () =>
        HttpResponse.json([{ workspace_configuration: "" }]),
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
            eventProvider: CommerceEventProviderCreateParams;
          };
          return HttpResponse.json(
            createMockCommerceEventProvider({
              description: eventProvider.description,
              id: "commerce-provider-1",
              instance_id: eventProvider.instance_id,
              label: eventProvider.label,
              provider_id: eventProvider.provider_id,
              workspace_configuration: "",
            }),
          );
        },
      ),
      http.post(
        `${COMMERCE_BASE_URL}/eventing/eventSubscribe`,
        async ({ request }) => {
          const body = (await request.json()) as {
            event: { name: string; parent: string };
          };
          subscribedByParent[body.event.parent] = body.event.name;

          if (body.event.parent === addedRejectedEvent.name) {
            // Commerce rejects an event it does not support.
            return HttpResponse.json(
              { message: "Event is not in the list of supported events" },
              { status: 400 },
            );
          }
          return HttpResponse.json([]);
        },
      ),
      http.post(
        `${COMMERCE_BASE_URL}/eventing/eventUnsubscribe/:name`,
        ({ params }) => {
          unsubscribed.push(decodeURIComponent(params.name as string));
          return HttpResponse.json([]);
        },
      ),
    );

    const lifecycleContext = createMockInstallationContext();
    const context = {
      ...lifecycleContext,
      ...createEventsStepContext(lifecycleContext),
    };
    const baselineData: EventingSnapshotData = {
      providers: [
        {
          events: baselineProvider.events,
          key: getProviderKey(baselineProvider.provider),
          provider: baselineProvider.provider,
          type: COMMERCE_PROVIDER_TYPE,
        },
      ],
    };
    const baseline = { config: baselineConfig, data: baselineData };

    const planResult = await planCommerceEvents(
      { baseline, path: UPGRADE_PATH, targetConfig },
      context,
    );
    expect.assert(planResult.kind === "planned");

    // The apply fails (no snapshot advances the baseline) reporting the original rejection.
    const applyResult = await applyCommerceEvents(planResult.plan, {
      ...context,
      attemptId: "attempt-1",
      baseline,
      targetConfig,
    }).catch((error: unknown) => error);
    expect(applyResult).toBeInstanceOf(Error);

    // The accepted added event was subscribed, then rolled back on recovery, while the baseline
    // event is never unsubscribed.
    const acceptedName = subscribedByParent[addedValidEvent.name];
    expect(acceptedName).toBeDefined();
    expect(unsubscribed).toContain(acceptedName);
    expect(unsubscribed).not.toContain(
      getNamespacedEvent(
        baselineConfig.metadata,
        baselineProvider.events[0].name,
      ),
    );
  });
});
