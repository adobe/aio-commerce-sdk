import { vi } from "vitest";

import { createMockInstallationContext } from "./installation";

import type {
  CommerceEventProvider,
  CommerceEventSubscription,
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
    label,
    description: "A test provider",
    ...(key !== undefined && { key }),
  };
}

export function createMockIoEventMetadata(
  overrides: Partial<IoEventMetadata> = {},
): IoEventMetadata {
  return {
    event_code: "com.adobe.commerce.test-app.observer.order_placed",
    label: "Code One",
    description: "Test metadata",
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
    id: "io-provider-1",
    instance_id: "test-app-commerce-test-workspace-id",
    label: "Commerce Provider",
    source: "magento",
    publisher: "adobe",
    provider_metadata: "dx_commerce_events",
    event_delivery_format: "cloud_events_v1",
    description: "A test provider",
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
    id: "registration-1",
    name: "Commerce Event Registration: Action (My Package)",
    client_id: "test-client-id",
    status: "enabled",
    type: "workspace",
    integration_status: "enabled",
    events_of_interest: [],
    registration_id: "registration-id-1",
    delivery_type: "webhook",
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
    id: "commerce-provider-1",
    provider_id: "io-provider-1",
    instance_id: "test-app-commerce-test-workspace-id",
    label: "Commerce Provider",
    description: "Commerce events",
    workspace_configuration: '{"project":{}}',
    ...overrides,
  };
}

export function createMockCommerceEventSubscription(
  overrides: Partial<CommerceEventSubscription> = {},
): CommerceEventSubscription {
  return {
    name: "test-app.observer.order_placed",
    parent: "observer.order_placed",
    provider_id: "default",
    fields: [{ name: "field" }],
    rules: [],
    destination: "default",
    priority: false,
    hipaa_audit_required: false,
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
    getAllEventProviders: vi.fn(overrides?.getAllEventProviders),
    createEventSubscription: vi.fn(overrides?.createEventSubscription),
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
    getAllEventProviders: vi.fn(overrides?.getAllEventProviders),
    getAllRegistrations: vi.fn(overrides?.getAllRegistrations),
    updateRegistration: vi.fn(overrides?.updateRegistration),
  } satisfies CustomAdobeIoEventsApiClient;
}

type EventingInstallationContextOverrides = Omit<
  Partial<EventsExecutionContext>,
  "appData" | "params" | "commerceEventsClient" | "ioEventsClient"
> & {
  appData?: Partial<EventsExecutionContext["appData"]>;
  params?: Partial<EventsExecutionContext["params"]>;
  commerceEventsClient?: Partial<CustomCommerceEventsApiClient>;
  ioEventsClient?: Partial<CustomAdobeIoEventsApiClient>;
};

/** Creates a mock {@link EventsExecutionContext} for testing. */
export function createMockEventingInstallationContext({
  commerceEventsClient,
  ioEventsClient,
  ...installationOverrides
}: EventingInstallationContextOverrides = {}): EventsExecutionContext {
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
      title: "Test Project Title",
      org: {
        id: "test-consumer-org-id",
        name: "test-org-name",
        ims_org_id: "test-ims-org-id",
      },
      workspace: {
        id: "test-workspace-id",
        name: "test-workspace-name",
        title: "Test Workspace Title",
        action_url: "https://test-namespace.adobeioruntime.net",
        app_url: "https://test-namespace.adobeio-static.net",
        details: {
          credentials: [
            {
              id: "000000",
              name: "aio-test-workspace-id",
              integration_type: "oauth_server_to_server" as const,
              oauth_server_to_server: {
                client_id: "test-client-id",
                client_secrets: ["test-secret-1"],
                technical_account_email: "test-technical-account@example.com",
                technical_account_id: "test-technical-account-id",
                scopes: ["test-scope1", "test-scope2"],
              },
            },
          ],
        },
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
