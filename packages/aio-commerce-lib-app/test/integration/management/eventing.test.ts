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
  EventSubscriptionCreateParams,
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
const [commerceSource] = config.eventing.commerce;
const [commerceEvent] = commerceSource.events;
const [externalSource] = config.eventing.external;
const [externalEvent] = externalSource.events;

setupApiTestLifecycle();
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("eventing installation integration", () => {
  let capture: {
    authorization: string | null;
    updateConfiguration: UpdateEventingConfigurationParams | null;
    ioProviders: ReturnType<typeof createMockIoEventProvider>[];
    ioMetadata: ReturnType<typeof createMockIoEventMetadata>[];
    ioRegistrations: ReturnType<typeof createMockIoEventRegistration>[];
    commerceProvider: ReturnType<typeof createMockCommerceEventProvider> | null;
    commerceSubscriptions: EventSubscriptionCreateParams[];
  };

  let providerCreateCount: number;
  let registrationCreateCount: number;

  beforeEach(() => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");
    capture = {
      authorization: null,
      updateConfiguration: null,
      ioProviders: [],
      ioMetadata: [],
      ioRegistrations: [],
      commerceProvider: null,
      commerceSubscriptions: [],
    };

    providerCreateCount = 0;
    registrationCreateCount = 0;

    apiServer.use(
      http.get(`${IO_EVENTS_BASE_URL}/test-consumer-org-id/providers`, () =>
        HttpResponse.json({
          _links: { self: { href: "/providers" } },
          _embedded: { providers: [] },
        }),
      ),
      http.get(
        `${IO_EVENTS_BASE_URL}/test-consumer-org-id/test-project-id/test-workspace-id/registrations`,
        () =>
          HttpResponse.json({
            _links: { self: { href: "/registrations" } },
            _embedded: { registrations: [] },
          }),
      ),
      http.post(
        `${IO_EVENTS_BASE_URL}/test-consumer-org-id/test-project-id/test-workspace-id/providers`,
        async ({ request }) => {
          const requestBody =
            (await request.json()) as IoEventProviderRequestBody;
          capture.authorization = request.headers.get("Authorization");
          providerCreateCount += 1;

          const provider = createMockIoEventProvider({
            id: `io-provider-${providerCreateCount}`,
            label: requestBody.label,
            description: requestBody.description,
            instance_id: requestBody.instance_id,
            provider_metadata: requestBody.provider_metadata,
          });
          capture.ioProviders.push(provider);

          return HttpResponse.json(createMockIoEventProviderHalModel(provider));
        },
      ),
      http.post(
        `${IO_EVENTS_BASE_URL}/test-consumer-org-id/test-project-id/test-workspace-id/providers/:providerId/eventmetadata`,
        async ({ request }) => {
          const requestBody =
            (await request.json()) as IoEventMetadataRequestBody;

          const metadata = createMockIoEventMetadata({
            event_code: requestBody.event_code,
            label: requestBody.label,
            description: requestBody.description,
            sample: null,
          });
          capture.ioMetadata.push(metadata);

          return HttpResponse.json(createMockIoEventMetadataHalModel(metadata));
        },
      ),
      http.post(
        `${IO_EVENTS_BASE_URL}/test-consumer-org-id/test-project-id/test-workspace-id/registrations`,
        async ({ request }) => {
          const requestBody =
            (await request.json()) as IoEventRegistrationRequestBody;
          registrationCreateCount += 1;

          const registration = createMockIoEventRegistration({
            id: `registration-${registrationCreateCount}`,
            name: requestBody.name,
            description: requestBody.description,
            client_id: requestBody.client_id,
          });
          capture.ioRegistrations.push(registration);

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

          capture.commerceProvider = createMockCommerceEventProvider({
            id: "commerce-provider-1",
            ...eventProvider,
          });

          return HttpResponse.json(capture.commerceProvider);
        },
      ),
      http.post(
        `${COMMERCE_BASE_URL}/eventing/eventSubscribe`,
        async ({ request }) => {
          const { event } = (await request.json()) as {
            event: EventSubscriptionCreateParams;
          };

          capture.commerceSubscriptions.push(event);

          return HttpResponse.json([]);
        },
      ),
    );
  });

  test("runs the real eventing branches and stores the installed entities", async () => {
    const initialState = createInitialInstallationState({ config });
    const result = await runInstallation({
      config,
      installationContext: createMockInstallationContext(),
      initialState,
    });

    expect.assert(isSucceededState(result), "Expected installation to succeed");

    expect(capture.authorization).toBe("Bearer mock-token");
    expect(capture.updateConfiguration).toEqual({
      config: expect.objectContaining({
        enabled: true,
        workspace_configuration: expect.any(String),
      }),
    });
    expect(capture.commerceProvider).not.toBeNull();

    expect(result.data).toMatchObject({
      installation: {
        eventing: {
          commerce: [
            {
              provider: {
                config: commerceSource.provider,
                data: {
                  ioEvents: {
                    id: capture.ioProviders[0]?.id,
                    label: capture.ioProviders[0]?.label,
                    instance_id: capture.ioProviders[0]?.instance_id,
                  },
                  commerce: {
                    id: capture.commerceProvider?.id,
                    provider_id: capture.commerceProvider?.provider_id,
                    label: capture.commerceProvider?.label,
                    instance_id: capture.commerceProvider?.instance_id,
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
                          event_code: capture.ioMetadata[0]?.event_code,
                        },
                        registrations: [{ id: capture.ioRegistrations[0]?.id }],
                        subscription: {
                          name: capture.commerceSubscriptions[0]?.name,
                          provider_id:
                            capture.commerceSubscriptions[0]?.provider_id,
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
                    id: capture.ioProviders[1]?.id,
                    label: capture.ioProviders[1]?.label,
                    instance_id: capture.ioProviders[1]?.instance_id,
                    provider_metadata:
                      capture.ioProviders[1]?.provider_metadata,
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
                            event_code: capture.ioMetadata[1]?.event_code,
                          },
                          registrations: [
                            { id: capture.ioRegistrations[1]?.id },
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
