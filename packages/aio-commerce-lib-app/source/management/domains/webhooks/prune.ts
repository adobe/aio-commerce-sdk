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

import { unwrapHttpError } from "@adobe/aio-commerce-lib-api/utils";

import { getInstallCommerceEnv } from "#config/lib/environment";

import {
  deleteWebhookSubscription,
  getWebhookName,
  isDesiredWebhook,
  isWebhookProvenOwnedByApp,
  resolveDesiredWebhooks,
  toIdentity,
} from "./utils";

import type { CommerceWebhook } from "@adobe/aio-commerce-lib-webhooks/api";
import type { WebhooksConfig } from "#config/schema/webhooks";
import type { ApplyContext } from "#management/common/workflow/resource";
import type { WebhooksStepContext } from "./context";
import type { WebhookDomainPlan, WebhookSnapshotData } from "./types";

/**
 * Best-effort removal of live webhooks proven-owned by this app in this workspace that the target no
 * longer declares. Listing and per-item delete errors are logged, never rethrown.
 */
export async function pruneWebhookSubscriptions(
  _plan: WebhookDomainPlan,
  context: ApplyContext<
    WebhooksStepContext,
    WebhooksConfig,
    WebhookSnapshotData
  >,
): Promise<void> {
  const { commerceWebhooksClient, logger, params } = context;

  const namespace = process.env.__OW_NAMESPACE;
  if (!namespace) {
    // Ownership cannot be proven without the runtime namespace, so prune nothing.
    return;
  }

  let liveWebhooks: CommerceWebhook[];
  try {
    liveWebhooks = await commerceWebhooksClient.getWebhookList();
  } catch (error) {
    logger.warn(
      `Failed to list webhooks for pruning: ${await unwrapHttpError(error)}. Skipping prune.`,
    );

    return;
  }

  const env = getInstallCommerceEnv(params);
  const desired = context.targetConfig
    ? resolveDesiredWebhooks(context.targetConfig, env)
    : [];

  const staleWebhooks = liveWebhooks.filter(
    (webhook) =>
      isWebhookProvenOwnedByApp(webhook, context.appId, namespace) &&
      !isDesiredWebhook(webhook, desired),
  );

  for (const stale of staleWebhooks) {
    const identity = toIdentity(stale);

    try {
      // biome-ignore lint/performance/noAwaitInLoops: prune deletes run sequentially to avoid a Commerce rate-limit burst
      await deleteWebhookSubscription(
        commerceWebhooksClient,
        identity,
        identity,
      );

      logger.info(`Unsubscribed stale webhook: ${getWebhookName(identity)}`);
    } catch (error) {
      logger.warn(
        `Failed to prune stale webhook ${getWebhookName(identity)}: ${await unwrapHttpError(error)}. Continuing.`,
      );
    }
  }
}
