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

import {
  createInitialInstallationState,
  runInstallation,
} from "#management/installation/runner";
import { isSucceededState } from "#management/installation/workflow/types";
import { configWithFullEventing } from "#test/fixtures/config";
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
  };

  beforeEach(() => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");

    const orgId = installationContext.appData.consumerOrgId;
    const projectId = installationContext.appData.projectId;
    const workspaceId = installationContext.appData.workspaceId;

    capture = {
      updateConfiguration: null,
    };

    apiServer.use(
      http.get(`${IO_EVENTS_BASE_URL}/${orgId}/providers`, () =>
        HttpResponse.json({
          _links: { self: { href: "/providers" } },
          _embedded: { providers: [] },
        }),
      ),

      http.get(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/registrations`,
        () =>
          HttpResponse.json({
            _links: { self: { href: "/registrations" } },
            _embedded: { registrations: [] },
          }),
      ),

      http.post(
        `${IO_EVENTS_BASE_URL}/${orgId}/${projectId}/${workspaceId}/providers`,
        async ({ request }) => {
          const requestBody =
            (await request.json()) as IoEventProviderRequestBody;

          const provider = createMockIoEventProvider({
            id:
              requestBody.provider_metadata === "dx_commerce_events"
                ? "io-provider-commerce"
                : "io-provider-external",

            label: requestBody.label,
            description: requestBody.description,
            instance_id: requestBody.instance_id,
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
            event_code: requestBody.event_code,
            label: requestBody.label,
            description: requestBody.description,
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
            id: requestBody.name.startsWith("Commerce Event Registration:")
              ? "registration-1"
              : "registration-2",

            name: requestBody.name,
            description: requestBody.description,
            client_id: requestBody.client_id,
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
              id: "commerce-provider-1",
              provider_id: eventProvider.provider_id,
              instance_id: eventProvider.instance_id,
              label: eventProvider.label,
              description: eventProvider.description,
              workspace_configuration:
                typeof eventProvider.workspace_configuration === "string"
                  ? eventProvider.workspace_configuration
                  : JSON.stringify(eventProvider.workspace_configuration ?? {}),
            }),
          );
        },
      ),

      http.post(`${COMMERCE_BASE_URL}/eventing/eventSubscribe`, () =>
        HttpResponse.json([]),
      ),
    );
  });

  test("runs the real eventing branches and stores the installed entities", async () => {
    const workspaceId = installationContext.appData.workspaceId;
    const initialState = createInitialInstallationState({ config });
    const result = await runInstallation({
      config,
      installationContext,
      initialState,
    });

    expect.assert(isSucceededState(result), "Expected installation to succeed");
    expect(capture.updateConfiguration).toEqual({
      config: expect.objectContaining({
        enabled: true,
        workspace_configuration: expect.any(String),
      }),
    });

    expect(result.data).toMatchObject({
      installation: {
        eventing: {
          commerce: [
            {
              provider: {
                config: commerceSource.provider,
                data: {
                  ioEvents: {
                    id: "io-provider-commerce",
                    label: commerceSource.provider.label,
                    instance_id: `${config.metadata.id}-commerce-events-provider-${workspaceId}`,
                    provider_metadata: "dx_commerce_events",
                  },
                  commerce: {
                    id: "commerce-provider-1",
                    provider_id: "io-provider-commerce",
                    label: commerceSource.provider.label,
                    instance_id: `${config.metadata.id}-commerce-events-provider-${workspaceId}`,
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
                            `com.adobe.commerce.${config.metadata.id}.${commerceEvent.name}`.toLowerCase(),
                          label: commerceEvent.label,
                        },
                        registrations: [
                          {
                            id: "registration-1",
                            name: "Commerce Event Registration: Handle Order (My Package)",
                          },
                        ],
                        subscription: {
                          name: `${config.metadata.id}.${commerceEvent.name}`.toLowerCase(),
                          provider_id: "io-provider-commerce",
                          parent: commerceEvent.name,
                        },
                      },
                    },
                  ],
                },
              },
            },
          ],
          external: [
            {
              provider: {
                config: externalSource.provider,
                data: {
                  ioEvents: {
                    id: "io-provider-external",
                    label: externalSource.provider.label,
                    instance_id: `${config.metadata.id}-external-events-provider-${workspaceId}`,
                    provider_metadata: "3rd_party_custom_events",
                  },
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
                              `${config.metadata.id}.${externalEvent.name}`.toLowerCase(),
                            label: externalEvent.label,
                          },
                          registrations: [
                            {
                              id: "registration-2",
                              name: "External Event Registration: Handle External Event (My Package)",
                            },
                          ],
                        },
                      },
                    ],
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
