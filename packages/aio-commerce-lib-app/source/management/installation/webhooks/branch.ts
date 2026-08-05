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

import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";

import { hasWebhooks } from "#config/schema/webhooks";
import {
  defineBranchStep,
  defineLeafStep,
} from "#management/installation/workflow/step";
import { UnsupportedReconcileChangeError } from "#management/upgrade/errors";

import { createWebhooksStepContext } from "./context";
import {
  buildWebhookIdPrefix,
  createOrGetWebhookSubscription,
  createWebhookSubscriptions,
  deleteWebhookSubscriptions,
  getWebhookIdentity,
  isWebhookInList,
  resolveWebhookSubscribeParams,
  validateWebhookConflicts,
} from "./helpers";

import type {
  WebhookSubscribeParams,
  WebhookUnsubscribeParams,
} from "@adobe/aio-commerce-lib-webhooks/api";
import type { WebhooksConfig } from "#config/schema/webhooks";
import type { ConfigDiff } from "#management/upgrade/types";
import type { WebhooksExecutionContext } from "./context";

/** Operative diff kinds a reconcile handler needs to act on. */
const OPERATIVE = new Set(["added", "removed", "changed"]);

/**
 * Applies the `commerceWebhook` diff: `added` subscribes the new webhook (idempotent,
 * reusing the same resolution the install path uses); `removed` unsubscribes it directly
 * (the identity fields are enough to rebuild the unsubscribe params, no config lookup
 * needed); `changed` has no in-place update endpoint yet, so it throws.
 *
 * Exported so uninstall's cleanup-list union teardown (spec §11) can reuse the same
 * `removed` delete path for a synthetic diff of cleanup entries.
 *
 * @param config - The target configuration (must have a non-empty `webhooks` array).
 * @param diff - The computed diff between the installed snapshot and the target config.
 * @param context - The webhooks execution context.
 */
export async function reconcileWebhookSubscriptions(
  config: WebhooksConfig,
  diff: ConfigDiff,
  context: WebhooksExecutionContext,
) {
  const { logger, commerceWebhooksClient, params } = context;

  const relevant = diff.changes.filter(
    (change) =>
      change.domain === "commerceWebhook" && OPERATIVE.has(change.kind),
  );

  if (relevant.length === 0) {
    return { subscribedWebhooks: [] };
  }

  const idPrefix = buildWebhookIdPrefix(config.metadata.id);
  const existingWebhooks = await commerceWebhooksClient.getWebhookList();
  const entryByIdentity = new Map(
    config.webhooks.map((entry) => [getWebhookIdentity(entry.webhook), entry]),
  );

  const subscribedWebhooks: WebhookSubscribeParams[] = [];

  for (const change of relevant) {
    if (change.kind === "changed") {
      throw new UnsupportedReconcileChangeError({
        domain: "commerceWebhook",
        identity: change.identity,
      });
    }

    if (change.kind === "removed") {
      const [webhookMethod, webhookType, batchName, hookName] =
        change.identity.split(":");

      const unsubscribeParams: WebhookUnsubscribeParams = {
        batch_name: `${idPrefix}${batchName}`,
        hook_name: `${idPrefix}${hookName}`,
        webhook_method: webhookMethod ?? "",
        webhook_type: webhookType ?? "",
      };

      if (!isWebhookInList(existingWebhooks, unsubscribeParams)) {
        logger.debug(
          `Webhook not found, skipping unsubscribe during reconcile: ${change.identity}`,
        );
        continue;
      }

      try {
        // biome-ignore lint/performance/noAwaitInLoops: unsubscribes hit the Adobe Commerce API sequentially, matching the existing uninstall behavior
        await commerceWebhooksClient.unsubscribeWebhook(unsubscribeParams);
        logger.info(
          `Unsubscribed webhook during reconcile: ${change.identity}`,
        );
      } catch (error) {
        logger.warn(`${stringifyError(error)}. Continuing reconcile.`);
      }

      continue;
    }

    // added
    const entry = entryByIdentity.get(change.identity);
    if (!entry) {
      continue;
    }

    const resolvedWebhook = resolveWebhookSubscribeParams(
      entry,
      idPrefix,
      params,
    );
    subscribedWebhooks.push(
      await createOrGetWebhookSubscription(
        existingWebhooks,
        commerceWebhooksClient,
        resolvedWebhook,
        logger,
      ),
    );
  }

  return { subscribedWebhooks };
}

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
  reconcile: reconcileWebhookSubscriptions,

  uninstall: async (
    config: WebhooksConfig,
    context: WebhooksExecutionContext,
  ) => {
    await deleteWebhookSubscriptions(config, context);
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
