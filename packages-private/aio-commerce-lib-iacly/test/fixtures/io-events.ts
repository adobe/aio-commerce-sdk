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

import { AdobeIoEventsHttpClient } from "@adobe/aio-commerce-lib-api";
import { HttpResponse, http } from "msw";

import type { IoEventProvider } from "@adobe/aio-commerce-lib-events/io-events";
import type {
  IoEventsEventMetadataConfig,
  IoEventsProviderConfig,
} from "../../source/events/io-events/types";

const BASE = "https://api.adobe.io/events";

// Pass a pre-built auth provider so no IMS token network calls are made.
const testAuthProvider = {
  getAccessToken: async () => "test-token",
  getHeaders: async () => ({
    Authorization: "Bearer test-token",
    "x-api-key": "test-client-id",
  }),
};

export const ioEventsFixtures = {
  client: new AdobeIoEventsHttpClient({
    config: { baseUrl: BASE },
    auth: testAuthProvider,
  }),

  desired: {
    provider: {
      instanceId: "my-instance",
      label: "My Provider",
      description: "Test provider",
      providerType: "dx_commerce_events",
    } satisfies IoEventsProviderConfig,

    metadata: {
      providerInstanceId: "my-instance",
      event_code: "com.adobe.commerce.order.placed",
      label: "Order Placed",
      description: "Fired when an order is placed",
    } satisfies IoEventsEventMetadataConfig,
  },

  state: {
    provider: {
      id: "api-provider-id-123",
      instance_id: "my-instance",
      label: "My Provider",
      description: "Test provider",
      source: "urn:uuid:api-provider-id-123",
      publisher: "test-org",
      provider_metadata: "dx_commerce_events",
      event_delivery_format: "commerce",
    } satisfies IoEventProvider,
  },
};

export const ioEventsHandlers = {
  listProvidersEmpty: [
    http.get(`${BASE}/test-org/providers`, () =>
      HttpResponse.json({
        _embedded: { providers: [] },
        _links: { self: { href: "" } },
      }),
    ),
  ],
  listProvidersOne: [
    http.get(`${BASE}/test-org/providers`, () =>
      HttpResponse.json({
        _embedded: { providers: [ioEventsFixtures.state.provider] },
        _links: { self: { href: "" } },
      }),
    ),
  ],
  createProvider: [
    http.post(`${BASE}/test-org/test-project/test-workspace/providers`, () =>
      HttpResponse.json(ioEventsFixtures.state.provider),
    ),
  ],
  deleteProvider: [
    http.delete(
      `${BASE}/test-org/test-project/test-workspace/providers/api-provider-id-123`,
      () => new HttpResponse(null, { status: 204 }),
    ),
  ],
  createMetadata: [
    http.post(
      `${BASE}/test-org/test-project/test-workspace/providers/api-provider-id-123/eventmetadata`,
      () =>
        HttpResponse.json({
          event_code: "com.adobe.commerce.order.placed",
          label: "Order Placed",
          description: "Fired when an order is placed",
          _links: { self: { href: "" } },
        }),
    ),
  ],
  listMetadataForProvider: [
    http.get(`${BASE}/providers/api-provider-id-123/eventmetadata`, () =>
      HttpResponse.json({
        _embedded: [
          {
            event_code: "com.adobe.commerce.order.placed",
            label: "Order Placed",
            description: "Fired when an order is placed",
            _links: { self: { href: "" } },
          },
        ],
        _links: { self: { href: "" } },
      }),
    ),
  ],
  deleteMetadata: [
    http.delete(
      `${BASE}/test-org/test-project/test-workspace/providers/api-provider-id-123/eventmetadata/com.adobe.commerce.order.placed`,
      () => new HttpResponse(null, { status: 204 }),
    ),
  ],
};
