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

import { onboardCommerce } from "#management/installation/events/helpers";
import { createMockLogger } from "#test/fixtures/installation";

import type { OnboardCommerceEventSubscriptionParams } from "#management/installation/events/types";
import type { EventsExecutionContext } from "#management/installation/events/utils";

describe("onboardCommerce", () => {
  const mockLogger = createMockLogger();

  const mockCommerceEventsClient = {
    createEventSubscription: vi.fn(),
    getAllEventSubscriptions: vi.fn(),
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
      return {};
    },
  } as EventsExecutionContext;

  const baseParams: OnboardCommerceEventSubscriptionParams = {
    context: mockContext,
    metadata: {
      id: "test-app",
      displayName: "Test App",
      description: "Test application",
      version: "1.0.0",
    },
    provider: {
      label: "Commerce Events Provider",
      description: "Provides commerce events",
    },
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
        },
      ],
    } as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should create a single subscription", async () => {
    mockCommerceEventsClient.getAllEventSubscriptions.mockResolvedValue([]);
    mockCommerceEventsClient.createEventSubscription.mockResolvedValue(
      undefined,
    );

    const result = await onboardCommerce(baseParams);

    expect(
      mockCommerceEventsClient.createEventSubscription,
    ).toHaveBeenCalledTimes(1);
    expect(
      mockCommerceEventsClient.createEventSubscription,
    ).toHaveBeenCalledWith({
      name: "test-app.plugin.order_placed",
      parent: "plugin.order_placed",
      fields: [{ name: "order_id" }, { name: "customer_id" }],
      providerId: "test-app_commerce-events-provider",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "test-app.plugin.order_placed",
      parent: "plugin.order_placed",
      fields: [{ name: "order_id" }, { name: "customer_id" }],
      providerId: "test-app_commerce-events-provider",
    });
  });

  test("should create multiple subscriptions for multiple events", async () => {
    const paramsWithTwoEvents: OnboardCommerceEventSubscriptionParams = {
      ...baseParams,
      data: {
        ...baseParams.data,
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
          },
        ],
      } as any,
    };

    mockCommerceEventsClient.getAllEventSubscriptions.mockResolvedValue([]);
    mockCommerceEventsClient.createEventSubscription.mockResolvedValue(
      undefined,
    );

    const result = await onboardCommerce(paramsWithTwoEvents);

    expect(
      mockCommerceEventsClient.createEventSubscription,
    ).toHaveBeenCalledTimes(2);
    expect(
      mockCommerceEventsClient.createEventSubscription,
    ).toHaveBeenNthCalledWith(1, {
      name: "test-app.plugin.order_placed",
      parent: "plugin.order_placed",
      fields: [{ name: "order_id" }, { name: "customer_id" }],
      providerId: "test-app_commerce-events-provider",
    });
    expect(
      mockCommerceEventsClient.createEventSubscription,
    ).toHaveBeenNthCalledWith(2, {
      name: "test-app.plugin.product_updated",
      parent: "plugin.product_updated",
      fields: [{ name: "product_id" }, { name: "sku" }],
      providerId: "test-app_commerce-events-provider",
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: "test-app.plugin.order_placed",
      parent: "plugin.order_placed",
      fields: [{ name: "order_id" }, { name: "customer_id" }],
      providerId: "test-app_commerce-events-provider",
    });
    expect(result[1]).toEqual({
      name: "test-app.plugin.product_updated",
      parent: "plugin.product_updated",
      fields: [{ name: "product_id" }, { name: "sku" }],
      providerId: "test-app_commerce-events-provider",
    });
  });

  test("should skip creating subscriptions that already exist", async () => {
    const paramsWithTwoEvents: OnboardCommerceEventSubscriptionParams = {
      ...baseParams,
      data: {
        ...baseParams.data,
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
          },
        ],
      } as any,
    };

    mockCommerceEventsClient.getAllEventSubscriptions.mockResolvedValue([
      {
        name: "test-app.plugin.order_placed",
        parent: "plugin.order_placed",
        provider_id: "test-app_commerce-events-provider",
        fields: [{ name: "order_id" }, { name: "customer_id" }],
        rules: [],
        destination: "default",
        priority: false,
        hipaa_audit_required: false,
      },
    ]);

    mockCommerceEventsClient.createEventSubscription.mockResolvedValue(
      undefined,
    );

    const result = await onboardCommerce(paramsWithTwoEvents);

    expect(
      mockCommerceEventsClient.createEventSubscription,
    ).toHaveBeenCalledTimes(1);
    expect(
      mockCommerceEventsClient.createEventSubscription,
    ).toHaveBeenCalledWith({
      name: "test-app.plugin.product_updated",
      parent: "plugin.product_updated",
      fields: [{ name: "product_id" }, { name: "sku" }],
      providerId: "test-app_commerce-events-provider",
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: "test-app.plugin.order_placed",
      parent: "plugin.order_placed",
      fields: [{ name: "order_id" }, { name: "customer_id" }],
      providerId: "test-app_commerce-events-provider",
    });
    expect(result[1]).toEqual({
      name: "test-app.plugin.product_updated",
      parent: "plugin.product_updated",
      fields: [{ name: "product_id" }, { name: "sku" }],
      providerId: "test-app_commerce-events-provider",
    });
  });

  test("should not create any subscriptions when all already exist", async () => {
    // Mock that the subscription already exists
    mockCommerceEventsClient.getAllEventSubscriptions.mockResolvedValue([
      {
        name: "test-app.plugin.order_placed",
        parent: "plugin.order_placed",
        provider_id: "test-app_commerce-events-provider",
        fields: [{ name: "order_id" }, { name: "customer_id" }],
        rules: [],
        destination: "default",
        priority: false,
        hipaa_audit_required: false,
      },
    ]);

    const result = await onboardCommerce(baseParams);

    expect(
      mockCommerceEventsClient.createEventSubscription,
    ).not.toHaveBeenCalled();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "test-app.plugin.order_placed",
      parent: "plugin.order_placed",
      fields: [{ name: "order_id" }, { name: "customer_id" }],
      providerId: "test-app_commerce-events-provider",
    });
  });
});
