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
  COMMERCE_PROVIDER_TYPE,
  EXTERNAL_PROVIDER_TYPE,
  generateInstanceId,
  getCommerceEventingConfigurationUpdateParams,
  getCommerceEventingExistingData,
  getIoEventCode,
  getIoEventsExistingData,
  getNamespacedEvent,
  makeWorkspaceConfig,
} from "#management/installation/events/utils";
import { createMockMetadata } from "#test/fixtures/config";
import {
  createMockCommerceEventProvider,
  createMockCommerceEventSubscription,
  createMockCommerceEventsClient,
  createMockEventingInstallationContext,
  createMockExistingCommerceEventingData,
  createMockIoEventMetadataHalModel,
  createMockIoEventProviderHalModel,
  createMockIoEventRegistrationHalModel,
  createMockIoEventsClient,
  createMockProvider,
  createMockUpdateEventingConfigurationParams,
} from "#test/fixtures/eventing";

import type {
  IoEventProviderManyResponse,
  IoEventRegistrationManyResponse,
} from "@adobe/aio-commerce-lib-events/io-events";

const TEST_WORKSPACE_ID = "4567890123456789";
const TEST_NAMESPACE = "test-namespace";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("generateInstanceId", () => {
  test.each([
    [
      "should produce a lowercase instance ID from metadata id, provider key, and workspace id",
      "MyApp-Test",
      createMockProvider("Some Label", "my-provider"),
      `myapp-test-my-provider-${TEST_WORKSPACE_ID}`,
    ],
    [
      "should slugify and lowercase the provider label when key is absent",
      "MyApp-MyApp",
      createMockProvider("Order Notifier"),
      `myapp-myapp-order-notifier-${TEST_WORKSPACE_ID}`,
    ],
    [
      "should lowercase an already-lowercase metadata id",
      "my-app",
      createMockProvider("label", "key"),
      `my-app-key-${TEST_WORKSPACE_ID}`,
    ],
    [
      "should normalize mixed-case metadata id to lowercase",
      "MyMixedApp",
      createMockProvider("Commerce Provider", "commerce"),
      `mymixedapp-commerce-${TEST_WORKSPACE_ID}`,
    ],
  ] as const)("%s", (_desc, id, provider, expected) => {
    expect(
      generateInstanceId(createMockMetadata(id), provider, TEST_WORKSPACE_ID),
    ).toBe(expected);
  });

  test("should truncate metadata id to 100 characters before the provider segment", () => {
    const longId = "a".repeat(250);
    const expectedPrefix = "a".repeat(100);
    const provider = createMockProvider("x", "p");
    expect(
      generateInstanceId(
        createMockMetadata(longId),
        provider,
        TEST_WORKSPACE_ID,
      ),
    ).toBe(`${expectedPrefix}-p-${TEST_WORKSPACE_ID}`);
  });

  test("should produce different instance IDs for the same app and provider when workspace differs", () => {
    const metadata = createMockMetadata("my-app");
    const provider = createMockProvider("x", "same-key");
    expect(generateInstanceId(metadata, provider, "workspace-a")).not.toBe(
      generateInstanceId(metadata, provider, "workspace-b"),
    );
  });
});

describe("getNamespacedEvent", () => {
  test.each([
    [
      "should join id and event name with a dot",
      "my-app",
      "observer.order_placed",
      "my-app.observer.order_placed",
    ],
    [
      "should lowercase the result when id contains uppercase",
      "MyApp",
      "observer.order_placed",
      "myapp.observer.order_placed",
    ],
    [
      "should lowercase the result when event name contains uppercase",
      "my-app",
      "Observer.Order_Placed",
      "my-app.observer.order_placed",
    ],
    [
      "should lowercase both parts when both contain uppercase",
      "MyApp",
      "Observer.OrderPlaced",
      "myapp.observer.orderplaced",
    ],
  ])("%s", (_desc, id, name, expected) => {
    expect(getNamespacedEvent(createMockMetadata(id), name)).toBe(expected);
  });
});

describe("getIoEventCode", () => {
  test("should prefix with com.adobe.commerce. for Commerce provider type", () => {
    const eventName = "my-app.observer.order_placed";
    expect(getIoEventCode(eventName, COMMERCE_PROVIDER_TYPE)).toBe(
      `com.adobe.commerce.${eventName}`,
    );
  });

  test("should return the name unchanged for external provider type", () => {
    const eventName = "my-app.webhook.received";
    expect(getIoEventCode(eventName, EXTERNAL_PROVIDER_TYPE)).toBe(eventName);
  });

  test("should produce a fully lowercase event code when combined with a normalized namespaced event", () => {
    const metadata = createMockMetadata("MyApp");
    const namespacedEvent = getNamespacedEvent(
      metadata,
      "Observer.OrderPlaced",
    );

    expect(getIoEventCode(namespacedEvent, COMMERCE_PROVIDER_TYPE)).toBe(
      "com.adobe.commerce.myapp.observer.orderplaced",
    );
  });
});

describe("workspace configuration", () => {
  test("makeWorkspaceConfig builds Commerce Eventing workspace configuration from the installation context", () => {
    vi.stubEnv("__OW_NAMESPACE", TEST_NAMESPACE);

    const context = createMockEventingInstallationContext({
      params: {
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["secret-1", "secret-2"],
        AIO_COMMERCE_AUTH_IMS_SCOPES: [" scope-a ", "scope-b "],
      },
    });

    expect(makeWorkspaceConfig(context)).toEqual({
      project: {
        id: expect.any(String),
        name: expect.any(String),
        title: expect.any(String),
        org: {
          id: expect.any(String),
          name: expect.any(String),
          ims_org_id: expect.any(String),
        },
        workspace: {
          id: expect.any(String),
          name: expect.any(String),
          title: expect.any(String),
          action_url: "https://test-namespace.adobeioruntime.net",
          app_url: "https://test-namespace.adobeio-static.net",
          details: {
            credentials: [
              {
                id: "000000",
                name: expect.any(String),
                integration_type: "oauth_server_to_server",
                oauth_server_to_server: {
                  client_id: expect.any(String),
                  client_secrets: ["secret-1", "secret-2"],
                  technical_account_email: expect.any(String),
                  technical_account_id: expect.any(String),
                  scopes: ["scope-a", "scope-b"],
                },
              },
            ],
          },
        },
      },
    });
  });

  test("makeWorkspaceConfig throws when runtime action inputs resolve to Integration auth instead of IMS auth", () => {
    const baseContext = createMockEventingInstallationContext();
    const context: typeof baseContext = {
      ...baseContext,

      // @ts-expect-error This test intentionally swaps IMS installation params
      // for valid Integration auth inputs to assert that IMS auth is required.
      params: {
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_KEY: "consumer-key",
        AIO_COMMERCE_AUTH_INTEGRATION_CONSUMER_SECRET: "consumer-secret",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN: "access-token",
        AIO_COMMERCE_AUTH_INTEGRATION_ACCESS_TOKEN_SECRET:
          "access-token-secret",
      },
    };

    expect(() => makeWorkspaceConfig(context)).toThrow();
  });
});

describe("getCommerceEventingConfigurationUpdateParams", () => {
  test("returns null when the default provider and workspace are already configured", () => {
    expect(
      getCommerceEventingConfigurationUpdateParams(
        createMockUpdateEventingConfigurationParams(),
        createMockExistingCommerceEventingData({
          isDefaultProviderConfigured: true,
          isDefaultWorkspaceConfigurationEmpty: false,
        }),
      ),
    ).toBeNull();
  });

  test("returns only enabled and workspace configuration when the provider exists but workspace is empty", () => {
    const initialParams = createMockUpdateEventingConfigurationParams();
    expect(
      getCommerceEventingConfigurationUpdateParams(
        initialParams,
        createMockExistingCommerceEventingData({
          isDefaultProviderConfigured: true,
          isDefaultWorkspaceConfigurationEmpty: true,
        }),
      ),
    ).toEqual({
      enabled: true,
      workspace_configuration: initialParams.workspace_configuration,
    });
  });

  test("returns the full default-provider payload when the default provider is not configured", () => {
    const initialParams = createMockUpdateEventingConfigurationParams();
    expect(
      getCommerceEventingConfigurationUpdateParams(
        initialParams,
        createMockExistingCommerceEventingData({
          isDefaultProviderConfigured: false,
          isDefaultWorkspaceConfigurationEmpty: true,
        }),
      ),
    ).toEqual(initialParams);
  });

  test("throws when workspace configuration is required but missing", () => {
    expect(() =>
      getCommerceEventingConfigurationUpdateParams(
        {
          enabled: true,
        },
        createMockExistingCommerceEventingData({
          isDefaultProviderConfigured: true,
          isDefaultWorkspaceConfigurationEmpty: true,
        }),
      ),
    ).toThrow();
  });
});

describe("existing data normalization", () => {
  test("getIoEventsExistingData normalizes HAL providers and registrations", async () => {
    const ioProviderWithMetadata = createMockIoEventProviderHalModel({
      id: "provider-1",
      label: "Provider One",
      instance_id: "instance-1",
      _embedded: {
        eventmetadata: [
          createMockIoEventMetadataHalModel({
            event_code: "code-1",
            label: "Code One",
            _embedded: {
              sample_event: {
                format: "application/json",
                sample_payload: '{"hello":"world"}',
                _links: { self: { href: "/samples/1" } },
              },
            },
          }),
          createMockIoEventMetadataHalModel({
            event_code: "code-2",
            label: "Code Two",
            _links: { self: { href: "/metadata/2" } },
          }),
        ],
      },
    });

    const ioProviderWithoutMetadata = createMockIoEventProviderHalModel({
      id: "provider-2",
      label: "Provider Two",
      instance_id: "instance-2",
      _embedded: undefined,
      _links: { self: { href: "/providers/2" } },
    });

    const registration = createMockIoEventRegistrationHalModel({
      id: "registration-1",
      name: "Registration One",
    });

    const context = createMockEventingInstallationContext({
      ioEventsClient: createMockIoEventsClient({
        getAllEventProviders: vi.fn(
          async () =>
            ({
              _embedded: {
                providers: [ioProviderWithMetadata, ioProviderWithoutMetadata],
              },
              _links: { self: { href: "/providers" } },
            }) satisfies IoEventProviderManyResponse,
        ),

        getAllRegistrations: vi.fn(
          async () =>
            ({
              _embedded: {
                registrations: [registration],
              },
              _links: { self: { href: "/registrations" } },
            }) satisfies IoEventRegistrationManyResponse,
        ),
      }),
    });

    await expect(getIoEventsExistingData(context)).resolves.toEqual({
      providersWithMetadata: [
        {
          id: "provider-1",
          label: "Provider One",
          instance_id: "instance-1",
          source: "magento",
          publisher: "adobe",
          provider_metadata: "dx_commerce_events",
          event_delivery_format: "cloud_events_v1",
          description: "A test provider",
          metadata: [
            {
              event_code: "code-1",
              label: "Code One",
              description: "Test metadata",
              sample: {
                format: "application/json",
                sample_payload: '{"hello":"world"}',
                _links: { self: { href: "/samples/1" } },
              },
            },
            {
              event_code: "code-2",
              label: "Code Two",
              description: "Test metadata",
              sample: null,
            },
          ],
        },
        {
          id: "provider-2",
          label: "Provider Two",
          instance_id: "instance-2",
          source: "magento",
          publisher: "adobe",
          provider_metadata: "dx_commerce_events",
          event_delivery_format: "cloud_events_v1",
          description: "A test provider",
          metadata: [],
        },
      ],
      registrations: [
        {
          id: "registration-1",
          name: "Registration One",
          client_id: "test-client-id",
          status: "enabled",
          type: "workspace",
          integration_status: "enabled",
          events_of_interest: [],
          registration_id: "registration-id-1",
          delivery_type: "webhook",
        },
      ],
    });
  });

  test("getCommerceEventingExistingData reports no default provider when all providers have an id", async () => {
    const existingProvider = createMockCommerceEventProvider({
      id: "provider-1",
      provider_id: "provider-1",
      label: "Existing Provider",
    });

    const context = createMockEventingInstallationContext({
      commerceEventsClient: createMockCommerceEventsClient({
        getAllEventSubscriptions: vi.fn(async () => []),
        getAllEventProviders: vi.fn(async () => [existingProvider]),
      }),
    });

    await expect(
      getCommerceEventingExistingData(context),
    ).resolves.toStrictEqual({
      isDefaultWorkspaceConfigurationEmpty: true,
      isDefaultProviderConfigured: false,
      providers: [existingProvider],
      subscriptions: new Map(),
    });
  });

  test("getCommerceEventingExistingData detects configured workspace when default provider has a non-empty configuration", async () => {
    const { id: _, ...defaultProvider } = createMockCommerceEventProvider({
      id: "default-provider",
      provider_id: "default-provider-id",
      instance_id: "default-instance-id",
      label: "Default Provider",
      workspace_configuration: '{"project":{}}',
    });

    const context = createMockEventingInstallationContext({
      commerceEventsClient: createMockCommerceEventsClient({
        getAllEventSubscriptions: vi.fn(async () => []),
        getAllEventProviders: vi.fn(async () => [defaultProvider]),
      }),
    });

    await expect(
      getCommerceEventingExistingData(context),
    ).resolves.toStrictEqual({
      isDefaultWorkspaceConfigurationEmpty: false,
      isDefaultProviderConfigured: true,
      providers: [defaultProvider],
      subscriptions: new Map(),
    });
  });

  test("getCommerceEventingExistingData detects empty default workspace configuration and provider and maps subscriptions by name", async () => {
    const { id: _, ...defaultProvider } = createMockCommerceEventProvider({
      id: "default-provider",
      provider_id: "default-provider-id",
      instance_id: "default-instance-id",
      label: "Default Provider",
      workspace_configuration: "   ",
    });

    const existingProvider = createMockCommerceEventProvider({
      id: "provider-1",
      provider_id: "provider-1",
      label: "Existing Provider",
    });

    const subscription = createMockCommerceEventSubscription({
      name: "my-app.observer.order_placed",
      provider_id: "provider-1",
    });

    const context = createMockEventingInstallationContext({
      commerceEventsClient: createMockCommerceEventsClient({
        getAllEventSubscriptions: vi.fn(async () => [subscription]),
        getAllEventProviders: vi.fn(async () => [
          defaultProvider,
          existingProvider,
        ]),
      }),
    });

    await expect(
      getCommerceEventingExistingData(context),
    ).resolves.toStrictEqual({
      isDefaultWorkspaceConfigurationEmpty: true,
      isDefaultProviderConfigured: true,
      providers: [defaultProvider, existingProvider],
      subscriptions: new Map([[subscription.name, subscription]]),
    });
  });
});
