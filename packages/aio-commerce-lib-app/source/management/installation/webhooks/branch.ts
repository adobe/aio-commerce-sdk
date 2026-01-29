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

import {
  defineBranchStep,
  defineLeafStep,
} from "#management/installation/workflow/step";

import { createWebhookSubscriptions } from "./steps";
import { hasWebhooks } from "./utils";

import type { WebhooksExecutionContext } from "./utils";

const subscriptionsStep = defineLeafStep({
  name: "subscriptions",
  meta: {
    label: "Create Subscriptions",
    description: "Creates webhook subscriptions in Adobe Commerce",
  },

  run: (config, context: WebhooksExecutionContext) => {
    const { logger } = context;
    logger.debug(config);

    return createWebhookSubscriptions(context);
  },
});

/** Branch step for setting up Commerce webhooks. */
export const webhooksStep = defineBranchStep({
  name: "webhooks",
  meta: {
    label: "Webhooks",
    description: "Sets up Commerce webhooks",
  },

  when: hasWebhooks,
  children: [subscriptionsStep],
});
