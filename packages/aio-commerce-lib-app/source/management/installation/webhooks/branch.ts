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
} from "#management/installation/workflow/step";

import { createWebhooksStepContext } from "./context";
import {
  createWebhookSubscriptions,
  deleteWebhookSubscriptions,
  validateWebhookConflicts,
} from "./helpers";

import type { WebhooksConfig } from "#config/schema/webhooks";
import type { WebhooksExecutionContext } from "./context";

const subscriptionsStep = defineLeafStep({
  name: "subscriptions",
  meta: {
    install: {
      label: "Create Subscriptions",
      description: "Creates webhook subscriptions in Adobe Commerce",
    },
    uninstall: {
      label: "Delete Subscriptions",
      description: "Deletes webhook subscriptions from Adobe Commerce",
    },
  },

  validate: (config: WebhooksConfig, context: WebhooksExecutionContext) =>
    validateWebhookConflicts(config, context),

  install: (config: WebhooksConfig, context: WebhooksExecutionContext) =>
    createWebhookSubscriptions(config, context),

  uninstall: async (
    config: WebhooksConfig,
    context: WebhooksExecutionContext,
  ) => {
    await deleteWebhookSubscriptions(config, context);
  },
});

/** Branch step for setting up Commerce webhooks. */
export const webhooksStep = defineBranchStep({
  name: "webhooks",
  meta: {
    install: {
      label: "Webhooks",
      description: "Sets up Commerce webhooks",
    },
    uninstall: {
      label: "Webhooks",
      description: "Removes Commerce webhooks",
    },
  },

  when: hasWebhooks,
  context: createWebhooksStepContext,
  children: [subscriptionsStep],
});
