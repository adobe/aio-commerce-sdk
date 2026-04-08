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

import { eventingStep } from "#management/installation/events/branch";
import { commerceEventsStep } from "#management/installation/events/commerce";
import { createEventsStepContext } from "#management/installation/events/context";
import { externalEventsStep } from "#management/installation/events/external";
import {
  isBranchStep,
  isLeafStep,
} from "#management/installation/workflow/step";
import {
  configWithCommerceEventing,
  configWithExternalEventing,
  minimalValidConfig,
} from "#test/fixtures/config";
import { createMockEventingInstallationContext } from "#test/fixtures/eventing";

describe("events installation module", () => {
  describe("eventingStep branch step", () => {
    test("should be a branch step with correct name and meta", () => {
      expect(isBranchStep(eventingStep)).toBe(true);
      expect(eventingStep.name).toBe("eventing");
      expect(eventingStep.meta).toEqual({
        label: "Eventing",
        description:
          "Sets up the I/O Events and the Commerce events required by the application",
      });
    });

    test("should only run if eventing is defined", () => {
      expect.assert(eventingStep.when);

      expect(eventingStep.when(configWithCommerceEventing)).toBe(true);
      expect(eventingStep.when(configWithExternalEventing)).toBe(true);
      expect(eventingStep.when(minimalValidConfig)).toBe(false);
    });

    test("should have commerce and external leaf steps", () => {
      expect(eventingStep.children).toHaveLength(2);
      expect(eventingStep.children[0]).toBe(commerceEventsStep);
      expect(eventingStep.children[1]).toBe(externalEventsStep);
    });
  });

  describe("commerceEventsStep leaf step", () => {
    test("should be a leaf step with name and meta", () => {
      expect(isLeafStep(commerceEventsStep)).toBe(true);
      expect(commerceEventsStep.name).toBe("commerce");
      expect(commerceEventsStep.meta).toEqual({
        label: "Configure Commerce Events",
        description: "Sets up I/O Events for Adobe Commerce event sources",
      });
    });

    test("should only run if eventing.commerce is defined", () => {
      expect.assert(commerceEventsStep.when);

      expect(commerceEventsStep.when?.(configWithCommerceEventing)).toBe(true);

      expect(commerceEventsStep.when?.(configWithExternalEventing)).toBe(false);
      expect(commerceEventsStep.when?.(minimalValidConfig)).toBe(false);
    });

    test("should create entities", async () => {
      const mockContext = createMockEventingInstallationContext({
        // @ts-expect-error Invalid type for testing purposes
        params: {
          AIO_COMMERCE_API_BASE_URL: "https://api.commerce.adobe.com",
          AIO_COMMERCE_API_FLAVOR: "saas",
        },
        ioEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue({
            _embedded: { providers: [] },
          }),
          getAllRegistrations: vi.fn().mockResolvedValue({
            _embedded: { registrations: [] },
          }),
          createEventProvider: vi
            .fn()
            .mockResolvedValue({ id: "provider-123" }),
          createEventMetadataForProvider: vi
            .fn()
            .mockResolvedValue({ event_code: "test-event-code" }),
          createRegistration: vi
            .fn()
            .mockResolvedValue({ id: "registration-123" }),
          deleteRegistration: vi.fn().mockResolvedValue(undefined),
        },
        commerceEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue([]),
          getAllEventSubscriptions: vi.fn().mockResolvedValue([]),
          updateEventingConfiguration: vi.fn().mockResolvedValue({}),
          createEventProvider: vi
            .fn()
            .mockResolvedValue({ id: "commerce-provider-123" }),
          createEventSubscription: vi.fn().mockResolvedValue({
            name: "test-subscription",
            enabled: true,
          }),
        },
      });

      const result = await commerceEventsStep.run(
        configWithCommerceEventing,
        mockContext,
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      expect(
        mockContext.ioEventsClient.getAllEventProviders,
      ).toHaveBeenCalled();
      expect(
        mockContext.commerceEventsClient.getAllEventProviders,
      ).toHaveBeenCalled();
    });
  });

  describe("externalEventsStep leaf step", () => {
    test("should be a leaf step with name and meta", () => {
      expect(isLeafStep(externalEventsStep)).toBe(true);
      expect(externalEventsStep.name).toBe("external");
      expect(externalEventsStep.meta).toEqual({
        label: "Configure External Events",
        description: "Sets up I/O Events for external event sources",
      });
    });

    test("should only run if eventing.external is defined", () => {
      expect.assert(externalEventsStep.when);

      expect(externalEventsStep.when?.(configWithExternalEventing)).toBe(true);

      expect(externalEventsStep.when?.(configWithCommerceEventing)).toBe(false);
      expect(externalEventsStep.when?.(minimalValidConfig)).toBe(false);
    });

    test("should create entities", async () => {
      const mockContext = createMockEventingInstallationContext({
        ioEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue({
            _embedded: { providers: [] },
          }),
          getAllRegistrations: vi.fn().mockResolvedValue({
            _embedded: { registrations: [] },
          }),
          createEventProvider: vi
            .fn()
            .mockResolvedValue({ id: "provider-456" }),
          createEventMetadataForProvider: vi
            .fn()
            .mockResolvedValue({ event_code: "test-event-code" }),
          createRegistration: vi
            .fn()
            .mockResolvedValue({ id: "registration-456" }),
          deleteRegistration: vi.fn().mockResolvedValue(undefined),
        },
      });

      const result = await externalEventsStep.run(
        configWithExternalEventing,
        mockContext,
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      expect(
        mockContext.ioEventsClient.getAllEventProviders,
      ).toHaveBeenCalled();
    });
  });

  describe("commerceEventsStep uninstall handler", () => {
    test("should have an uninstall handler defined", () => {
      expect(commerceEventsStep.uninstall).toBeDefined();
    });

    test("should delete I/O Events registrations for each commerce provider", async () => {
      const instanceId =
        "test-app-commerce-events-commerce-events-provider-test-workspace-id";
      const mockDeleteRegistration = vi.fn().mockResolvedValue(undefined);

      const mockContext = createMockEventingInstallationContext({
        ioEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue({
            _embedded: {
              providers: [
                {
                  id: "io-provider-123",
                  instance_id: instanceId,
                  _embedded: { eventmetadata: [] },
                },
              ],
            },
          }),
          getAllRegistrations: vi.fn().mockResolvedValue({
            _embedded: {
              registrations: [
                {
                  id: "reg-1",
                  name: "Commerce Event Registration: Action (My Package)",
                  client_id: "test-client-id",
                  events_of_interest: [
                    {
                      provider_id: "io-provider-123",
                      event_code: "test.event",
                    },
                  ],
                  status: "VERIFIED",
                  type: "APP_REGISTRATION",
                  integration_status: "VERIFIED",
                  registration_id: "reg-1",
                  delivery_type: "webhook",
                },
              ],
            },
          }),
          deleteRegistration: mockDeleteRegistration,
        },
        commerceEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue([]),
          getAllEventSubscriptions: vi.fn().mockResolvedValue([]),
        },
      });

      await commerceEventsStep.uninstall?.(
        configWithCommerceEventing,
        mockContext,
      );

      expect(
        mockContext.ioEventsClient.getAllEventProviders,
      ).toHaveBeenCalled();
      expect(mockContext.ioEventsClient.getAllRegistrations).toHaveBeenCalled();
      expect(mockDeleteRegistration).toHaveBeenCalledWith(
        expect.objectContaining({ registrationId: "reg-1" }),
      );
    });

    test("should skip deletion when no provider found for instance ID", async () => {
      const mockDeleteRegistration = vi.fn().mockResolvedValue(undefined);

      const mockContext = createMockEventingInstallationContext({
        ioEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue({
            _embedded: { providers: [] },
          }),
          getAllRegistrations: vi.fn().mockResolvedValue({
            _embedded: { registrations: [] },
          }),
          deleteRegistration: mockDeleteRegistration,
        },
        commerceEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue([]),
          getAllEventSubscriptions: vi.fn().mockResolvedValue([]),
        },
      });

      await commerceEventsStep.uninstall?.(
        configWithCommerceEventing,
        mockContext,
      );

      expect(mockDeleteRegistration).not.toHaveBeenCalled();
    });

    test("should not throw when deleteRegistration fails (best-effort)", async () => {
      const instanceId =
        "test-app-commerce-events-commerce-events-provider-test-workspace-id";

      const mockContext = createMockEventingInstallationContext({
        ioEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue({
            _embedded: {
              providers: [
                {
                  id: "io-provider-123",
                  instance_id: instanceId,
                  _embedded: { eventmetadata: [] },
                },
              ],
            },
          }),
          getAllRegistrations: vi.fn().mockResolvedValue({
            _embedded: {
              registrations: [
                {
                  id: "reg-1",
                  name: "Commerce Event Registration",
                  client_id: "test-client-id",
                  events_of_interest: [
                    {
                      provider_id: "io-provider-123",
                      event_code: "test.event",
                    },
                  ],
                  status: "VERIFIED",
                  type: "APP_REGISTRATION",
                  integration_status: "VERIFIED",
                  registration_id: "reg-1",
                  delivery_type: "webhook",
                },
              ],
            },
          }),
          deleteRegistration: vi.fn().mockRejectedValue(new Error("API error")),
        },
        commerceEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue([]),
          getAllEventSubscriptions: vi.fn().mockResolvedValue([]),
        },
      });

      // Should not throw
      await expect(
        commerceEventsStep.uninstall?.(configWithCommerceEventing, mockContext),
      ).resolves.toBeUndefined();
    });

    test("should handle provider with zero registrations gracefully", async () => {
      const instanceId =
        "test-app-commerce-events-commerce-events-provider-test-workspace-id";
      const mockDeleteRegistration = vi.fn().mockResolvedValue(undefined);

      const mockContext = createMockEventingInstallationContext({
        ioEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue({
            _embedded: {
              providers: [
                {
                  id: "io-provider-123",
                  instance_id: instanceId,
                  _embedded: { eventmetadata: [] },
                },
              ],
            },
          }),
          getAllRegistrations: vi.fn().mockResolvedValue({
            _embedded: {
              registrations: [],
            },
          }),
          deleteRegistration: mockDeleteRegistration,
        },
        commerceEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue([]),
          getAllEventSubscriptions: vi.fn().mockResolvedValue([]),
        },
      });

      await commerceEventsStep.uninstall?.(
        configWithCommerceEventing,
        mockContext,
      );

      expect(mockDeleteRegistration).not.toHaveBeenCalled();
    });
  });

  describe("commerceEventsStep uninstall — Commerce subscription cleanup", () => {
    test("should unsubscribe matching Commerce event subscriptions", async () => {
      const mockDeleteEventSubscription = vi.fn().mockResolvedValue(undefined);
      // configWithCommerceEventing: metadata.id = "test-app-commerce-events", event name = "plugin.order_placed"
      // getNamespacedEvent => "test-app-commerce-events.plugin.order_placed"
      const expectedSubscriptionName =
        "test-app-commerce-events.plugin.order_placed";

      const mockContext = createMockEventingInstallationContext({
        ioEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue({
            _embedded: { providers: [] },
          }),
          getAllRegistrations: vi.fn().mockResolvedValue({
            _embedded: { registrations: [] },
          }),
        },
        commerceEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue([]),
          getAllEventSubscriptions: vi.fn().mockResolvedValue([
            {
              name: expectedSubscriptionName,
              parent: "plugin.order_placed",
              provider_id: "default",
              fields: [],
              rules: [],
              destination: "default",
              priority: false,
              hipaa_audit_required: false,
            },
          ]),
          deleteEventSubscription: mockDeleteEventSubscription,
        },
      });

      await commerceEventsStep.uninstall?.(
        configWithCommerceEventing,
        mockContext,
      );

      expect(mockDeleteEventSubscription).toHaveBeenCalledWith({
        name: expectedSubscriptionName,
      });
    });

    test("should skip Commerce subscriptions not found in the list (idempotent)", async () => {
      const mockDeleteEventSubscription = vi.fn().mockResolvedValue(undefined);

      const mockContext = createMockEventingInstallationContext({
        ioEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue({
            _embedded: { providers: [] },
          }),
          getAllRegistrations: vi.fn().mockResolvedValue({
            _embedded: { registrations: [] },
          }),
        },
        commerceEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue([]),
          getAllEventSubscriptions: vi.fn().mockResolvedValue([]),
          deleteEventSubscription: mockDeleteEventSubscription,
        },
      });

      await commerceEventsStep.uninstall?.(
        configWithCommerceEventing,
        mockContext,
      );

      expect(mockDeleteEventSubscription).not.toHaveBeenCalled();
    });

    test("should not throw when deleteEventSubscription fails (best-effort)", async () => {
      const mockContext = createMockEventingInstallationContext({
        ioEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue({
            _embedded: { providers: [] },
          }),
          getAllRegistrations: vi.fn().mockResolvedValue({
            _embedded: { registrations: [] },
          }),
        },
        commerceEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue([]),
          getAllEventSubscriptions: vi.fn().mockResolvedValue([
            {
              name: "test-app-commerce-events.plugin.order_placed",
              parent: "plugin.order_placed",
              provider_id: "default",
              fields: [],
              rules: [],
              destination: "default",
              priority: false,
              hipaa_audit_required: false,
            },
          ]),
          deleteEventSubscription: vi
            .fn()
            .mockRejectedValue(new Error("API error")),
        },
      });

      await expect(
        commerceEventsStep.uninstall?.(configWithCommerceEventing, mockContext),
      ).resolves.toBeUndefined();
    });
  });

  describe("commerceEventsStep uninstall — Commerce provider deletion", () => {
    const instanceId =
      "test-app-commerce-events-commerce-events-provider-test-workspace-id";

    test("should delete the Commerce event provider after subscriptions", async () => {
      const mockDeleteEventProvider = vi.fn().mockResolvedValue(undefined);

      const mockContext = createMockEventingInstallationContext({
        ioEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue({
            _embedded: { providers: [] },
          }),
          getAllRegistrations: vi.fn().mockResolvedValue({
            _embedded: { registrations: [] },
          }),
        },
        commerceEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue([
            {
              provider_id: "commerce-provider-uuid",
              instance_id: instanceId,
              label: "Commerce Events Provider",
            },
          ]),
          getAllEventSubscriptions: vi.fn().mockResolvedValue([]),
          deleteEventProvider: mockDeleteEventProvider,
        },
      });

      await commerceEventsStep.uninstall?.(
        configWithCommerceEventing,
        mockContext,
      );

      expect(mockDeleteEventProvider).toHaveBeenCalledWith({
        provider_id: "commerce-provider-uuid",
      });
    });

    test("should skip Commerce provider deletion when provider is not found (idempotent)", async () => {
      const mockDeleteEventProvider = vi.fn().mockResolvedValue(undefined);

      const mockContext = createMockEventingInstallationContext({
        ioEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue({
            _embedded: { providers: [] },
          }),
          getAllRegistrations: vi.fn().mockResolvedValue({
            _embedded: { registrations: [] },
          }),
        },
        commerceEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue([]),
          getAllEventSubscriptions: vi.fn().mockResolvedValue([]),
          deleteEventProvider: mockDeleteEventProvider,
        },
      });

      await commerceEventsStep.uninstall?.(
        configWithCommerceEventing,
        mockContext,
      );

      expect(mockDeleteEventProvider).not.toHaveBeenCalled();
    });

    test("should not throw when deleteEventProvider fails (best-effort)", async () => {
      const mockContext = createMockEventingInstallationContext({
        ioEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue({
            _embedded: { providers: [] },
          }),
          getAllRegistrations: vi.fn().mockResolvedValue({
            _embedded: { registrations: [] },
          }),
        },
        commerceEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue([
            {
              provider_id: "commerce-provider-uuid",
              instance_id: instanceId,
              label: "Commerce Events Provider",
            },
          ]),
          getAllEventSubscriptions: vi.fn().mockResolvedValue([]),
          deleteEventProvider: vi
            .fn()
            .mockRejectedValue(new Error("provider API error")),
        },
      });

      await expect(
        commerceEventsStep.uninstall?.(configWithCommerceEventing, mockContext),
      ).resolves.toBeUndefined();
    });
  });

  describe("commerceEventsStep uninstall — I/O Events metadata and provider cleanup", () => {
    test("should delete event metadata and provider after registrations", async () => {
      const instanceId =
        "test-app-commerce-events-commerce-events-provider-test-workspace-id";
      const mockDeleteRegistration = vi.fn().mockResolvedValue(undefined);
      const mockDeleteEventMetadata = vi.fn().mockResolvedValue(undefined);
      const mockDeleteEventProvider = vi.fn().mockResolvedValue(undefined);

      const mockContext = createMockEventingInstallationContext({
        ioEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue({
            _embedded: {
              providers: [
                {
                  id: "io-provider-123",
                  instance_id: instanceId,
                  _embedded: {
                    eventmetadata: [
                      {
                        event_code: "test-event-code",
                        label: "Test",
                        description: "Test event",
                      },
                    ],
                  },
                },
              ],
            },
          }),
          getAllRegistrations: vi.fn().mockResolvedValue({
            _embedded: { registrations: [] },
          }),
          deleteRegistration: mockDeleteRegistration,
          deleteEventMetadataForProvider: mockDeleteEventMetadata,
          deleteEventProvider: mockDeleteEventProvider,
        },
        commerceEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue([]),
          getAllEventSubscriptions: vi.fn().mockResolvedValue([]),
        },
      });

      await commerceEventsStep.uninstall?.(
        configWithCommerceEventing,
        mockContext,
      );

      expect(mockDeleteEventMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          providerId: "io-provider-123",
          eventCode: "test-event-code",
        }),
      );
      expect(mockDeleteEventProvider).toHaveBeenCalledWith(
        expect.objectContaining({ providerId: "io-provider-123" }),
      );
    });

    test("should not throw when deleteEventMetadataForProvider fails (best-effort)", async () => {
      const instanceId =
        "test-app-commerce-events-commerce-events-provider-test-workspace-id";

      const mockContext = createMockEventingInstallationContext({
        ioEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue({
            _embedded: {
              providers: [
                {
                  id: "io-provider-123",
                  instance_id: instanceId,
                  _embedded: {
                    eventmetadata: [
                      {
                        event_code: "test-event-code",
                        label: "Test",
                        description: "Test",
                      },
                    ],
                  },
                },
              ],
            },
          }),
          getAllRegistrations: vi.fn().mockResolvedValue({
            _embedded: { registrations: [] },
          }),
          deleteEventMetadataForProvider: vi
            .fn()
            .mockRejectedValue(new Error("metadata API error")),
          deleteEventProvider: vi.fn().mockResolvedValue(undefined),
        },
        commerceEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue([]),
          getAllEventSubscriptions: vi.fn().mockResolvedValue([]),
        },
      });

      await expect(
        commerceEventsStep.uninstall?.(configWithCommerceEventing, mockContext),
      ).resolves.toBeUndefined();
    });

    test("should not throw when deleteEventProvider fails (best-effort)", async () => {
      const instanceId =
        "test-app-commerce-events-commerce-events-provider-test-workspace-id";

      const mockContext = createMockEventingInstallationContext({
        ioEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue({
            _embedded: {
              providers: [
                {
                  id: "io-provider-123",
                  instance_id: instanceId,
                  _embedded: { eventmetadata: [] },
                },
              ],
            },
          }),
          getAllRegistrations: vi.fn().mockResolvedValue({
            _embedded: { registrations: [] },
          }),
          deleteEventProvider: vi
            .fn()
            .mockRejectedValue(new Error("provider API error")),
        },
        commerceEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue([]),
          getAllEventSubscriptions: vi.fn().mockResolvedValue([]),
        },
      });

      await expect(
        commerceEventsStep.uninstall?.(configWithCommerceEventing, mockContext),
      ).resolves.toBeUndefined();
    });
  });

  describe("externalEventsStep uninstall handler", () => {
    test("should have an uninstall handler defined", () => {
      expect(externalEventsStep.uninstall).toBeDefined();
    });

    test("should delete I/O Events registrations for each external provider", async () => {
      const instanceId =
        "test-app-external-events-external-events-provider-test-workspace-id";
      const mockDeleteRegistration = vi.fn().mockResolvedValue(undefined);

      const mockContext = createMockEventingInstallationContext({
        ioEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue({
            _embedded: {
              providers: [
                {
                  id: "io-provider-456",
                  instance_id: instanceId,
                  _embedded: { eventmetadata: [] },
                },
              ],
            },
          }),
          getAllRegistrations: vi.fn().mockResolvedValue({
            _embedded: {
              registrations: [
                {
                  id: "reg-2",
                  name: "External Event Registration",
                  client_id: "test-client-id",
                  events_of_interest: [
                    {
                      provider_id: "io-provider-456",
                      event_code: "test.event",
                    },
                  ],
                  status: "VERIFIED",
                  type: "APP_REGISTRATION",
                  integration_status: "VERIFIED",
                  registration_id: "reg-2",
                  delivery_type: "webhook",
                },
              ],
            },
          }),
          deleteRegistration: mockDeleteRegistration,
        },
      });

      await externalEventsStep.uninstall?.(
        configWithExternalEventing,
        mockContext,
      );

      expect(
        mockContext.ioEventsClient.getAllEventProviders,
      ).toHaveBeenCalled();
      expect(mockContext.ioEventsClient.getAllRegistrations).toHaveBeenCalled();
      expect(mockDeleteRegistration).toHaveBeenCalledWith(
        expect.objectContaining({ registrationId: "reg-2" }),
      );
    });

    test("should skip deletion when no provider found for instance ID", async () => {
      const mockDeleteRegistration = vi.fn().mockResolvedValue(undefined);

      const mockContext = createMockEventingInstallationContext({
        ioEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue({
            _embedded: { providers: [] },
          }),
          getAllRegistrations: vi.fn().mockResolvedValue({
            _embedded: { registrations: [] },
          }),
          deleteRegistration: mockDeleteRegistration,
        },
      });

      await externalEventsStep.uninstall?.(
        configWithExternalEventing,
        mockContext,
      );

      expect(mockDeleteRegistration).not.toHaveBeenCalled();
    });

    test("should not throw when deleteRegistration fails (best-effort)", async () => {
      const instanceId =
        "test-app-external-events-external-events-provider-test-workspace-id";

      const mockContext = createMockEventingInstallationContext({
        ioEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue({
            _embedded: {
              providers: [
                {
                  id: "io-provider-456",
                  instance_id: instanceId,
                  _embedded: { eventmetadata: [] },
                },
              ],
            },
          }),
          getAllRegistrations: vi.fn().mockResolvedValue({
            _embedded: {
              registrations: [
                {
                  id: "reg-2",
                  name: "External Event Registration",
                  client_id: "test-client-id",
                  events_of_interest: [
                    {
                      provider_id: "io-provider-456",
                      event_code: "test.event",
                    },
                  ],
                  status: "VERIFIED",
                  type: "APP_REGISTRATION",
                  integration_status: "VERIFIED",
                  registration_id: "reg-2",
                  delivery_type: "webhook",
                },
              ],
            },
          }),
          deleteRegistration: vi.fn().mockRejectedValue(new Error("API error")),
          deleteEventProvider: vi.fn().mockResolvedValue(undefined),
        },
      });

      // Should not throw
      await expect(
        externalEventsStep.uninstall?.(configWithExternalEventing, mockContext),
      ).resolves.toBeUndefined();
    });

    test("should delete event metadata and provider after registrations for external provider", async () => {
      const instanceId =
        "test-app-external-events-external-events-provider-test-workspace-id";
      const mockDeleteRegistration = vi.fn().mockResolvedValue(undefined);
      const mockDeleteEventMetadata = vi.fn().mockResolvedValue(undefined);
      const mockDeleteEventProvider = vi.fn().mockResolvedValue(undefined);

      const mockContext = createMockEventingInstallationContext({
        ioEventsClient: {
          getAllEventProviders: vi.fn().mockResolvedValue({
            _embedded: {
              providers: [
                {
                  id: "io-provider-456",
                  instance_id: instanceId,
                  _embedded: {
                    eventmetadata: [
                      {
                        event_code: "ext-event-code",
                        label: "Ext",
                        description: "External event",
                      },
                    ],
                  },
                },
              ],
            },
          }),
          getAllRegistrations: vi.fn().mockResolvedValue({
            _embedded: { registrations: [] },
          }),
          deleteRegistration: mockDeleteRegistration,
          deleteEventMetadataForProvider: mockDeleteEventMetadata,
          deleteEventProvider: mockDeleteEventProvider,
        },
      });

      await externalEventsStep.uninstall?.(
        configWithExternalEventing,
        mockContext,
      );

      expect(mockDeleteEventMetadata).toHaveBeenCalledWith(
        expect.objectContaining({
          providerId: "io-provider-456",
          eventCode: "ext-event-code",
        }),
      );
      expect(mockDeleteEventProvider).toHaveBeenCalledWith(
        expect.objectContaining({ providerId: "io-provider-456" }),
      );
    });
  });

  describe("createEventsStepContext", () => {
    test("should create lazy ioEventsClient", () => {
      const mockContext = createMockEventingInstallationContext();
      const context = createEventsStepContext(mockContext);

      expect(context).toHaveProperty("ioEventsClient");

      const client1 = context.ioEventsClient;
      const client2 = context.ioEventsClient;

      expect(client1).toBeDefined();
      expect(client1).toHaveProperty("createEventProvider");
      expect(client1).toHaveProperty("createEventMetadataForProvider");
      expect(client1).toHaveProperty("createRegistration");
      expect(client1).toHaveProperty("getAllEventProviders");
      expect(client1).toHaveProperty("getAllRegistrations");

      expect(client1).toBe(client2);
    });

    test("should create lazy commerceEventsClient", () => {
      const mockContext = createMockEventingInstallationContext();
      const context = createEventsStepContext(mockContext);
      expect(context).toHaveProperty("commerceEventsClient");

      const client1 = context.commerceEventsClient;
      const client2 = context.commerceEventsClient;

      expect(client1).toBeDefined();
      expect(client1).toHaveProperty("createEventProvider");
      expect(client1).toHaveProperty("getAllEventProviders");
      expect(client1).toHaveProperty("createEventSubscription");
      expect(client1).toHaveProperty("deleteEventSubscription");
      expect(client1).toHaveProperty("getAllEventSubscriptions");
      expect(client1).toHaveProperty("updateEventingConfiguration");

      expect(client1).toBe(client2);
    });

    test("should expose deleteEventMetadataForProvider and deleteEventProvider on ioEventsClient", () => {
      const mockContext = createMockEventingInstallationContext();
      const context = createEventsStepContext(mockContext);

      const client = context.ioEventsClient;
      expect(client).toHaveProperty("deleteEventMetadataForProvider");
      expect(client).toHaveProperty("deleteEventProvider");
    });
  });
});
