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

import { publishEvent } from "#access/events";
import {
  EventNotFoundError,
  EventsDataNotInitializedError,
  ProviderNotFoundError,
} from "#errors/publish-event-errors";

import type { AdobeIoEventsApiClient } from "@adobe/aio-commerce-lib-events/io-events";

function createMockClient() {
  return {
    publishRawEvent: vi.fn().mockResolvedValue(undefined),
  } as unknown as AdobeIoEventsApiClient;
}

const storedData = {
  providers: {
    "order-events": {
      id: "provider-uuid-123",
      events: {
        "order.created": "com.adobe.commerce.order.created",
      },
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
      provider: "order-events",
      event: "order.created",
      payload: { orderId: "100000123", total: 149.99 },
    });

    expect(client.publishRawEvent).toHaveBeenCalledWith({
      providerId: "provider-uuid-123",
      eventCode: "com.adobe.commerce.order.created",
      payload: { orderId: "100000123", total: 149.99 },
    });
  });

  test("throws EventsDataNotInitializedError when no stored data exists", async () => {
    mockGetSystemConfigByKey.mockResolvedValue(null);
    const client = createMockClient();

    await expect(
      publishEvent({
        client,
        provider: "order-events",
        event: "order.created",
        payload: {},
      }),
    ).rejects.toBeInstanceOf(EventsDataNotInitializedError);

    expect(client.publishRawEvent).not.toHaveBeenCalled();
  });

  test("throws ProviderNotFoundError when the provider key is unknown", async () => {
    mockGetSystemConfigByKey.mockResolvedValue(storedData);
    const client = createMockClient();

    await expect(
      publishEvent({
        client,
        provider: "unknown-provider",
        event: "order.created",
        payload: {},
      }),
    ).rejects.toBeInstanceOf(ProviderNotFoundError);

    expect(client.publishRawEvent).not.toHaveBeenCalled();
  });

  test("throws EventNotFoundError when the event name is unknown", async () => {
    mockGetSystemConfigByKey.mockResolvedValue(storedData);
    const client = createMockClient();

    await expect(
      publishEvent({
        client,
        provider: "order-events",
        event: "order.updated",
        payload: {},
      }),
    ).rejects.toBeInstanceOf(EventNotFoundError);

    expect(client.publishRawEvent).not.toHaveBeenCalled();
  });
});
