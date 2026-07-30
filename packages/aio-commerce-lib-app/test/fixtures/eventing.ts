import { vi } from "vitest";

import { createMockInstallationContext } from "./installation";

import type {
  CommerceEventProvider,
  CommerceEventSubscription,
  UpdateEventingConfigurationParams,
} from "@adobe/aio-commerce-lib-events/commerce";
import type {
  IoEventMetadata,
  IoEventMetadataManyResponse,
  IoEventProvider,
  IoEventProviderManyResponse,
  IoEventRegistration,
  IoEventRegistrationManyResponse,
} from "@adobe/aio-commerce-lib-events/io-events";
import type { EventProvider } from "#config/schema/eventing";
import type {
  CustomAdobeIoEventsApiClient,
  CustomCommerceEventsApiClient,
  EventsExecutionContext,
} from "#management/installation/events/context";
import type {
  ExistingCommerceEventingData,
  ExistingIoEventsData,
} from "#management/installation/events/utils";

/** Creates a mock {@link EventProvider} with the given label and optional key. */
export function createMockProvider(label: string, key?: string): EventProvider {
  return {
    description: "A test provider",
    label,
    ...(key !== undefined && { key }),
  };
}

export function createMockIoEventMetadata(
  overrides: Partial<IoEventMetadata> = {},
): IoEventMetadata {
  return {
    description: "Test metadata",
    event_code: "com.adobe.commerce.test-app.observer.order_placed",
    label: "Code One",
    ...overrides,
  };
}

export function createMockIoEventMetadataHalModel(
  overrides: Partial<IoEventMetadataHalModel> = {},
): IoEventMetadataHalModel {
  return {
    ...createMockIoEventMetadata(),
    _links: { self: { href: "/metadata/1" } },
    ...overrides,
  };
}

export function createMockIoEventProvider(
  overrides: Partial<IoEventProvider> = {},
): IoEventProvider {
  return {
    description: "A test provider",
    event_delivery_format: "cloud_events_v1",
    id: "io-provider-1",
    instance_id: "test-app-commerce-test-workspace-id",
    label: "Order Provider",
    provider_metadata: "dx_commerce_events",
    publisher: "adobe",
    source: "magento",
    ...overrides,
  };
}

export function createMockIoEventProviderHalModel(
  overrides: Partial<IoEventProviderHalModel> = {},
): IoEventProviderHalModel {
  return {
    ...createMockIoEventProvider(),
    _links: { self: { href: "/providers/1" } },
    ...overrides,
  };
}

export function createMockIoEventRegistration(
  overrides: Partial<IoEventRegistration> = {},
): IoEventRegistration {
  return {
    client_id: "test-client-id",
    delivery_type: "webhook",
    events_of_interest: [],
    id: "registration-1",
    integration_status: "enabled",
    name: "Commerce Event Registration: Order Provider - Action (My Package)",
    registration_id: "registration-id-1",
    status: "enabled",
    type: "workspace",
    ...overrides,
  };
}

export function createMockIoEventRegistrationHalModel(
  overrides: Partial<IoEventRegistrationHalModel> = {},
): IoEventRegistrationHalModel {
  return {
    ...createMockIoEventRegistration(),
    _links: { self: { href: "/registrations/1" } },
    ...overrides,
  };
}

export function createMockCommerceEventProvider(
  overrides: Partial<CommerceEventProvider> = {},
): CommerceEventProvider {
  return {
    description: "Commerce events",
    id: "commerce-provider-1",
    instance_id: "test-app-commerce-test-workspace-id",
    label: "Commerce Provider",
    provider_id: "io-provider-1",
    workspace_configuration: '{"project":{}}',
    ...overrides,
  };
}

export function createMockCommerceEventSubscription(
  overrides: Partial<CommerceEventSubscription> = {},
): CommerceEventSubscription {
  return {
    destination: "default",
    fields: [{ name: "field" }],
    hipaa_audit_required: false,
    name: "test-app.observer.order_placed",
    parent: "observer.order_placed",
    priority: false,
    provider_id: "default",
    rules: [],
    ...overrides,
  };
}

export function createMockUpdateEventingConfigurationParams(
  overrides: Partial<UpdateEventingConfigurationParams> = {},
): UpdateEventingConfigurationParams {
  return {
    enabled: true,
    environment_id: "test-project-name",
    instance_id: "test-instance-id",
    merchant_id: "test-org-name",
    workspace_configuration: '{"project":{}}',
    ...overrides,
  };
}

type IoEventMetadataHalModel = IoEventMetadataManyResponse["_embedded"][number];
type IoEventProviderHalModel =
  IoEventProviderManyResponse["_embedded"]["providers"][number];

type IoEventRegistrationHalModel =
  IoEventRegistrationManyResponse["_embedded"]["registrations"][number];

/** Creates a mock {@link CommerceEventsApiClient} for testing. */
export function createMockCommerceEventsClient(
  overrides?: Partial<CustomCommerceEventsApiClient>,
) {
  return {
    createEventProvider: vi.fn(overrides?.createEventProvider),
    createEventSubscription: vi.fn(overrides?.createEventSubscription),
    deleteEventProvider: vi
      .fn()
      .mockImplementation(
        overrides?.deleteEventProvider ?? (() => Promise.resolve()),
      ),
    deleteEventSubscription: vi
      .fn()
      .mockImplementation(
        overrides?.deleteEventSubscription ?? (() => Promise.resolve()),
      ),
    getAllEventProviders: vi.fn(overrides?.getAllEventProviders),
    getAllEventSubscriptions: vi.fn(overrides?.getAllEventSubscriptions),
    updateEventingConfiguration: vi.fn(overrides?.updateEventingConfiguration),
  };
}

export function createMockIoEventsClient(
  overrides?: Partial<CustomAdobeIoEventsApiClient>,
) {
  return {
    createEventMetadataForProvider: vi.fn(
      overrides?.createEventMetadataForProvider,
    ),
    createEventProvider: vi.fn(overrides?.createEventProvider),
    createRegistration: vi.fn(overrides?.createRegistration),
    deleteEventMetadataForProvider: vi
      .fn()
      .mockImplementation(
        overrides?.deleteEventMetadataForProvider ?? (() => Promise.resolve()),
      ),
    deleteEventProvider: vi
      .fn()
      .mockImplementation(
        overrides?.deleteEventProvider ?? (() => Promise.resolve()),
      ),
    deleteRegistration: vi
      .fn()
      .mockImplementation(
        overrides?.deleteRegistration ?? (() => Promise.resolve()),
      ),
    getAllEventProviders: vi.fn(overrides?.getAllEventProviders),
    getAllRegistrations: vi.fn(overrides?.getAllRegistrations),
  };
}

/** Options for creating a mock {@link EventsExecutionContext}. */
export type MockEventingInstallationContextOptions = Omit<
  Partial<EventsExecutionContext>,
  "appData" | "params" | "ioEventsClient" | "commerceEventsClient"
> & {
  appData?: Partial<EventsExecutionContext["appData"]>;
  params?: Partial<EventsExecutionContext["params"]>;
  ioEventsClient?: Partial<CustomAdobeIoEventsApiClient>;
  commerceEventsClient?: Partial<CustomCommerceEventsApiClient>;
};

/** Creates a mock {@link EventsExecutionContext} for testing. */
export function createMockEventingInstallationContext({
  commerceEventsClient,
  ioEventsClient,
  ...installationOverrides
}: MockEventingInstallationContextOptions = {}): EventsExecutionContext {
  const mockInstallationContext = createMockInstallationContext(
    installationOverrides,
  );

  const mockIoEventsClient = createMockIoEventsClient(ioEventsClient);
  const mockCommerceEventsClient =
    createMockCommerceEventsClient(commerceEventsClient);

  return {
    ...mockInstallationContext,
    commerceEventsClient: mockCommerceEventsClient,
    ioEventsClient: mockIoEventsClient,
  };
}

export function createMockWorkspaceConfiguration() {
  return {
    project: {
      id: "test-project-id",
      name: "test-project-name",
      org: {
        id: "test-consumer-org-id",
        ims_org_id: "test-ims-org-id",
        name: "test-org-name",
      },
      title: "Test Project Title",
      workspace: {
        action_url: "https://test-namespace.adobeioruntime.net",
        app_url: "https://test-namespace.adobeio-static.net",
        details: {
          credentials: [
            {
              id: "000000",
              integration_type: "oauth_server_to_server" as const,
              name: "aio-test-workspace-id",
              oauth_server_to_server: {
                client_id: "test-client-id",
                client_secrets: ["test-secret-1"],
                scopes: ["test-scope1", "test-scope2"],
                technical_account_email: "test-technical-account@example.com",
                technical_account_id: "test-technical-account-id",
              },
            },
          ],
        },
        id: "test-workspace-id",
        name: "test-workspace-name",
        title: "Test Workspace Title",
      },
    },
  };
}

export function createMockExistingIoEventsData(
  overrides?: Partial<ExistingIoEventsData>,
): ExistingIoEventsData {
  return {
    providersWithMetadata: [],
    registrations: [],
    ...overrides,
  };
}

export function createMockExistingCommerceEventingData(
  overrides?: Partial<ExistingCommerceEventingData>,
): ExistingCommerceEventingData {
  return {
    isDefaultProviderConfigured: false,
    isDefaultWorkspaceConfigurationEmpty: false,
    providers: [],
    subscriptions: new Map(),
    ...overrides,
  };
}

/**
 * Re-imports the `commerce` installation step module with its `helpers`, `utils`,
 * and `@adobe/aio-commerce-lib-config` dependencies mocked, for orchestration tests
 * that need to assert on how the step calls into them.
 */
export async function importCommerceEventsStepWithMocks() {
  vi.resetModules();

  const helperMocks = {
    configureCommerceEventing: vi.fn(),
    offboardCommerceEventing: vi.fn().mockResolvedValue(undefined),
    offboardIoEvents: vi.fn().mockResolvedValue(undefined),
    onboardCommerceEventing: vi.fn(),
    onboardIoEvents: vi.fn(),
  };

  const utilsMocks = {
    getCommerceEventingExistingData: vi.fn(),
    getIoEventsExistingData: vi.fn(),
    makeWorkspaceConfig: vi.fn(),
  };

  const configMocks = {
    getSystemConfigByKey: vi.fn().mockResolvedValue(null),
    setSystemConfigByKey: vi.fn().mockResolvedValue(undefined),
  };

  vi.doMock("#management/installation/events/helpers", async () => {
    const actual = await vi.importActual<
      typeof import("#management/installation/events/helpers")
    >("#management/installation/events/helpers");

    return { ...actual, ...helperMocks };
  });

  vi.doMock("#management/installation/events/utils", async () => {
    const actual = await vi.importActual<
      typeof import("#management/installation/events/utils")
    >("#management/installation/events/utils");

    return { ...actual, ...utilsMocks };
  });

  vi.doMock("@adobe/aio-commerce-lib-config", async () => {
    const actual = await vi.importActual<
      typeof import("@adobe/aio-commerce-lib-config")
    >("@adobe/aio-commerce-lib-config");

    return { ...actual, ...configMocks };
  });

  const commerceModule = await import(
    "#management/installation/events/commerce"
  );

  return {
    commerceEventsStep: commerceModule.commerceEventsStep,
    configMocks,
    helperMocks,
    utilsMocks,
  };
}

/** Undoes the mocks set up by {@link importCommerceEventsStepWithMocks}. */
export function cleanupCommerceEventsStepMocks() {
  vi.clearAllMocks();
  vi.resetModules();
  vi.doUnmock("#management/installation/events/helpers");
  vi.doUnmock("#management/installation/events/utils");
  vi.doUnmock("@adobe/aio-commerce-lib-config");
}
