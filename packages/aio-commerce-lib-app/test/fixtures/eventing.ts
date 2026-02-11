import { vi } from "vitest";

import { createMockInstallationContext } from "./installation";

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
    createEventSubscription: vi.fn(overrides?.createEventSubscription),
    getAllEventSubscriptions: vi.fn(overrides?.getAllEventSubscriptions),
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
