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

import { HttpResponse, http } from "msw";

import type { CommerceWebhook } from "@adobe/aio-commerce-lib-webhooks/api";
import type { WebhookConfig } from "../../source/webhooks/types";

const BASE = "https://commerce.test/V1";

export const webhookFixtures = {
  desired: {
    one: {
      webhook_method: "observer",
      webhook_type: "before",
      batch_name: "myapp",
      hook_name: "order_place",
      url: "https://example.com/webhooks/orders",
      fields: [],
    } satisfies WebhookConfig,
  },
  state: {
    one: {
      webhook_method: "observer",
      webhook_type: "before",
      batch_name: "myapp",
      hook_name: "order_place",
      url: "https://example.com/webhooks/orders",
      fields: [],
    } as CommerceWebhook,
  },
};

export const webhookHandlers = {
  listEmpty: [http.get(`${BASE}/webhooks/list`, () => HttpResponse.json([]))],
  listOne: [
    http.get(`${BASE}/webhooks/list`, () =>
      HttpResponse.json([webhookFixtures.state.one]),
    ),
  ],
  subscribe: [
    http.post(
      `${BASE}/webhooks/subscribe`,
      () => new HttpResponse(null, { status: 200 }),
    ),
  ],
  unsubscribe: [
    http.post(
      `${BASE}/webhooks/unsubscribe`,
      () => new HttpResponse(null, { status: 200 }),
    ),
  ],
};
