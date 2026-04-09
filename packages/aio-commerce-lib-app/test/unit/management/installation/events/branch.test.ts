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

import { describe, expect, test } from "vitest";

import { eventingStep } from "#management/installation/events/branch";
import { commerceEventsStep } from "#management/installation/events/commerce";
import { createEventsStepContext } from "#management/installation/events/context";
import { externalEventsStep } from "#management/installation/events/external";
import { isBranchStep } from "#management/installation/workflow/step";
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
