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

import { createWebhooksStepContext } from "./context";
import {
  createWebhookSubscriptions,
  deleteWebhookSubscriptions,
  validateWebhookConflicts,
} from "./helpers";

import type { WebhookSubscribeParams } from "@adobe/aio-commerce-lib-webhooks/api";
import type { WebhooksConfig } from "#config/schema/webhooks";
import type { ValidationExecutionContext } from "#management/common/workflow/step";
import type {
  UpgradeDomainPlan,
  UpgradeExecutionContext,
  UpgradeExecutionResult,
  UpgradePlanningInput,
  UpgradePlanningResult,
} from "#management/common/workflow/upgrade";
import type { WebhooksExecutionContext, WebhooksStepContext } from "./context";
import type { WebhookIdentity, WebhookSubscriptionResult } from "./helpers";

/** The upgrade plan the webhooks domain proposes: subscription changes keyed by webhook identity. */
type WebhookUpgradePlan = UpgradeDomainPlan<
  WebhookSubscribeParams,
  WebhookIdentity
>;

/** The snapshot data the webhooks domain persists after an upgrade. */
type WebhookUpgradeSnapshotData = WebhookSubscriptionResult;

const subscriptionsStep = defineLeafStep({
  install: (config: WebhooksConfig, context: WebhooksExecutionContext) =>
    createWebhookSubscriptions(config, context),
  meta: {
    install: {
      description: "Creates webhook subscriptions in Adobe Commerce",
      label: "Create Subscriptions",
    },
    uninstall: {
      description: "Deletes webhook subscriptions from Adobe Commerce",
      label: "Delete Subscriptions",
    },
  },
  name: "subscriptions",

  planUpgrade: (
    _input: UpgradePlanningInput<
      WebhooksConfig,
      WebhookUpgradeSnapshotData,
      WebhookIdentity
    >,
    _context: ValidationExecutionContext<WebhooksStepContext>,
  ): Promise<UpgradePlanningResult<WebhookUpgradePlan>> => {
    // TODO(CEXT-6527): implement webhook upgrade planning
    return Promise.resolve({
      kind: "planned",
      plan: {
        domain: "webhooks",
        operations: [],
        possibleCleanupResources: [],
      },
    });
  },

  uninstall: async (
    config: WebhooksConfig,
    context: WebhooksExecutionContext,
  ) => {
    await deleteWebhookSubscriptions(config, context);
  },

  upgrade: (
    _plan: WebhookUpgradePlan,
    _context: UpgradeExecutionContext<WebhooksStepContext>,
  ): Promise<
    UpgradeExecutionResult<WebhookUpgradeSnapshotData, WebhookIdentity>
  > => {
    // TODO(CEXT-6527): implement webhook upgrade execution
    return Promise.resolve({
      resolvedCleanupResources: [],
      snapshotData: null,
    });
  },

  validate: (config: WebhooksConfig, context: WebhooksExecutionContext) =>
    validateWebhookConflicts(config, context),
});

/** Branch step for setting up Commerce webhooks. */
export const webhooksStep = defineBranchStep({
  children: [subscriptionsStep],
  context: createWebhooksStepContext,
  meta: {
    install: {
      description: "Sets up Commerce webhooks",
      label: "Webhooks",
    },
    uninstall: {
      description: "Removes Commerce webhooks",
      label: "Webhooks",
    },
  },
  name: "webhooks",

  when: hasWebhooks,
});
