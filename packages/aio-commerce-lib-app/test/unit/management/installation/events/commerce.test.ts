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

import { beforeEach, describe, expect, test, vi } from "vitest";

import { commerceEventsStep } from "#management/installation/events/commerce";
import * as helpers from "#management/installation/events/helpers";
import * as utils from "#management/installation/events/utils";
import { createMockLogger } from "#test/fixtures/installation";

import type { CommerceEventsConfig } from "#management/installation/events/commerce";
import type { EventsExecutionContext } from "#management/installation/events/utils";

describe("commerceEventsStep", () => {
  const mockLogger = createMockLogger();

  const mockCommerceEventsClient = {
    createEventSubscription: vi.fn(),
    getAllEventSubscriptions: vi.fn(),
  };

  const mockIoEventsClient = {
    createEventProvider: vi.fn(),
    getAllEventProviders: vi.fn(),
    createEventMetadataForProvider: vi.fn(),
  };

  const mockContext = {
    params: {},
    logger: mockLogger,
    get appCredentials() {
      return {
        consumerOrgId: "test-org",
        projectId: "test-project-id-1234",
        workspaceId: "test-workspace-id-123",
      };
    },
    get commerceEventsClient() {
      return mockCommerceEventsClient as any;
    },
    get ioEventsClient() {
      return mockIoEventsClient as any;
    },
  } as EventsExecutionContext;

  const mockConfig: CommerceEventsConfig = {
    metadata: {
      id: "test-app",
      displayName: "Test App",
      description: "Test application",
      version: "1.0.0",
    },
    eventing: {
      commerce: [
        {
          provider: {
            label: "Commerce Events Provider",
            description: "Provides commerce events",
          },
          events: [
            {
              name: "plugin.order_placed",
              label: "Order Placed",
              description: "Triggered when an order is placed",
              fields: ["order_id", "customer_id"],
              runtimeAction: "handle-order",
            },
            {
              name: "plugin.product_updated",
              label: "Product Updated",
              description: "Triggered when a product is updated",
              fields: ["product_id", "sku"],
              runtimeAction: "handle-product-update",
            },
          ],
        },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should successfully onboard commerce events", async () => {
    const getIoEventsExistingDataSpy = vi
      .spyOn(utils, "getIoEventsExistingData")
      .mockResolvedValue({
        providersWithMetadata: [],
      });

    const onboardIoEventsSpy = vi
      .spyOn(helpers, "onboardIoEvents")
      .mockResolvedValue({
        providerData: {
          id: "provider-123",
          instance_id: "test-app_commerce-events-provider",
          label: "Commerce Events Provider",
          description: "Provides commerce events",
          source: "urn:uuid:test-source",
          publisher: "test-publisher",
          provider_metadata: "test-metadata",
          event_delivery_format: "cloud_events",
        },
        eventsData: [
          {
            config: {
              name: "plugin.order_placed",
              label: "Order Placed",
              description: "Triggered when an order is placed",
              fields: ["order_id", "customer_id"],
              runtimeAction: "handle-order",
            } as any,
            data: {
              metadata: {
                event_code: "com.adobe.commerce.test-app.plugin.order_placed",
                label: "Order Placed",
                description: "Triggered when an order is placed",
              },
            },
          },
          {
            config: {
              name: "plugin.product_updated",
              label: "Product Updated",
              description: "Triggered when a product is updated",
              fields: ["product_id", "sku"],
              runtimeAction: "handle-product-update",
            } as any,
            data: {
              metadata: {
                event_code:
                  "com.adobe.commerce.test-app.plugin.product_updated",
                label: "Product Updated",
                description: "Triggered when a product is updated",
              },
            },
          },
        ],
      });

    const onboardCommerceSpy = vi
      .spyOn(helpers, "onboardCommerce")
      .mockResolvedValue([
        {
          name: "test-app.plugin.order_placed",
          parent: "plugin.order_placed",
          fields: [{ name: "order_id" }, { name: "customer_id" }],
          providerId: "test-app_commerce-events-provider",
        },
        {
          name: "test-app.plugin.product_updated",
          parent: "plugin.product_updated",
          fields: [{ name: "product_id" }, { name: "sku" }],
          providerId: "test-app_commerce-events-provider",
        },
      ]);

    const result = await commerceEventsStep.run(mockConfig, mockContext);

    expect(getIoEventsExistingDataSpy).toHaveBeenCalledOnce();
    expect(getIoEventsExistingDataSpy).toHaveBeenCalledWith(mockContext);

    expect(onboardIoEventsSpy).toHaveBeenCalledOnce();
    expect(onboardIoEventsSpy).toHaveBeenCalledWith(
      {
        context: mockContext,
        metadata: mockConfig.metadata,
        provider: mockConfig.eventing.commerce[0].provider,
        events: mockConfig.eventing.commerce[0].events,
        providerType: "dx_commerce_events",
      },
      { providersWithMetadata: [] },
    );

    expect(onboardCommerceSpy).toHaveBeenCalledOnce();
    expect(onboardCommerceSpy).toHaveBeenCalledWith({
      context: mockContext,
      metadata: mockConfig.metadata,
      provider: mockConfig.eventing.commerce[0].provider,
      data: expect.objectContaining({
        id: "provider-123",
        instance_id: "test-app_commerce-events-provider",
        events: expect.arrayContaining([
          expect.objectContaining({
            config: expect.objectContaining({
              name: "plugin.order_placed",
            }),
          }),
          expect.objectContaining({
            config: expect.objectContaining({
              name: "plugin.product_updated",
            }),
          }),
        ]),
      }),
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      provider: {
        config: mockConfig.eventing.commerce[0].provider,
        data: {
          id: "provider-123",
          instance_id: "test-app_commerce-events-provider",
          label: "Commerce Events Provider",
          description: "Provides commerce events",
          source: "urn:uuid:test-source",
          publisher: "test-publisher",
          provider_metadata: "test-metadata",
          event_delivery_format: "cloud_events",
          events: [
            {
              config: {
                name: "plugin.order_placed",
                label: "Order Placed",
                description: "Triggered when an order is placed",
                fields: ["order_id", "customer_id"],
                runtimeAction: "handle-order",
              },
              data: {
                metadata: {
                  event_code: "com.adobe.commerce.test-app.plugin.order_placed",
                  label: "Order Placed",
                  description: "Triggered when an order is placed",
                },
              },
              subscription: {
                name: "test-app.plugin.order_placed",
                parent: "plugin.order_placed",
                fields: [{ name: "order_id" }, { name: "customer_id" }],
                providerId: "test-app_commerce-events-provider",
              },
            },
            {
              config: {
                name: "plugin.product_updated",
                label: "Product Updated",
                description: "Triggered when a product is updated",
                fields: ["product_id", "sku"],
                runtimeAction: "handle-product-update",
              },
              data: {
                metadata: {
                  event_code:
                    "com.adobe.commerce.test-app.plugin.product_updated",
                  label: "Product Updated",
                  description: "Triggered when a product is updated",
                },
              },
              subscription: {
                name: "test-app.plugin.product_updated",
                parent: "plugin.product_updated",
                fields: [{ name: "product_id" }, { name: "sku" }],
                providerId: "test-app_commerce-events-provider",
              },
            },
          ],
        },
      },
    });
  });
});
