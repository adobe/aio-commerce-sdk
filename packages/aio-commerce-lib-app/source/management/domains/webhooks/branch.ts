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

import { hasWebhooks } from "#config/schema/webhooks";
import {
  defineBranchStep,
  defineLeafStep,
} from "#management/common/workflow/step";
import { deprecatedSubscriptionsStep } from "#management/deprecated/domains/webhooks";

import { applyWebhookSubscriptions } from "./apply";
import { createWebhooksStepContext } from "./context";
import { planWebhookSubscriptions } from "./plan";

const subscriptionsStep = defineLeafStep({
  ...deprecatedSubscriptionsStep,
  apply: applyWebhookSubscriptions,
  meta: {
    install: {
      description: "Creates webhook subscriptions in Adobe Commerce",
      label: "Create Subscriptions",
    },
    uninstall: {
      description: "Deletes webhook subscriptions from Adobe Commerce",
      label: "Delete Subscriptions",
    },
    upgrade: {
      description: "Reconciles webhook subscriptions in Adobe Commerce",
      label: "Upgrade Subscriptions",
    },
  },
  name: "subscriptions",
  plan: planWebhookSubscriptions,
});

/** Branch step for setting up Commerce webhooks. */
export const webhooksStep = defineBranchStep({
  children: [subscriptionsStep],
  context: createWebhooksStepContext,

  isConfigured: hasWebhooks,
  meta: {
    install: {
      description: "Sets up Commerce webhooks",
      label: "Webhooks",
    },
    uninstall: {
      description: "Removes Commerce webhooks",
      label: "Webhooks",
    },
    upgrade: {
      description: "Reconciles Commerce webhooks",
      label: "Webhooks",
    },
  },
  name: "webhooks",
});
