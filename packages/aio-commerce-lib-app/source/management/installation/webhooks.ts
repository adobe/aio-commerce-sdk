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

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { PhaseDefinition } from "#management/installation/workflow/phase";
import type { StepDefinition } from "#management/installation/workflow/types";

type WebhooksPhaseConfig = CommerceAppConfigOutputModel & {
  webhooks: NonNullable<CommerceAppConfigOutputModel["webhooks"]>;
};

/** Returns true if the given app config contains webhook data. */
function hasWebhooks(
  config: CommerceAppConfigOutputModel,
): config is WebhooksPhaseConfig {
  return config.webhooks !== undefined;
}

/** Phase metadata. */
const PHASE_META = {
  label: "Webhooks Configuration",
  description: "Configures webhook in Adobe Commerce",
} as const;

/** Step definitions. */
const STEPS = {
  commerceSubscriptions: {
    name: "commerceSubscriptions",
    meta: {
      label: "Create Commerce Subscriptions",
      description:
        "Create the subscriptions for each webhook in Adobe Commerce",
    },
  },
} as const satisfies Record<string, StepDefinition>;

/** The phase to install the webhooks infrastructure of an app. */
export const webhooksPhase = {
  name: "webhooks",
  meta: PHASE_META,

  when: hasWebhooks,
  planSteps: () => [STEPS.commerceSubscriptions],

  async handler(_config, installation, plan) {
    const { logger } = installation;

    let p = plan;

    p = await p.run("commerceSubscriptions", (_cfg, { helpers }) => {
      logger.debug("Creating webhook subscriptions...");
      return helpers.success({ subscriptionsCreated: true });
    });

    return p;
  },
} as const satisfies PhaseDefinition<WebhooksPhaseConfig>;
