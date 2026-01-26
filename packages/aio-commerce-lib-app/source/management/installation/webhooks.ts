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
import type { InferPhaseData } from "#management/installation/workflow/phase";

/** Config type when webhooks are present. */
type WebhooksConfig = CommerceAppConfigOutputModel & {
  webhooks: unknown[];
};

/** The webhooks installation phase. */
export const webhooksPhase = definePhase(
  {
    name: "webhooks",
    when: (config): config is WebhooksConfig =>
      "webhooks" in config && Array.isArray(config.webhooks),
  },
  (steps) =>
    steps.step("subscriptions", (s) =>
      s.run(({ config }) => {
        const webhookCount = config.webhooks.length;
        return { subscriptionsCreated: webhookCount };
      }),
    ),
);

/** The accumulated output data type from the webhooks phase. */
export type WebhooksPhaseData = InferPhaseData<typeof webhooksPhase>;
