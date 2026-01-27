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

import { definePhase } from "#management/installation/workflow/phase";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { InferPhaseOutput } from "#management/installation/workflow/phase";

/** Config type when webhooks are present. */
type WebhooksConfig = CommerceAppConfigOutputModel & {
  webhooks: unknown[];
};

const PHASE_META = {
  label: "Webhooks",
  description: "Sets up Commerce webhooks",
} as const;

const STEPS_META = {
  subscriptions: {
    label: "Create Subscriptions",
    description: "Creates webhook subscriptions in Adobe Commerce",
  },
} as const;

function createSubscriptions(config: WebhooksConfig) {
  const webhookCount = config.webhooks.length;
  return { subscriptionsCreated: webhookCount };
}

/** The webhooks installation phase. */
export const webhooksPhase = definePhase({
  name: "webhooks",
  meta: PHASE_META,
  steps: STEPS_META,

  when: (config): config is WebhooksConfig =>
    "webhooks" in config && Array.isArray(config.webhooks),

  run: async ({ config, run }) => {
    const subscriptions = await run("subscriptions", () =>
      createSubscriptions(config),
    );

    return { subscriptions };
  },
});

export type WebhooksPhaseOutput = InferPhaseOutput<typeof webhooksPhase>;
