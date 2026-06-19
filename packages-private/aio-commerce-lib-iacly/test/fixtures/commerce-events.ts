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

import { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import { HttpResponse, http } from "msw";

import type { CommerceEventProvider } from "@adobe/aio-commerce-lib-events/commerce";
import type {
  CommerceEventingSetupConfig,
  CommerceEventProviderConfig,
  CommerceEventSubscriptionConfig,
} from "../../source/events/commerce-events/types";

// AdobeCommerceHttpClient appends /V1 to the baseUrl for SaaS flavor.
const BASE = "https://commerce.test/V1";

const testAuthProvider = {
  getAccessToken: async () => "test-token",
  getHeaders: async () => ({ Authorization: "Bearer test-token" }),
};

export const commerceEventsFixtures = {
  client: new AdobeCommerceHttpClient({
    config: { baseUrl: "https://commerce.test/", flavor: "saas" },
    auth: testAuthProvider,
  }),

  desired: {
    setup: {
      instanceId: "my-instance",
      merchantId: "merchant123",
      environmentId: "env456",
    } satisfies CommerceEventingSetupConfig,

    provider: {
      ioEventsProviderInstanceId: "my-instance",
      label: "My Commerce Provider",
      description: "Test commerce provider",
    } satisfies CommerceEventProviderConfig,

    subscription: {
      eventCode: "observer.catalog_product_save_after",
      providerInstanceId: "my-instance",
      fields: [{ name: "entity_id" }],
    } satisfies CommerceEventSubscriptionConfig,
  },

  state: {
    provider: {
      provider_id: "commerce-provider-id-789",
      instance_id: "my-instance",
      label: "My Commerce Provider",
      description: "Test commerce provider",
    } satisfies CommerceEventProvider,
  },
};

export const commerceEventsHandlers = {
  updateConfiguration: [
    http.put(`${BASE}/eventing/updateConfiguration`, () =>
      HttpResponse.json(true),
    ),
  ],

  listProviders: [
    http.get(`${BASE}/eventing/eventProvider`, () =>
      HttpResponse.json([commerceEventsFixtures.state.provider]),
    ),
  ],

  listProvidersEmpty: [
    http.get(`${BASE}/eventing/eventProvider`, () => HttpResponse.json([])),
  ],

  createProvider: [
    http.post(`${BASE}/eventing/eventProvider`, () =>
      HttpResponse.json(commerceEventsFixtures.state.provider),
    ),
  ],

  deleteProvider: [
    http.delete(
      `${BASE}/eventing/eventProvider/${commerceEventsFixtures.state.provider.provider_id}`,
      () => new HttpResponse(null, { status: 200 }),
    ),
  ],

  listSubscriptions: [
    http.get(`${BASE}/eventing/getEventSubscriptions`, () =>
      HttpResponse.json([
        {
          name: "observer.catalog_product_save_after",
          parent: "",
          provider_id: "default",
          fields: [{ name: "entity_id" }],
          rules: [],
          destination: "default",
          priority: false,
          hipaa_audit_required: false,
        },
      ]),
    ),
  ],

  listSubscriptionsEmpty: [
    http.get(`${BASE}/eventing/getEventSubscriptions`, () =>
      HttpResponse.json([]),
    ),
  ],

  createSubscription: [
    http.post(`${BASE}/eventing/eventSubscribe`, () => HttpResponse.json([])),
  ],

  deleteSubscription: [
    http.post(
      `${BASE}/eventing/eventUnsubscribe/observer.catalog_product_save_after`,
      () => new HttpResponse(null, { status: 200 }),
    ),
  ],
};
