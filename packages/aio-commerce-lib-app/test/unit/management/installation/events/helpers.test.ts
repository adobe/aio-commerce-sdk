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

import { onboardCommerceSubscriptions } from "#management/installation/events/helpers";
import { createMockLogger } from "#test/fixtures/installation";

import type { CommerceEventSubscriptionManyResponse } from "@adobe/aio-commerce-lib-events/commerce";
import type { OnboardCommerceEventSubscriptionParams } from "#management/installation/events/types";
import type { EventsExecutionContext } from "#management/installation/events/utils";

describe("onboardCommerceSubscriptions", () => {
  const mockLogger = createMockLogger();

  const mockCommerceEventsClient = {
    createEventSubscription: vi.fn(),
    updateEventSubscription: vi.fn(),
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
      return {} as any;
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
            providerType: "dx_commerce_events",
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
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("should create a new subscription when no existing subscriptions exist", async () => {
    const existingSubscriptions: CommerceEventSubscriptionManyResponse = [];

    mockCommerceEventsClient.createEventSubscription.mockResolvedValue(
      undefined,
    );

    const result = await onboardCommerceSubscriptions(
      baseParams,
      existingSubscriptions,
    );

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
    expect(
      mockCommerceEventsClient.updateEventSubscription,
    ).not.toHaveBeenCalled();
    expect(result.subscriptionsData).toHaveLength(1);
    expect(result.subscriptionsData[0]).toEqual({
      name: "test-app.plugin.order_placed",
      parent: "plugin.order_placed",
      fields: [{ name: "order_id" }, { name: "customer_id" }],
      providerId: "test-app_commerce-events-provider",
    });
  });

  test("should update an existing subscription when it exists and differs", async () => {
    const existingSubscriptions: CommerceEventSubscriptionManyResponse = [
      {
        name: "test-app.plugin.order_placed",
        parent: "plugin.order_placed",
        provider_id: "test-app_commerce-events-provider",
        fields: [{ name: "order_id" }],
        rules: [],
        destination: "default",
        priority: false,
        hipaa_audit_required: false,
      },
    ];

    mockCommerceEventsClient.updateEventSubscription.mockResolvedValue(
      undefined,
    );

    const result = await onboardCommerceSubscriptions(
      baseParams,
      existingSubscriptions,
    );

    expect(
      mockCommerceEventsClient.updateEventSubscription,
    ).toHaveBeenCalledTimes(1);
    expect(
      mockCommerceEventsClient.updateEventSubscription,
    ).toHaveBeenCalledWith({
      name: "test-app.plugin.order_placed",
      parent: "plugin.order_placed",
      fields: [{ name: "order_id" }, { name: "customer_id" }],
      providerId: "test-app_commerce-events-provider",
    });
    expect(
      mockCommerceEventsClient.createEventSubscription,
    ).not.toHaveBeenCalled();
    expect(result.subscriptionsData).toHaveLength(1);
  });

  test("should create one subscription and update another when processing multiple events", async () => {
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
              providerType: "dx_commerce_events",
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
              providerType: "dx_commerce_events",
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
      },
    };

    const existingSubscriptions: CommerceEventSubscriptionManyResponse = [
      {
        name: "test-app.plugin.product_updated",
        parent: "plugin.product_updated",
        provider_id: "test-app_commerce-events-provider",
        fields: [{ name: "product_id" }],
        rules: [],
        destination: "default",
        priority: false,
        hipaa_audit_required: false,
      },
    ];

    mockCommerceEventsClient.createEventSubscription.mockResolvedValue(
      undefined,
    );
    mockCommerceEventsClient.updateEventSubscription.mockResolvedValue(
      undefined,
    );

    const result = await onboardCommerceSubscriptions(
      paramsWithTwoEvents,
      existingSubscriptions,
    );

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

    expect(
      mockCommerceEventsClient.updateEventSubscription,
    ).toHaveBeenCalledTimes(1);
    expect(
      mockCommerceEventsClient.updateEventSubscription,
    ).toHaveBeenCalledWith({
      name: "test-app.plugin.product_updated",
      parent: "plugin.product_updated",
      fields: [{ name: "product_id" }, { name: "sku" }],
      providerId: "test-app_commerce-events-provider",
    });

    expect(result.subscriptionsData).toHaveLength(2);
  });
});
