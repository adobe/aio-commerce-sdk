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
          updateRegistration: vi
            .fn()
            .mockResolvedValue({ id: "registration-123" }),
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
          updateRegistration: vi
            .fn()
            .mockResolvedValue({ id: "registration-456" }),
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
      expect(client1).toHaveProperty("getAllEventSubscriptions");
      expect(client1).toHaveProperty("updateEventingConfiguration");

      expect(client1).toBe(client2);
    });
  });
});
