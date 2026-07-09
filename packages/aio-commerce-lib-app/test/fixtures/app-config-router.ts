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

import { minimalValidConfig } from "./config";
import {
  createMockAllEnvsWebhookEntry,
  createMockPaasWebhookEntry,
} from "./webhooks";

/**
 * Config with a PaaS-scoped commerce event and mixed-env webhooks.
 * Used to verify that the app-config router filters by commerceEnv.
 */
export const configWithEnvScopedEventingAndWebhooks = {
  eventing: {
    commerce: [
      {
        events: [
          {
            description: "Order placed",
            env: ["paas" as const],
            fields: [{ name: "order_id" }],
            label: "Order Placed",
            name: "plugin.order_placed",
            runtimeActions: ["my-package/on-order"],
          },
        ],
        provider: { description: "Order events", label: "Orders" },
      },
    ],
  },
  metadata: minimalValidConfig.metadata,
  webhooks: [createMockPaasWebhookEntry(), createMockAllEnvsWebhookEntry()],
};

/**
 * Config with a PaaS-scoped and a shared business-config field.
 * Used to verify that the app-config router filters fields by commerceEnv.
 */
export const configWithEnvScopedBusinessConfig = {
  businessConfig: {
    schema: [
      {
        default: "paas",
        env: ["paas" as const],
        label: "PaaS Field",
        name: "paasField",
        type: "text" as const,
      },
      {
        default: "shared",
        label: "Shared Field",
        name: "sharedField",
        type: "text" as const,
      },
    ],
  },
  metadata: minimalValidConfig.metadata,
};

/**
 * Config with a single PaaS-only webhook and no env filter applied.
 * Used to verify that the full config is returned when commerceEnv is omitted.
 */
export const configWithPaasOnlyWebhook = {
  metadata: minimalValidConfig.metadata,
  webhooks: [createMockPaasWebhookEntry()],
};
