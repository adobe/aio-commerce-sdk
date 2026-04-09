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

import { commerceEventsStep } from "#management/installation/events/commerce";
import { isLeafStep } from "#management/installation/workflow/step";
import {
  configWithCommerceEventing,
  configWithExternalEventing,
  createConfigWithTwoCommerceEventingSources,
  minimalValidConfig,
} from "#test/fixtures/config";
import {
  createMockCommerceEventProvider,
  createMockEventingInstallationContext,
  createMockIoEventMetadataHalModel,
  createMockIoEventProviderHalModel,
  createMockIoEventRegistrationHalModel,
} from "#test/fixtures/eventing";

describe("commerceEventsStep leaf step", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

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

    expect(commerceEventsStep.when(configWithCommerceEventing)).toBe(true);
    expect(commerceEventsStep.when(configWithExternalEventing)).toBe(false);
    expect(commerceEventsStep.when(minimalValidConfig)).toBe(false);
  });

  test("should configure Commerce Eventing only once when multiple commerce sources are installed", async () => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");

    const context = createMockEventingInstallationContext({
      appData: {
        orgName: "Test Org! #42",
        projectName: "Test Project! #7",
      },
    });
    const { ioEventsClient, commerceEventsClient } = context;

    const configWithTwoCommerceSources =
      createConfigWithTwoCommerceEventingSources();

    vi.mocked(ioEventsClient.getAllEventProviders).mockResolvedValue({
      _links: { self: { href: "/providers" } },
      _embedded: { providers: [] },
    });
    vi.mocked(ioEventsClient.getAllRegistrations).mockResolvedValue({
      _links: { self: { href: "/registrations" } },
      _embedded: { registrations: [] },
    });
    vi.mocked(commerceEventsClient.getAllEventProviders).mockResolvedValue([]);
    vi.mocked(commerceEventsClient.getAllEventSubscriptions).mockResolvedValue(
      [],
    );

    vi.mocked(ioEventsClient.createEventProvider)
      .mockResolvedValueOnce(
        createMockIoEventProviderHalModel({
          id: "io-provider-commerce-1",
          label:
            configWithTwoCommerceSources.eventing.commerce[0].provider.label,
          description:
            configWithTwoCommerceSources.eventing.commerce[0].provider
              .description,
          instance_id: "test-app-commerce-events-provider-test-workspace-id",
          provider_metadata: "dx_commerce_events",
        }),
      )
      .mockResolvedValueOnce(
        createMockIoEventProviderHalModel({
          id: "io-provider-commerce-2",
          label:
            configWithTwoCommerceSources.eventing.commerce[1].provider.label,
          description:
            configWithTwoCommerceSources.eventing.commerce[1].provider
              .description,
          instance_id:
            "test-app-second-commerce-events-provider-test-workspace-id",
          provider_metadata: "dx_commerce_events",
        }),
      );

    vi.mocked(ioEventsClient.createEventMetadataForProvider)
      .mockResolvedValueOnce(
        createMockIoEventMetadataHalModel({
          label: "Order Placed",
          event_code:
            "com.adobe.commerce.test-app-commerce-events.plugin.order_placed",
        }),
      )
      .mockResolvedValueOnce(
        createMockIoEventMetadataHalModel({
          label: "Order Cancelled",
          event_code:
            "com.adobe.commerce.test-app-commerce-events.plugin.order_cancelled",
        }),
      );

    vi.mocked(ioEventsClient.createRegistration)
      .mockResolvedValueOnce(
        createMockIoEventRegistrationHalModel({
          id: "registration-1",
          name: "Commerce Event Registration: Handle Order (My Package)",
        }),
      )
      .mockResolvedValueOnce(
        createMockIoEventRegistrationHalModel({
          id: "registration-2",
          name: "Commerce Event Registration: Handle Order Cancelled (My Package)",
        }),
      );

    vi.mocked(
      commerceEventsClient.updateEventingConfiguration,
    ).mockResolvedValue(true);

    vi.mocked(commerceEventsClient.createEventProvider)
      .mockResolvedValueOnce(
        createMockCommerceEventProvider({
          id: "commerce-provider-1",
          provider_id: "io-provider-commerce-1",
          label:
            configWithTwoCommerceSources.eventing.commerce[0].provider.label,
          description:
            configWithTwoCommerceSources.eventing.commerce[0].provider
              .description,
          instance_id: "test-app-commerce-events-provider-test-workspace-id",
        }),
      )
      .mockResolvedValueOnce(
        createMockCommerceEventProvider({
          id: "commerce-provider-2",
          provider_id: "io-provider-commerce-2",
          label:
            configWithTwoCommerceSources.eventing.commerce[1].provider.label,
          description:
            configWithTwoCommerceSources.eventing.commerce[1].provider
              .description,
          instance_id:
            "test-app-second-commerce-events-provider-test-workspace-id",
        }),
      );

    vi.mocked(commerceEventsClient.createEventSubscription).mockResolvedValue(
      undefined,
    );

    const result = await commerceEventsStep.run(
      configWithTwoCommerceSources,
      context,
    );

    expect(result).toHaveLength(2);
    expect(
      commerceEventsClient.updateEventingConfiguration,
    ).toHaveBeenCalledTimes(1);
    expect(
      commerceEventsClient.updateEventingConfiguration,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        instance_id: "test-app-commerce-events-provider-test-workspace-id",
        enabled: true,
        merchant_id: "test_org_42",
        environment_id: "test_project_7",
        workspace_configuration: expect.any(String),
      }),
    );
    expect(ioEventsClient.createEventProvider).toHaveBeenCalledTimes(2);
    expect(commerceEventsClient.createEventProvider).toHaveBeenCalledTimes(2);
    expect(commerceEventsClient.createEventSubscription).toHaveBeenCalledTimes(
      2,
    );
  });
});
