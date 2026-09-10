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

import { getInstallCommerceEnv } from "#config/lib/environment";
import { RecoveryScope } from "#management/common/workflow/recovery";

import {
  createWebhookSubscription,
  deleteWebhookSubscription,
  getWebhookName,
  isDesiredWebhook,
  isWebhookInList,
  isWebhookOwnedByApp,
  resolveDesiredWebhooks,
  resolveDeveloperConsoleOAuthCredentials,
  toIdentity,
  webhookIdentitiesMatch,
} from "./utils";

import type { WebhookSubscribeParams } from "@adobe/aio-commerce-lib-webhooks/api";
import type { WebhooksConfig } from "#config/schema/webhooks";
import type {
  ApplyContext,
  ApplyResult,
} from "#management/common/workflow/resource";
import type { WebhooksExecutionContext, WebhooksStepContext } from "./context";
import type {
  ResolvedWebhookPayload,
  WebhookDomainPlan,
  WebhookIdentity,
  WebhookSnapshotData,
} from "./types";

/** Mutable state threaded through the per-operation handlers as the apply progresses. */
type WebhookApplyState = {
  liveIdentities: WebhookIdentity[];
  subscribedWebhooks: WebhookSubscribeParams[];
};

/** Everything a per-operation handler needs beyond the operation itself. */
type WebhookApplyDeps = {
  commerceWebhooksClient: WebhooksExecutionContext["commerceWebhooksClient"];
  logger: WebhooksExecutionContext["logger"];
  params: Record<string, unknown>;
  recordRemovalOfAdded: (identity: WebhookIdentity) => void;
  recordRestoreOfRemoved: (identity: WebhookIdentity) => void;
};

/**
 * Applies add, update, and remove operations while pruning live app-owned webhooks absent from the
 * target. On the first failure it rolls every change already committed to Commerce back to the
 * stored baseline (re-subscribing removed webhooks, unsubscribing added ones) before surfacing the
 * error, so a rejected replacement never leaves Commerce out of sync with the baseline.
 */
export async function applyWebhookSubscriptions(
  plan: WebhookDomainPlan,
  context: ApplyContext<
    WebhooksStepContext,
    WebhooksConfig,
    WebhookSnapshotData
  >,
): Promise<ApplyResult<WebhookSnapshotData>> {
  const { logger, commerceWebhooksClient, params } = context;

  const liveWebhooks = await commerceWebhooksClient.getWebhookList();

  const appConfig = context.targetConfig ?? context.baseline?.config;
  if (!appConfig) {
    throw new Error(
      "Cannot apply webhook subscriptions without a baseline or target config",
    );
  }

  const env = getInstallCommerceEnv(params);
  const desired = context.targetConfig
    ? resolveDesiredWebhooks(context.targetConfig, env)
    : [];

  // Restoring a removed webhook needs `requiresAdobeAuth`, which only the baseline's own desired
  // webhooks carry. Resolved lazily so the happy path never pays for it.
  let baselineDesiredCache: ResolvedWebhookPayload[] | null = null;
  const getBaselineDesired = (): ResolvedWebhookPayload[] => {
    baselineDesiredCache ??= context.baseline
      ? resolveDesiredWebhooks(context.baseline.config, env)
      : [];
    return baselineDesiredCache;
  };

  const recovery = new RecoveryScope(logger);

  const deps: WebhookApplyDeps = {
    commerceWebhooksClient,
    logger,
    params,
    /** Records how to remove a just-added webhook, if the apply later fails. */
    recordRemovalOfAdded: (identity) => {
      recovery.onFailure(async () => {
        await deleteWebhookSubscription(
          commerceWebhooksClient,
          identity,
          identity,
        );
      });
    },
    /** Records how to put a just-removed baseline webhook back, if the apply later fails. */
    recordRestoreOfRemoved: (identity) => {
      recovery.onFailure(async () => {
        const baselineEntry = getBaselineDesired().find((webhook) =>
          webhookIdentitiesMatch(webhook, identity),
        );
        if (!baselineEntry) {
          // Not part of the baseline (e.g. a webhook subscribed out-of-band) — restoring it is
          // neither possible nor required to match the stored baseline.
          return;
        }

        const { requiresAdobeAuth, ...resolvedWebhook } = baselineEntry;
        await createWebhookSubscription(
          commerceWebhooksClient,
          createSubscribeParams(resolvedWebhook, requiresAdobeAuth, params),
        );
      });
    },
  };

  const state: WebhookApplyState = {
    liveIdentities: liveWebhooks.map(toIdentity),
    subscribedWebhooks: [...(context.baseline?.data.subscribedWebhooks ?? [])],
  };

  try {
    await pruneStaleWebhooks(state, desired, appConfig.metadata.id, deps);

    for (const operation of plan.operations) {
      // biome-ignore lint/performance/noAwaitInLoops: operations must run sequentially so a failure aborts the remaining ones
      await applyWebhookOperation(operation, state, deps);
    }
  } catch (error) {
    // Roll Commerce back to the baseline before surfacing the error; the failed upgrade does not
    // advance the baseline, so a clean recovery leaves the two back in sync.
    return recovery.recover(error);
  }

  return {
    snapshotData: { subscribedWebhooks: state.subscribedWebhooks },
  };
}

/** Dispatches a single planned operation to its handler. */
function applyWebhookOperation(
  operation: WebhookDomainPlan["operations"][number],
  state: WebhookApplyState,
  deps: WebhookApplyDeps,
): Promise<void> {
  if (operation.kind === "add") {
    return applyAddOperation(operation, state, deps);
  }
  if (operation.kind === "update") {
    return applyUpdateOperation(operation, state, deps);
  }
  return applyRemoveOperation(operation, state, deps);
}

/** Subscribes a planned add (unless already live) and records its compensating unsubscribe. */
async function applyAddOperation(
  operation: Extract<WebhookDomainPlan["operations"][number], { kind: "add" }>,
  state: WebhookApplyState,
  deps: WebhookApplyDeps,
): Promise<void> {
  const { commerceWebhooksClient, logger, params } = deps;

  // `after` is always fully resolved for `add` (see planWebhookSubscriptions).
  const { requiresAdobeAuth, ...resolvedWebhook } =
    operation.after as ResolvedWebhookPayload;
  const identity = toIdentity(resolvedWebhook);

  if (isWebhookInList(state.liveIdentities, identity)) {
    logger.info(
      `Webhook already subscribed, skipping: ${getWebhookName(identity)}`,
    );
  } else {
    await createWebhookSubscription(
      commerceWebhooksClient,
      createSubscribeParams(resolvedWebhook, requiresAdobeAuth, params),
    );
    logger.info(`Subscribed webhook: ${getWebhookName(identity)}`);
    state.liveIdentities = [...state.liveIdentities, identity];
    deps.recordRemovalOfAdded(identity);
  }

  if (!isWebhookInList(state.subscribedWebhooks, identity)) {
    state.subscribedWebhooks.push(resolvedWebhook);
  }
}

/**
 * Applies an identity-preserving config change. Commerce's subscribe endpoint is a guarded insert,
 * not an upsert, so an update must unsubscribe the live identity before resubscribing it.
 */
async function applyUpdateOperation(
  operation: Extract<
    WebhookDomainPlan["operations"][number],
    { kind: "update" }
  >,
  state: WebhookApplyState,
  deps: WebhookApplyDeps,
): Promise<void> {
  const { commerceWebhooksClient, logger, params } = deps;
  const identity = toIdentity(operation.before);

  // `after` is always fully resolved for `update` (see planWebhookSubscriptions).
  const { requiresAdobeAuth, ...resolvedWebhook } =
    operation.after as ResolvedWebhookPayload;

  if (isWebhookInList(state.liveIdentities, identity)) {
    await deleteWebhookSubscription(commerceWebhooksClient, identity, identity);
    state.liveIdentities = state.liveIdentities.filter(
      (live) => !webhookIdentitiesMatch(live, identity),
    );
    deps.recordRestoreOfRemoved(identity);
  }

  await createWebhookSubscription(
    commerceWebhooksClient,
    createSubscribeParams(resolvedWebhook, requiresAdobeAuth, params),
  );
  logger.info(`Updated webhook: ${getWebhookName(identity)}`);
  state.liveIdentities = [...state.liveIdentities, identity];
  deps.recordRemovalOfAdded(identity);

  state.subscribedWebhooks = [
    ...state.subscribedWebhooks.filter(
      (subscribed) => !webhookIdentitiesMatch(subscribed, identity),
    ),
    resolvedWebhook,
  ];
}

/** Unsubscribes a planned remove (if live) and records its compensating re-subscribe. */
async function applyRemoveOperation(
  operation: Extract<
    WebhookDomainPlan["operations"][number],
    { kind: "remove" }
  >,
  state: WebhookApplyState,
  deps: WebhookApplyDeps,
): Promise<void> {
  const { commerceWebhooksClient, logger } = deps;
  const identity = toIdentity(operation.before);

  if (isWebhookInList(state.liveIdentities, identity)) {
    await deleteWebhookSubscription(commerceWebhooksClient, identity, identity);
    logger.info(`Unsubscribed webhook: ${getWebhookName(identity)}`);
    state.liveIdentities = state.liveIdentities.filter(
      (live) => !webhookIdentitiesMatch(live, identity),
    );
    deps.recordRestoreOfRemoved(identity);
  } else {
    logger.debug(
      `Webhook not found, skipping unsubscribe: ${getWebhookName(identity)}`,
    );
  }

  state.subscribedWebhooks = state.subscribedWebhooks.filter(
    (subscribed) => !webhookIdentitiesMatch(subscribed, identity),
  );
}

/**
 * Removes live webhooks owned by this app that are absent from the target, recording a restore for
 * each successful removal so a later failure can put it back. Mutates `state.liveIdentities`.
 */
async function pruneStaleWebhooks(
  state: WebhookApplyState,
  desiredWebhooks: readonly WebhookIdentity[],
  appId: string,
  deps: WebhookApplyDeps,
): Promise<void> {
  const { commerceWebhooksClient, logger } = deps;
  const staleIdentities = state.liveIdentities.filter(
    (identity) =>
      isWebhookOwnedByApp(identity, appId) &&
      !isDesiredWebhook(identity, desiredWebhooks),
  );

  for (const identity of staleIdentities) {
    // biome-ignore lint/performance/noAwaitInLoops: removals must run sequentially so a failure aborts the remaining work
    await deleteWebhookSubscription(commerceWebhooksClient, identity, identity);

    logger.info(`Unsubscribed webhook: ${getWebhookName(identity)}`);
    state.liveIdentities = state.liveIdentities.filter(
      (live) => !webhookIdentitiesMatch(live, identity),
    );
    deps.recordRestoreOfRemoved(identity);
  }
}

/** Attaches Developer Console credentials when the webhook requires Adobe authentication. */
function createSubscribeParams(
  webhook: WebhookSubscribeParams,
  requiresAdobeAuth: boolean,
  params: Record<string, unknown>,
): WebhookSubscribeParams {
  if (!requiresAdobeAuth) {
    return webhook;
  }

  return {
    ...webhook,
    developer_console_oauth: resolveDeveloperConsoleOAuthCredentials(params),
  };
}
