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

const { mockGetSystemConfigByKey } = vi.hoisted(() => ({
  mockGetSystemConfigByKey: vi.fn(),
}));

vi.mock("@adobe/aio-commerce-lib-config", () => ({
  getSystemConfigByKey: mockGetSystemConfigByKey,
}));

import {
  EventNotFoundError,
  EventsDataNotInitializedError,
  ProviderNotFoundError,
} from "#lib/errors";
import { publishEvent, resolveIoEventCode } from "#lib/events";

import type { AdobeIoEventsApiClient } from "@adobe/aio-commerce-lib-events/io-events";

function createMockClient() {
  return {
    publishEvent: vi.fn().mockResolvedValue(undefined),
  } as unknown as AdobeIoEventsApiClient;
}

const storedData = {
  providers: {
    "order-events": {
      events: {
        "order.created": {
          code: "com.adobe.commerce.order.created",
          isPhiData: false,
        },
      },
      id: "provider-uuid-123",
    },
  },
};

describe("publishEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("resolves provider and event and delegates to the client", async () => {
    mockGetSystemConfigByKey.mockResolvedValue(storedData);
    const client = createMockClient();

    await publishEvent({
      client,
      event: "order.created",
      payload: { orderId: "100000123", total: 149.99 },
      provider: "order-events",
    });

    expect(client.publishEvent).toHaveBeenCalledWith({
      eventCode: "com.adobe.commerce.order.created",
      isPhiData: false,
      payload: { orderId: "100000123", total: 149.99 },
      providerId: "provider-uuid-123",
    });
  });

  test("reads isPhiData from stored data and forwards it to the client", async () => {
    const storedDataWithPhi = {
      providers: {
        "order-events": {
          events: {
            "order.created": {
              code: "com.adobe.commerce.order.created",
              isPhiData: true,
            },
          },
          id: "provider-uuid-123",
        },
      },
    };
    mockGetSystemConfigByKey.mockResolvedValue(storedDataWithPhi);
    const client = createMockClient();

    await publishEvent({
      client,
      event: "order.created",
      payload: { orderId: "100000123", total: 149.99 },
      provider: "order-events",
    });

    expect(client.publishEvent).toHaveBeenCalledWith({
      eventCode: "com.adobe.commerce.order.created",
      isPhiData: true,
      payload: { orderId: "100000123", total: 149.99 },
      providerId: "provider-uuid-123",
    });
  });

  test("throws EventsDataNotInitializedError when no stored data exists", async () => {
    mockGetSystemConfigByKey.mockResolvedValue(null);
    const client = createMockClient();

    await expect(
      publishEvent({
        client,
        event: "order.created",
        payload: {},
        provider: "order-events",
      }),
    ).rejects.toBeInstanceOf(EventsDataNotInitializedError);

    expect(client.publishEvent).not.toHaveBeenCalled();
  });

  test("throws ProviderNotFoundError when the provider key is unknown", async () => {
    mockGetSystemConfigByKey.mockResolvedValue(storedData);
    const client = createMockClient();

    await expect(
      publishEvent({
        client,
        event: "order.created",
        payload: {},
        provider: "unknown-provider",
      }),
    ).rejects.toBeInstanceOf(ProviderNotFoundError);

    expect(client.publishEvent).not.toHaveBeenCalled();
  });

  test("throws EventNotFoundError when the event name is unknown", async () => {
    mockGetSystemConfigByKey.mockResolvedValue(storedData);
    const client = createMockClient();

    await expect(
      publishEvent({
        client,
        event: "order.updated",
        payload: {},
        provider: "order-events",
      }),
    ).rejects.toBeInstanceOf(EventNotFoundError);

    expect(client.publishEvent).not.toHaveBeenCalled();
  });
});

describe("resolveIoEventCode", () => {
  test("prefixes with com.adobe.commerce. for commerce provider type", () => {
    expect(
      resolveIoEventCode("my-app", "observer.order_placed", "commerce"),
    ).toBe("com.adobe.commerce.my_app.observer.order_placed");
  });

  test("does not prefix for external provider type", () => {
    expect(resolveIoEventCode("my-app", "webhook.received", "external")).toBe(
      "my_app.webhook.received",
    );
  });

  test("sanitizes and lowercases the app id", () => {
    expect(
      resolveIoEventCode("My App!", "observer.order_placed", "commerce"),
    ).toBe("com.adobe.commerce.my_app_.observer.order_placed");
  });
});
