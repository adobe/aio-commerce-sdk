import { vi } from "vitest";

import { createMockInstallationContext } from "./installation";

export const DEFAULT_TEST_METADATA = {
  id: "test-app",
  displayName: "Test App",
  description: "A test application",
  version: "1.0.0",
} as const;

export function createCommerceEventConfig(
  name: string,
  overrides?: Partial<{
    label: string;
    description: string;
    runtimeActions: string[];
    fields: Array<{ name: string }>;
  }>,
) {
  return {
    metadata: DEFAULT_TEST_METADATA,
    eventing: {
      commerce: [
        {
          provider: {
            label: "Commerce Provider",
            description: "Commerce events",
          },
          events: [
            {
              name,
              label: overrides?.label ?? "My Event",
              fields: overrides?.fields ?? [{ name: "field" }],
              runtimeActions: overrides?.runtimeActions ?? [
                "my-package/action",
              ],
              description: overrides?.description ?? "Plugin event",
            },
          ],
        },
      ],
    },
  };
}

import type {
  CustomAdobeIoEventsApiClient,
  CustomCommerceEventsApiClient,
  EventsExecutionContext,
} from "#management/installation/events/context";

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
  } satisfies CustomCommerceEventsApiClient;
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
  } satisfies Partial<CustomAdobeIoEventsApiClient>;
}

/** Creates a mock {@link EventsExecutionContext} for testing. */
export function createMockEventingInstallationContext({
  commerceEventsClient,
  ioEventsClient,
  ...installationOverrides
}: Partial<EventsExecutionContext> = {}): EventsExecutionContext {
  const mockInstallationContext = createMockInstallationContext(
    installationOverrides,
  );

  return {
    ...mockInstallationContext,

    get commerceEventsClient() {
      return createMockCommerceEventsClient(commerceEventsClient);
    },

    get ioEventsClient() {
      return createMockIoEventsClient(ioEventsClient);
    },
  };
}
