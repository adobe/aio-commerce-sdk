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

import { describe, expect, test, vi } from "vitest";

import {
  offboardIoEvents,
  onboardCommerceEventing,
  onboardIoEvents,
} from "#management/installation/events/helpers";
import {
  COMMERCE_PROVIDER_TYPE,
  generateInstanceId,
  getIoEventCode,
  getNamespacedEvent,
  getRegistrationName,
} from "#management/installation/events/utils";
import {
  createCommerceEventConfig,
  createMockMetadata,
} from "#test/fixtures/config";
import {
  createMockCommerceEventProvider,
  createMockCommerceEventSubscription,
  createMockEventingInstallationContext,
  createMockExistingCommerceEventingData,
  createMockExistingIoEventsData,
  createMockIoEventMetadata,
  createMockIoEventMetadataHalModel,
  createMockIoEventProvider,
  createMockIoEventProviderHalModel,
  createMockIoEventRegistration,
  createMockIoEventRegistrationHalModel,
  createMockProvider,
  createMockWorkspaceConfiguration,
} from "#test/fixtures/eventing";

import type { EventProvider } from "#config/schema/eventing";
import type { EventsExecutionContext } from "#management/installation/events/context";
import type {
  EventsDataFromIo,
  OnboardCommerceEventingParams,
  OnboardIoEventsParams,
} from "#management/installation/events/types";

type MockCommerceEvent = ReturnType<
  typeof createCommerceEventConfig
>["eventing"]["commerce"][number]["events"][number];

const DEFAULT_METADATA_ID = "test-app";
const DEFAULT_PROVIDER_LABEL = "Commerce Provider";
const DEFAULT_PROVIDER_KEY = "commerce";
const DEFAULT_EVENT_NAME = "observer.order_placed";
const DEFAULT_IO_EVENT_CODE = "code-1";
const DEFAULT_WORKSPACE_CONFIGURATION = JSON.stringify(
  createMockWorkspaceConfiguration(),
);

function createDefaultEventingContext() {
  return createMockEventingInstallationContext();
}

function createDefaultMetadata() {
  return createMockMetadata(DEFAULT_METADATA_ID);
}

function createDefaultProvider() {
  return createMockProvider(DEFAULT_PROVIDER_LABEL, DEFAULT_PROVIDER_KEY);
}

function createDefaultCommerceEvent() {
  return createCommerceEventConfig(DEFAULT_EVENT_NAME).eventing.commerce[0]
    .events[0];
}

function createIoProvider(
  overrides: Partial<ReturnType<typeof createMockIoEventProvider>> = {},
) {
  const defaultProvider = createDefaultProvider();

  return createMockIoEventProvider({
    label: defaultProvider.label,
    description: defaultProvider.description,
    provider_metadata: COMMERCE_PROVIDER_TYPE,
    ...overrides,
  });
}

function createIoProviderDefaults(
  context: EventsExecutionContext,
  metadata?: ReturnType<typeof createMockMetadata>,
  provider?: EventProvider,
) {
  const resolvedMetadata = metadata ?? createDefaultMetadata();
  const resolvedProvider = provider ?? createDefaultProvider();

  return {
    label: resolvedProvider.label,
    description: resolvedProvider.description,
    instance_id: generateInstanceId(
      resolvedMetadata,
      resolvedProvider,
      context.appData.workspaceId,
    ),
    provider_metadata: COMMERCE_PROVIDER_TYPE,
  };
}

function createCreatedIoProvider(
  context: EventsExecutionContext,
  metadata?: ReturnType<typeof createMockMetadata>,
  provider?: EventProvider,
  overrides: Partial<ReturnType<typeof createMockIoEventProviderHalModel>> = {},
) {
  return {
    ...createIoProviderDefaults(context, metadata, provider),
    ...overrides,
  };
}

function createExistingIoProvider(
  context: EventsExecutionContext,
  metadata?: ReturnType<typeof createMockMetadata>,
  provider?: EventProvider,
  overrides: Partial<ReturnType<typeof createMockIoEventProvider>> = {},
) {
  return createIoProvider({
    ...createIoProviderDefaults(context, metadata, provider),
    ...overrides,
  });
}

function createIoOnboardingScenario({
  context,
  metadata,
  provider,
  event,
}: {
  context?: EventsExecutionContext;
  metadata?: ReturnType<typeof createMockMetadata>;
  provider?: EventProvider;
  event?: MockCommerceEvent;
} = {}) {
  const resolvedContext = context ?? createDefaultEventingContext();
  const resolvedMetadata = metadata ?? createDefaultMetadata();
  const resolvedProvider = provider ?? createDefaultProvider();
  const resolvedEvent = event ?? createDefaultCommerceEvent();

  const input = {
    context: resolvedContext,
    metadata: resolvedMetadata,
    provider: resolvedProvider,
    events: [resolvedEvent],
    providerType: COMMERCE_PROVIDER_TYPE,
  } satisfies OnboardIoEventsParams<MockCommerceEvent>;

  return {
    context: resolvedContext,
    metadata: resolvedMetadata,
    provider: resolvedProvider,
    event: resolvedEvent,
    input,
  };
}

function createIoEventResult(
  event: MockCommerceEvent,
  overrides: Partial<{
    metadata: ReturnType<typeof createMockIoEventMetadata>;
    registrations: ReturnType<typeof createMockIoEventRegistration>[];
  }> = {},
) {
  return {
    config: {
      ...event,
      providerType: COMMERCE_PROVIDER_TYPE,
    },
    data: {
      metadata:
        overrides.metadata ??
        createMockIoEventMetadata({ event_code: DEFAULT_IO_EVENT_CODE }),
      registrations: overrides.registrations ?? [],
    },
  } satisfies EventsDataFromIo<MockCommerceEvent>[number];
}

function createCommerceOnboardingScenario({
  context,
  metadata,
  provider,
  event,
  workspaceConfiguration,
}: {
  context?: EventsExecutionContext;
  metadata?: ReturnType<typeof createMockMetadata>;
  provider?: EventProvider;
  event?: MockCommerceEvent;
  workspaceConfiguration?: string;
} = {}) {
  const resolvedContext = context ?? createDefaultEventingContext();
  const resolvedMetadata = metadata ?? createDefaultMetadata();
  const resolvedProvider = provider ?? createDefaultProvider();
  const resolvedEvent = event ?? createDefaultCommerceEvent();
  const resolvedWorkspaceConfiguration =
    workspaceConfiguration ?? DEFAULT_WORKSPACE_CONFIGURATION;

  const ioProvider = createExistingIoProvider(
    resolvedContext,
    resolvedMetadata,
    resolvedProvider,
    {
      id: "io-provider-1",
    },
  );
  const ioData = {
    provider: ioProvider,
    workspaceConfiguration: resolvedWorkspaceConfiguration,
    events: [createIoEventResult(resolvedEvent)],
  } satisfies OnboardCommerceEventingParams["ioData"];

  return {
    context: resolvedContext,
    metadata: resolvedMetadata,
    provider: resolvedProvider,
    event: resolvedEvent,
    ioProvider,
    ioData,
  };
}

describe("onboardIoEvents", () => {
  test("creates missing I/O Events provider, metadata, and registration with app credentials", async () => {
    const { metadata, provider, context, event, input } =
      createIoOnboardingScenario();

    const { appData, ioEventsClient, params } = context;
    const expectedInstanceId = generateInstanceId(
      metadata,
      provider,
      appData.workspaceId,
    );

    const expectedEventCode = getIoEventCode(
      getNamespacedEvent(metadata, event.name),
      COMMERCE_PROVIDER_TYPE,
    );

    const createdProvider = createMockIoEventProviderHalModel(
      createCreatedIoProvider(context, metadata, provider, {
        id: "io-provider-1",
        instance_id: expectedInstanceId,
      }),
    );

    const createdEventMetadata = createMockIoEventMetadataHalModel({
      event_code: expectedEventCode,
      label: event.label,
    });

    const createdRegistration = createMockIoEventRegistrationHalModel({
      id: "registration-1",
      client_id: params.AIO_COMMERCE_AUTH_IMS_CLIENT_ID,
      name: getRegistrationName(createdProvider, event.runtimeActions[0]),
    });

    vi.mocked(ioEventsClient.createEventProvider).mockResolvedValue(
      createdProvider,
    );

    vi.mocked(ioEventsClient.createEventMetadataForProvider).mockResolvedValue(
      createdEventMetadata,
    );

    vi.mocked(ioEventsClient.createRegistration).mockResolvedValue(
      createdRegistration,
    );

    const result = await onboardIoEvents(
      input,
      createMockExistingIoEventsData(),
    );

    expect(ioEventsClient.createEventProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        consumerOrgId: appData.consumerOrgId,
        projectId: appData.projectId,
        workspaceId: appData.workspaceId,
        label: provider.label,
        providerType: COMMERCE_PROVIDER_TYPE,
        instanceId: expectedInstanceId,
        description: provider.description,
      }),
    );

    expect(ioEventsClient.createEventMetadataForProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: createdProvider.id,
        eventCode: expectedEventCode,
      }),
    );

    expect(result.providerData).toEqual(createdProvider);
    expect(result.eventsData[0]?.data.metadata).toEqual(createdEventMetadata);
    expect(ioEventsClient.createRegistration).toHaveBeenCalledOnce();
  });

  test("reuses existing provider metadata and registrations when they already exist", async () => {
    const { context, metadata, provider, event, input } =
      createIoOnboardingScenario({
        event: createCommerceEventConfig("observer.order_placed", {
          runtimeActions: ["pkg/order-created"],
        }).eventing.commerce[0].events[0],
      });

    const { ioEventsClient } = context;
    const existingProvider = createExistingIoProvider(
      context,
      metadata,
      provider,
      {
        id: "existing-provider",
      },
    );

    const existingMetadata = createMockIoEventMetadata({
      label: event.label,
      description: "My Event",
      event_code: getIoEventCode(
        getNamespacedEvent(metadata, event.name),
        COMMERCE_PROVIDER_TYPE,
      ),
    });

    const existingRegistration = createMockIoEventRegistration({
      id: "registration-existing",
      client_id: context.params.AIO_COMMERCE_AUTH_IMS_CLIENT_ID,
      name: getRegistrationName(existingProvider, event.runtimeActions[0]),
    });

    const result = await onboardIoEvents(
      input,
      createMockExistingIoEventsData({
        providersWithMetadata: [
          {
            ...existingProvider,
            metadata: [{ ...existingMetadata, sample: null }],
          },
        ],
        registrations: [existingRegistration],
      }),
    );

    expect(result.providerData).toMatchObject(existingProvider);
    expect(result.eventsData[0]?.data.metadata).toEqual({
      ...existingMetadata,
      sample: null,
    });

    expect(result.eventsData[0]?.data.registrations).toEqual([
      existingRegistration,
    ]);

    expect(ioEventsClient.createEventProvider).not.toHaveBeenCalled();
    expect(
      ioEventsClient.createEventMetadataForProvider,
    ).not.toHaveBeenCalled();

    expect(ioEventsClient.createRegistration).not.toHaveBeenCalled();
  });

  test("rethrows and logs when creating the I/O Events provider fails", async () => {
    const { context, input } = createIoOnboardingScenario();
    const { ioEventsClient, logger } = context;

    vi.mocked(ioEventsClient.createEventProvider).mockRejectedValue(
      new Error("provider creation failed"),
    );

    await expect(
      onboardIoEvents(input, createMockExistingIoEventsData()),
    ).rejects.toThrow("provider creation failed");

    expect(logger.error).toHaveBeenCalledWith(expect.any(String));
  });

  test("rethrows and logs when creating event metadata fails", async () => {
    const { context, metadata, provider, input } = createIoOnboardingScenario();
    const { ioEventsClient, params, logger } = context;
    const createdProvider = createMockIoEventProviderHalModel(
      createCreatedIoProvider(context, metadata, provider, {
        id: "io-provider-1",
      }),
    );

    vi.mocked(ioEventsClient.createEventProvider).mockResolvedValue(
      createdProvider,
    );

    vi.mocked(ioEventsClient.createEventMetadataForProvider).mockRejectedValue(
      new Error("metadata creation failed"),
    );

    vi.mocked(ioEventsClient.createRegistration).mockResolvedValue(
      createMockIoEventRegistrationHalModel({
        id: "registration-1",
        client_id: params.AIO_COMMERCE_AUTH_IMS_CLIENT_ID,
        name: "registration-name",
      }),
    );

    await expect(
      onboardIoEvents(input, createMockExistingIoEventsData()),
    ).rejects.toThrow("metadata creation failed");

    expect(logger.error).toHaveBeenCalledWith(expect.any(String));
  });

  test("rethrows and logs when creating a registration fails", async () => {
    const { context, metadata, provider, event, input } =
      createIoOnboardingScenario();

    const { ioEventsClient, logger } = context;
    const createdProvider = createMockIoEventProviderHalModel(
      createCreatedIoProvider(context, metadata, provider, {
        id: "io-provider-1",
      }),
    );

    vi.mocked(ioEventsClient.createEventProvider).mockResolvedValue(
      createdProvider,
    );

    vi.mocked(ioEventsClient.createEventMetadataForProvider).mockResolvedValue(
      createMockIoEventMetadataHalModel({
        label: event.label,
        event_code: getIoEventCode(
          getNamespacedEvent(metadata, event.name),
          COMMERCE_PROVIDER_TYPE,
        ),
      }),
    );

    vi.mocked(ioEventsClient.createRegistration).mockRejectedValue(
      new Error("registration creation failed"),
    );

    await expect(
      onboardIoEvents(input, createMockExistingIoEventsData()),
    ).rejects.toThrow("registration creation failed");

    expect(logger.error).toHaveBeenCalledWith(expect.any(String));
  });
});

describe("onboardCommerceEventing", () => {
  test("reuses existing Commerce provider and subscriptions without creating duplicates", async () => {
    const { context, metadata, provider, event, ioProvider, ioData } =
      createCommerceOnboardingScenario();

    const { commerceEventsClient } = context;
    const existingCommerceProvider = createMockCommerceEventProvider({
      provider_id: ioProvider.id,
      label: ioProvider.label,
      description: ioProvider.description,
      instance_id: ioProvider.instance_id,
      workspace_configuration: JSON.stringify(
        createMockWorkspaceConfiguration(),
      ),
    });

    const existingSubscription = createMockCommerceEventSubscription({
      name: getNamespacedEvent(metadata, event.name),
      provider_id: existingCommerceProvider.id,
    });

    vi.mocked(
      commerceEventsClient.updateEventingConfiguration,
    ).mockResolvedValue(true);

    const result = await onboardCommerceEventing(
      {
        context,
        metadata,
        provider,
        ioData,
      },
      createMockExistingCommerceEventingData({
        isDefaultWorkspaceConfigurationEmpty: false,
        providers: [existingCommerceProvider],
        subscriptions: new Map([
          [existingSubscription.name, existingSubscription],
        ]),
      }),
    );

    expect(result.commerceProvider).toEqual({
      id: existingCommerceProvider.id,
      provider_id: ioProvider.id,
      label: ioProvider.label,
      description: ioProvider.description,
      instance_id: ioProvider.instance_id,
    });

    expect(result.subscriptions).toEqual([existingSubscription]);

    expect(
      commerceEventsClient.updateEventingConfiguration,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        // We should always ensure enabled is set to true.
        enabled: true,
      }),
    );

    expect(
      commerceEventsClient.updateEventingConfiguration,
    ).not.toHaveBeenCalledWith(
      expect.objectContaining({
        workspace_configuration: expect.any(String),
      }),
    );

    expect(commerceEventsClient.createEventProvider).not.toHaveBeenCalled();
    expect(commerceEventsClient.createEventSubscription).not.toHaveBeenCalled();
  });

  test("skips configuration when provider is configured and workspace exists", async () => {
    const { context, metadata, provider, event, ioProvider, ioData } =
      createCommerceOnboardingScenario();

    const { commerceEventsClient } = context;
    const existingCommerceProvider = createMockCommerceEventProvider({
      provider_id: ioProvider.id,
      label: ioProvider.label,
      description: ioProvider.description,
      instance_id: ioProvider.instance_id,
      workspace_configuration: JSON.stringify(
        createMockWorkspaceConfiguration(),
      ),
    });

    const existingSubscription = createMockCommerceEventSubscription({
      name: getNamespacedEvent(metadata, event.name),
      provider_id: existingCommerceProvider.id,
    });

    const result = await onboardCommerceEventing(
      {
        context,
        metadata,
        provider,
        ioData,
      },
      createMockExistingCommerceEventingData({
        isDefaultProviderConfigured: true,
        isDefaultWorkspaceConfigurationEmpty: false,
        providers: [existingCommerceProvider],
        subscriptions: new Map([
          [existingSubscription.name, existingSubscription],
        ]),
      }),
    );

    expect(result.commerceProvider).toBeDefined();
    expect(result.subscriptions).toEqual([existingSubscription]);
    expect(
      commerceEventsClient.updateEventingConfiguration,
    ).not.toHaveBeenCalled();
  });

  test("sends only workspace configuration when provider is configured but workspace is empty", async () => {
    const { context, metadata, provider, ioProvider, ioData } =
      createCommerceOnboardingScenario();

    const existingCommerceProvider = createMockCommerceEventProvider({
      provider_id: ioProvider.id,
      label: ioProvider.label,
      description: ioProvider.description,
      instance_id: ioProvider.instance_id,
    });

    vi.mocked(
      context.commerceEventsClient.updateEventingConfiguration,
    ).mockResolvedValue(true);

    vi.mocked(
      context.commerceEventsClient.createEventSubscription,
    ).mockResolvedValue(undefined);

    await onboardCommerceEventing(
      {
        context,
        metadata,
        provider,
        ioData,
      },
      createMockExistingCommerceEventingData({
        isDefaultProviderConfigured: true,
        isDefaultWorkspaceConfigurationEmpty: true,
        providers: [existingCommerceProvider],
      }),
    );

    expect(
      context.commerceEventsClient.updateEventingConfiguration,
    ).toHaveBeenCalledWith({
      workspace_configuration: expect.any(String),
      enabled: true,
    });
  });

  test("requires workspace configuration when there is no existing default configuration", async () => {
    const { context, metadata, provider, ioData } =
      createCommerceOnboardingScenario({
        workspaceConfiguration: "",
      });

    await expect(
      onboardCommerceEventing(
        {
          context,
          metadata,
          provider,
          ioData: {
            ...ioData,
            events: [],
          },
        },
        createMockExistingCommerceEventingData({
          isDefaultWorkspaceConfigurationEmpty: true,
        }),
      ),
    ).rejects.toThrow();

    expect(
      context.commerceEventsClient.updateEventingConfiguration,
    ).not.toHaveBeenCalled();
  });

  test("updates workspace configuration when the default is not configured yet", async () => {
    const { context, metadata, provider, ioProvider, ioData } =
      createCommerceOnboardingScenario();

    const existingCommerceProvider = createMockCommerceEventProvider({
      provider_id: ioProvider.id,
      label: ioProvider.label,
      description: ioProvider.description,
      instance_id: ioProvider.instance_id,
    });

    vi.mocked(
      context.commerceEventsClient.updateEventingConfiguration,
    ).mockResolvedValue(true);

    vi.mocked(
      context.commerceEventsClient.createEventSubscription,
    ).mockResolvedValue(undefined);

    await onboardCommerceEventing(
      {
        context,
        metadata,
        provider,
        ioData,
      },
      createMockExistingCommerceEventingData({
        isDefaultWorkspaceConfigurationEmpty: true,
        providers: [existingCommerceProvider],
      }),
    );

    expect(
      context.commerceEventsClient.updateEventingConfiguration,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace_configuration: expect.any(String),
        enabled: true,
      }),
    );
  });

  test("rethrows and logs when creating a Commerce provider fails", async () => {
    const { context, metadata, provider, ioData } =
      createCommerceOnboardingScenario();

    const { logger } = context;
    vi.mocked(
      context.commerceEventsClient.updateEventingConfiguration,
    ).mockResolvedValue(true);

    vi.mocked(
      context.commerceEventsClient.createEventProvider,
    ).mockRejectedValue(new Error("provider creation failed"));

    await expect(
      onboardCommerceEventing(
        {
          context,
          metadata,
          provider,
          ioData,
        },
        createMockExistingCommerceEventingData({
          isDefaultWorkspaceConfigurationEmpty: false,
          providers: [],
        }),
      ),
    ).rejects.toThrow("provider creation failed");

    expect(logger.error).toHaveBeenCalledWith(expect.any(String));
  });

  test("rethrows and logs when creating a Commerce subscription fails", async () => {
    const { context, metadata, provider, ioProvider, ioData } =
      createCommerceOnboardingScenario();

    const { logger } = context;
    const existingCommerceProvider = createMockCommerceEventProvider({
      provider_id: ioProvider.id,
      label: ioProvider.label,
      description: ioProvider.description,
      instance_id: ioProvider.instance_id,
      workspace_configuration: '{"project":{}}',
    });

    vi.mocked(
      context.commerceEventsClient.updateEventingConfiguration,
    ).mockResolvedValue(true);

    vi.mocked(
      context.commerceEventsClient.createEventSubscription,
    ).mockRejectedValue(new Error("subscription creation failed"));

    await expect(
      onboardCommerceEventing(
        {
          context,
          metadata,
          provider,
          ioData,
        },
        createMockExistingCommerceEventingData({
          isDefaultWorkspaceConfigurationEmpty: false,
          providers: [existingCommerceProvider],
        }),
      ),
    ).rejects.toThrow("subscription creation failed");

    expect(logger.error).toHaveBeenCalledWith(expect.any(String));
  });

  test("rethrows and logs when updating Commerce Eventing configuration returns an unsuccessful response", async () => {
    const { context, metadata, provider, ioData } =
      createCommerceOnboardingScenario();

    const { logger } = context;
    vi.mocked(
      context.commerceEventsClient.updateEventingConfiguration,
    ).mockResolvedValue(false);

    await expect(
      onboardCommerceEventing(
        {
          context,
          metadata,
          provider,
          ioData: {
            ...ioData,
            events: [],
          },
        },
        createMockExistingCommerceEventingData(),
      ),
    ).rejects.toThrow();

    expect(logger.error).toHaveBeenCalledWith(expect.any(String));
  });
});

describe("offboardIoEvents", () => {
  test("deletes registrations matched by name and client_id when events_of_interest is empty", async () => {
    const context = createDefaultEventingContext();
    const metadata = createDefaultMetadata();
    const provider = createDefaultProvider();
    const event = createDefaultCommerceEvent();

    const instanceId = generateInstanceId(
      metadata,
      provider,
      context.appData.workspaceId,
    );
    const ioProvider = createMockIoEventProvider({
      id: "io-provider-1",
      instance_id: instanceId,
      provider_metadata: COMMERCE_PROVIDER_TYPE,
      label: provider.label,
    });

    const registrationName = getRegistrationName(
      ioProvider,
      event.runtimeActions[0],
    );
    const registration = createMockIoEventRegistration({
      registration_id: "test-registration-uuid",
      name: registrationName,
      client_id: context.params.AIO_COMMERCE_AUTH_IMS_CLIENT_ID,
      events_of_interest: [],
    });

    await offboardIoEvents(
      { context, metadata, provider, events: [event] },
      createMockExistingIoEventsData({
        providersWithMetadata: [{ ...ioProvider, metadata: [] }],
        registrations: [registration],
      }),
    );

    expect(context.ioEventsClient.deleteRegistration).toHaveBeenCalled();
  });

  test("calls deleteRegistration with registration_id not id", async () => {
    const context = createDefaultEventingContext();
    const metadata = createDefaultMetadata();
    const provider = createDefaultProvider();
    const event = createDefaultCommerceEvent();

    const instanceId = generateInstanceId(
      metadata,
      provider,
      context.appData.workspaceId,
    );
    const ioProvider = createMockIoEventProvider({
      id: "io-provider-1",
      instance_id: instanceId,
      provider_metadata: COMMERCE_PROVIDER_TYPE,
      label: provider.label,
    });

    const registrationName = getRegistrationName(
      ioProvider,
      event.runtimeActions[0],
    );
    const registration = createMockIoEventRegistration({
      id: "616664",
      registration_id: "correct-uuid-for-api",
      name: registrationName,
      client_id: context.params.AIO_COMMERCE_AUTH_IMS_CLIENT_ID,
      events_of_interest: [],
    });

    await offboardIoEvents(
      { context, metadata, provider, events: [event] },
      createMockExistingIoEventsData({
        providersWithMetadata: [{ ...ioProvider, metadata: [] }],
        registrations: [registration],
      }),
    );

    expect(context.ioEventsClient.deleteRegistration).toHaveBeenCalledWith(
      expect.objectContaining({
        registrationId: "correct-uuid-for-api",
      }),
    );
  });

  test("skips registrations that do not match the current client_id or name", async () => {
    const context = createDefaultEventingContext();
    const metadata = createDefaultMetadata();
    const provider = createDefaultProvider();
    const event = createDefaultCommerceEvent();

    const instanceId = generateInstanceId(
      metadata,
      provider,
      context.appData.workspaceId,
    );
    const ioProvider = createMockIoEventProvider({
      id: "io-provider-1",
      instance_id: instanceId,
      provider_metadata: COMMERCE_PROVIDER_TYPE,
    });

    const foreignRegistration = createMockIoEventRegistration({
      registration_id: "foreign-uuid",
      name: getRegistrationName(ioProvider, event.runtimeActions[0]),
      client_id: "other-client-id",
      events_of_interest: [],
    });

    await offboardIoEvents(
      { context, metadata, provider, events: [event] },
      createMockExistingIoEventsData({
        providersWithMetadata: [{ ...ioProvider, metadata: [] }],
        registrations: [foreignRegistration],
      }),
    );

    expect(context.ioEventsClient.deleteRegistration).not.toHaveBeenCalled();
  });
});
