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
import { resolveImsAuthParams } from "@adobe/aio-commerce-lib-auth";
import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";

import { appliesToEnv, getInstallCommerceEnv } from "#config/lib/environment";

import type {
  CommerceWebhook,
  WebhookSubscribeParams,
  WebhookUnsubscribeParams,
} from "@adobe/aio-commerce-lib-webhooks/api";
import type { WebhookEntry, WebhooksConfig } from "#config/schema/webhooks";
import type {
  ApplyContext,
  ApplyResult,
  CleanupResource,
  DomainPlan,
  PlanningInput,
  PlanningResult,
  ResourceOperation,
} from "#management/common/workflow/resource";
import type {
  ValidationExecutionContext,
  ValidationIssue,
} from "#management/common/workflow/step";
import type { WebhooksExecutionContext, WebhooksStepContext } from "./context";

/** Minimal identity fields shared by subscribe and unsubscribe params. */
export type WebhookIdentity = {
  batch_name: string;
  hook_name: string;
  webhook_method: string;
  webhook_type: string;
};

/** Identity of a Commerce webhook that conflicts with a modification webhook from this app. */
export type ConflictingWebhook = WebhookIdentity & {
  label: string;
};

/** Matches any character that is not a valid identifier character (letter, digit, or underscore). */
const NON_IDENTIFIER_CHAR_REGEX = /[^a-zA-Z0-9_]/g;

/** Matches two or more consecutive underscores. */
const MULTIPLE_UNDERSCORES_REGEX = /_+/g;

/** Matches the `.magento` segment in plugin webhook method names (e.g. `plugin.magento.foo`). */
const PLUGIN_MAGENTO_REGEX = /^plugin\.magento\./;

const ENVIRONMENT_PRODUCTION = "production";
const ENVIRONMENT_STAGING = "staging";

/** Summary of webhook subscription results after a run. */
export type WebhookSubscriptionResult = {
  subscribedWebhooks: WebhookSubscribeParams[];
};

/** Summary of webhook unsubscription results after a run. */
export type WebhookUnsubscriptionResult = {
  unsubscribedWebhooks: WebhookUnsubscribeParams[];
};

/** A fully-resolved webhook payload, minus credentials, plus whether they're required. */
type ResolvedWebhookPayload = WebhookIdentity &
  Omit<WebhookSubscribeParams, "developer_console_oauth"> & {
    requiresAdobeAuth: boolean;
  };

/**
 * Value carried by an add/remove operation: a {@link ResolvedWebhookPayload} with
 * every non-identity field optional, since a cleanup-driven remove may carry only
 * the bare identity. Never includes `developer_console_oauth` — plans and
 * snapshots must stay secret-free; `apply` resolves credentials fresh for an
 * `add` when `requiresAdobeAuth` is set.
 */
export type WebhookOperationValue = WebhookIdentity &
  Partial<Omit<ResolvedWebhookPayload, keyof WebhookIdentity>>;

/** The webhooks domain plan. `retainedWebhooks` lets `apply` rebuild the full resulting state without needing the baseline. */
export type WebhookDomainPlan = DomainPlan<
  WebhookOperationValue,
  WebhookIdentity
> & {
  retainedWebhooks: WebhookSubscribeParams[];
};

/** The snapshot data the webhooks domain persists after applying its plan. */
export type WebhookSnapshotData = WebhookSubscriptionResult;

/** Narrows any webhook-like value down to its identity fields. */
function toIdentity<T extends WebhookIdentity>(webhook: T): WebhookIdentity {
  return {
    batch_name: webhook.batch_name,
    hook_name: webhook.hook_name,
    webhook_method: webhook.webhook_method,
    webhook_type: webhook.webhook_type,
  };
}

/** Builds a stable, human-traceable id for a planned add/remove operation. */
function webhookOperationId(
  kind: "add" | "remove",
  identity: WebhookIdentity,
): string {
  return `${kind}:${identity.webhook_method}:${identity.webhook_type}:${identity.batch_name}:${identity.hook_name}`;
}

/**
 * Validates that no modification webhooks in the app config conflict with webhooks
 * already registered in Commerce by another app.
 *
 * A conflict is: Commerce has a webhook with the same `webhook_method` and `webhook_type`
 * that does NOT belong to this app (i.e. different `batch_name` or `hook_name` after prefix).
 *
 * Returns a `ValidationIssue` with code `WEBHOOK_CONFLICTS` and `details.conflictedWebhooks` listing
 * every conflicting Commerce webhook when conflicts are found, or an empty array otherwise.
 *
 * @param config - The app config (must have a non-empty `webhooks` array).
 * @param context - The webhooks execution context (provides the Commerce API client and logger).
 */
export async function validateWebhookConflicts(
  config: WebhooksConfig,
  context: WebhooksExecutionContext,
): Promise<ValidationIssue[]> {
  const { logger, commerceWebhooksClient, params } = context;

  const env = getInstallCommerceEnv(params);
  const modificationWebhooks = config.webhooks.filter(
    (entry) => entry.category === "modification" && appliesToEnv(entry, env),
  );

  if (modificationWebhooks.length === 0) {
    logger.debug(
      "No modification webhooks to validate, skipping conflict check.",
    );
    return [];
  }

  logger.debug(
    `Validating ${modificationWebhooks.length} modification webhook(s) for conflicts...`,
  );

  const existingWebhooks = await commerceWebhooksClient.getWebhookList();
  const idPrefix = buildWebhookIdPrefix(config.metadata.id);
  const conflictedWebhooks: ConflictingWebhook[] = [];

  for (const entry of modificationWebhooks) {
    const { webhook } = entry;
    const resolvedBatch = `${idPrefix}${webhook.batch_name}`;
    const resolvedHook = `${idPrefix}${webhook.hook_name}`;

    for (const existing of existingWebhooks) {
      if (
        existing.webhook_method === webhook.webhook_method &&
        existing.webhook_type === webhook.webhook_type &&
        !(
          existing.batch_name === resolvedBatch &&
          existing.hook_name === resolvedHook
        )
      ) {
        conflictedWebhooks.push({
          label: entry.label,
          ...existing,
        });
        break;
      }
    }
  }

  if (conflictedWebhooks.length > 0) {
    return [
      {
        code: "WEBHOOK_CONFLICTS",
        details: { conflictedWebhooks },
        message: `Webhook conflicts detected: ${conflictedWebhooks.length} webhook(s) already registered for the same method and type by another app`,
        severity: "warning",
      },
    ];
  }

  logger.info("No webhook conflicts found.");
  return [];
}

/**
 * Subscribes each webhook from the app config to Adobe Commerce.
 * Throws on the first failure, aborting any remaining subscriptions.
 *
 * @param config - The app config (must have a non-empty `webhooks` array).
 * @param context - The webhooks execution context (provides the Commerce API client and logger).
 */
export async function createWebhookSubscriptions(
  config: WebhooksConfig,
  context: WebhooksExecutionContext,
): Promise<WebhookSubscriptionResult> {
  const { logger, commerceWebhooksClient, params } = context;

  const env = getInstallCommerceEnv(params);
  const webhooks = config.webhooks.filter((entry) => appliesToEnv(entry, env));

  if (webhooks.length === 0) {
    logger.info(
      "No webhooks apply to this environment, skipping subscription.",
    );
    return { subscribedWebhooks: [] };
  }

  logger.info(`Subscribing ${webhooks.length} webhook(s) to Commerce...`);

  const idPrefix = buildWebhookIdPrefix(config.metadata.id);
  const subscribedWebhooks: WebhookSubscribeParams[] = [];

  const existingWebhooks = await commerceWebhooksClient.getWebhookList();

  for (const entry of webhooks) {
    const { webhook } = entry;

    logger.debug(
      `Subscribing webhook "${getWebhookName(webhook)}" (runtimeAction: ${"runtimeAction" in entry ? entry.runtimeAction : "none"})`,
    );

    const resolvedWebhook = resolveWebhookSubscribeParams(
      entry,
      idPrefix,
      params,
    );

    subscribedWebhooks.push(
      // biome-ignore lint/performance/noAwaitInLoops: subscriptions must be created sequentially so a failure aborts remaining subscriptions (see function docstring)
      await createOrGetWebhookSubscription(
        existingWebhooks,
        commerceWebhooksClient,
        resolvedWebhook,
        logger,
      ),
    );
  }

  logger.info(
    `Webhook subscriptions complete: ${subscribedWebhooks.length} subscribed.`,
  );

  return { subscribedWebhooks };
}

/**
 * Unsubscribes each webhook from the app config in Adobe Commerce.
 * If a webhook is not found in the existing list, it is silently skipped (idempotent).
 *
 * @param config - The app config (must have a non-empty `webhooks` array).
 * @param context - The webhooks execution context (provides the Commerce API client and logger).
 */
export async function deleteWebhookSubscriptions(
  config: WebhooksConfig,
  context: WebhooksExecutionContext,
): Promise<WebhookUnsubscriptionResult> {
  const { logger, commerceWebhooksClient } = context;

  logger.info(
    `Unsubscribing ${config.webhooks.length} webhook(s) from Commerce...`,
  );

  const idPrefix = buildWebhookIdPrefix(config.metadata.id);

  const existingWebhooks = await commerceWebhooksClient.getWebhookList();

  const unsubscribedWebhooks: WebhookUnsubscribeParams[] = [];

  for (const entry of config.webhooks) {
    const { webhook } = entry;
    const resolvedBatch = `${idPrefix}${webhook.batch_name}`;
    const resolvedHook = `${idPrefix}${webhook.hook_name}`;

    const params: WebhookUnsubscribeParams = {
      batch_name: resolvedBatch,
      hook_name: resolvedHook,
      webhook_method: webhook.webhook_method,
      webhook_type: webhook.webhook_type,
    };

    if (!isWebhookInList(existingWebhooks, params)) {
      logger.debug(
        `Webhook not found, skipping unsubscribe: ${getWebhookName(webhook)}`,
      );
      continue;
    }

    try {
      // biome-ignore lint/performance/noAwaitInLoops: unsubscribes hit the Adobe Commerce API sequentially to avoid a rate-limit burst during uninstall
      await deleteWebhookSubscription(commerceWebhooksClient, webhook, params);
      logger.info(`Unsubscribed webhook: ${getWebhookName(webhook)}`);
      unsubscribedWebhooks.push(params);
    } catch (error) {
      logger.warn(`${stringifyError(error)}. Continuing uninstall.`);
    }
  }

  logger.info(
    `Webhook unsubscriptions complete: ${unsubscribedWebhooks.length} unsubscribed.`,
  );

  return { unsubscribedWebhooks };
}

/** Resolves a config webhook entry's identity/payload (idPrefix, URL) — no credentials. Pure. */
function resolveWebhookPayload(
  entry: WebhookEntry,
  idPrefix: string,
): ResolvedWebhookPayload {
  const { webhook } = entry;
  const resolvedUrl =
    "runtimeAction" in entry
      ? generateUrlForRuntimeAction(entry.runtimeAction)
      : entry.webhook.url;

  return {
    ...webhook,
    batch_name: `${idPrefix}${webhook.batch_name}`,
    hook_name: `${idPrefix}${webhook.hook_name}`,
    requiresAdobeAuth:
      "runtimeAction" in entry && entry.requireAdobeAuth !== false,
    url: resolvedUrl,
  };
}

/** Resolves a config webhook entry into wire-format subscribe params, attaching OAuth credentials when required. */
function resolveWebhookSubscribeParams(
  entry: WebhookEntry,
  idPrefix: string,
  params: WebhooksExecutionContext["params"],
): WebhookSubscribeParams {
  const { requiresAdobeAuth, ...resolved } = resolveWebhookPayload(
    entry,
    idPrefix,
  );

  return {
    ...resolved,
    ...(requiresAdobeAuth && {
      developer_console_oauth: resolveDeveloperConsoleOAuthCredentials(params),
    }),
  };
}

/** Resolves every config webhook entry that applies to `env` — no credentials, for planning only. */
function resolveDesiredWebhooks(
  config: WebhooksConfig,
  env: ReturnType<typeof getInstallCommerceEnv>,
): WebhookOperationValue[] {
  const idPrefix = buildWebhookIdPrefix(config.metadata.id);
  return config.webhooks
    .filter((entry) => appliesToEnv(entry, env))
    .map((entry) => resolveWebhookPayload(entry, idPrefix));
}

/**
 * Diffs the target config against the baseline (plus any unresolved cleanup)
 * into add/remove operations. Pure — no external reads or writes, since an
 * observation made here could be stale by execution time.
 *
 * Blocks with a `WEBHOOK_BASELINE_UNRESOLVED` issue when a baseline exists but
 * its subscribed-webhooks data couldn't be resolved, rather than guessing that
 * nothing was previously owned.
 */
export function planWebhookSubscriptions(
  input: PlanningInput<WebhooksConfig, WebhookSnapshotData, WebhookIdentity>,
  context: ValidationExecutionContext<WebhooksStepContext>,
): Promise<PlanningResult<WebhookDomainPlan>> {
  const { path, baseline, targetConfig, unresolvedCleanupResources } = input;
  const { params } = context;

  // `baseline: null` means the domain was absent (nothing to own yet), which is
  // fine. A `baseline` that exists but whose `data` didn't resolve is different:
  // some webhooks may still be live in Commerce, and silently treating it as
  // "nothing owned" would drop their removal. Block instead of guessing.
  // `data` is typed as non-optional, but a malformed caller (e.g. a stale-path
  // lookup) can still pass null/undefined at runtime — guard against that.
  // biome-ignore lint/suspicious/noUnnecessaryConditions: see comment above
  if (baseline && !baseline.data?.subscribedWebhooks) {
    return Promise.resolve({
      issues: [
        {
          code: "WEBHOOK_BASELINE_UNRESOLVED",
          domain: "webhooks",
          message:
            "A prior webhooks baseline exists, but its subscribed-webhooks data could not be resolved. Refusing to plan without it, since previously subscribed webhooks could otherwise go unremoved.",
        },
      ],
      kind: "blocked",
    });
  }

  const env = getInstallCommerceEnv(params);
  const desired = targetConfig ? resolveDesiredWebhooks(targetConfig, env) : [];

  const ownedFromBaseline = baseline?.data?.subscribedWebhooks ?? [];
  const unresolvedIdentities = unresolvedCleanupResources.map(
    (resource) => resource.identity,
  );

  // Removes precede adds (see the concat below): a rename plans as an
  // unrelated add+remove pair on the same hook point, and adding first would
  // briefly double-register it.
  const addOperations: ResourceOperation<WebhookOperationValue>[] = [];
  const removeOperations: ResourceOperation<WebhookOperationValue>[] = [];
  const possibleCleanupResources: CleanupResource<WebhookIdentity>[] = [];
  const retainedWebhooks: WebhookSubscribeParams[] = [];

  for (const webhook of desired) {
    const owned = ownedFromBaseline.find((candidate) =>
      webhookIdentitiesMatch(candidate, webhook),
    );

    // A pending unresolved-cleanup entry means this identity's fate from a
    // prior interrupted attempt is uncertain (it may have actually been
    // unsubscribed) — don't trust the baseline's "retained" fast path over
    // it. Re-plan as an add instead: `apply` checks live Commerce state
    // before subscribing, so this safely no-ops if it's still there.
    const hasUnresolvedCleanup = unresolvedIdentities.some((pending) =>
      webhookIdentitiesMatch(pending, webhook),
    );

    if (owned && !hasUnresolvedCleanup) {
      retainedWebhooks.push(owned);
      continue;
    }

    const identity = toIdentity(webhook);
    addOperations.push({
      after: webhook,
      category: "configuration",
      id: webhookOperationId("add", identity),
      kind: "add",
      label: `Subscribe webhook: ${getWebhookName(identity)}`,
    });
    possibleCleanupResources.push({ identity, path });
  }

  const staleFromBaseline = ownedFromBaseline.filter(
    (owned) =>
      !desired.some((webhook) => webhookIdentitiesMatch(webhook, owned)),
  );

  const staleFromCleanup = unresolvedIdentities.filter(
    (identity) =>
      !(
        desired.some((webhook) => webhookIdentitiesMatch(webhook, identity)) ||
        ownedFromBaseline.some((owned) =>
          webhookIdentitiesMatch(owned, identity),
        )
      ),
  );

  for (const stale of staleFromBaseline) {
    const identity = toIdentity(stale);
    removeOperations.push({
      before: stale,
      category: "configuration",
      id: webhookOperationId("remove", identity),
      kind: "remove",
      label: `Unsubscribe webhook: ${getWebhookName(identity)}`,
    });
    possibleCleanupResources.push({ identity, path });
  }

  for (const identity of staleFromCleanup) {
    removeOperations.push({
      before: identity,
      category: "cleanup",
      id: webhookOperationId("remove", identity),
      kind: "remove",
      label: `Unsubscribe webhook: ${getWebhookName(identity)}`,
    });
    possibleCleanupResources.push({ identity, path });
  }

  return Promise.resolve({
    kind: "planned",
    plan: {
      operations: [...removeOperations, ...addOperations],
      path,
      possibleCleanupResources,
      retainedWebhooks,
    },
  });
}

/**
 * Applies a webhooks domain plan: re-checks live Commerce state before each
 * add/remove (idempotent under retry), then returns the resulting subscription
 * set and resolved cleanup identities. Aborts on the first failure so the
 * attempt retries instead of reporting success over a partial apply.
 */
export async function applyWebhookSubscriptions(
  plan: WebhookDomainPlan,
  context: ApplyContext<WebhooksStepContext>,
): Promise<ApplyResult<WebhookSnapshotData, WebhookIdentity>> {
  const { logger, commerceWebhooksClient, params } = context;

  let liveIdentities = (await commerceWebhooksClient.getWebhookList()).map(
    toIdentity,
  );

  const resolvedCleanupResources: CleanupResource<WebhookIdentity>[] = [];
  const subscribedWebhooks: WebhookSubscribeParams[] = [
    ...plan.retainedWebhooks,
  ];

  for (const operation of plan.operations) {
    if (operation.kind === "add") {
      // `after` is always fully resolved for `add` (see planWebhookSubscriptions).
      const { requiresAdobeAuth, ...resolvedWebhook } =
        operation.after as ResolvedWebhookPayload;
      const identity = toIdentity(resolvedWebhook);

      if (
        liveIdentities.some((live) => webhookIdentitiesMatch(live, identity))
      ) {
        logger.info(
          `Webhook already subscribed, skipping: ${getWebhookName(identity)}`,
        );
      } else {
        const toSubscribe: WebhookSubscribeParams = {
          ...resolvedWebhook,
          ...(requiresAdobeAuth && {
            developer_console_oauth:
              resolveDeveloperConsoleOAuthCredentials(params),
          }),
        };

        // biome-ignore lint/performance/noAwaitInLoops: operations must run sequentially so a failure aborts the remaining ones
        await createWebhookSubscription(commerceWebhooksClient, toSubscribe);
        logger.info(`Subscribed webhook: ${getWebhookName(identity)}`);
        liveIdentities = [...liveIdentities, identity];
      }

      subscribedWebhooks.push(resolvedWebhook);
      resolvedCleanupResources.push({ identity, path: plan.path });
    } else if (operation.kind === "remove") {
      const identity = toIdentity(operation.before);

      if (
        liveIdentities.some((live) => webhookIdentitiesMatch(live, identity))
      ) {
        await deleteWebhookSubscription(
          commerceWebhooksClient,
          identity,
          identity,
        );
        logger.info(`Unsubscribed webhook: ${getWebhookName(identity)}`);
        liveIdentities = liveIdentities.filter(
          (live) => !webhookIdentitiesMatch(live, identity),
        );
      } else {
        logger.debug(
          `Webhook not found, skipping unsubscribe: ${getWebhookName(identity)}`,
        );
      }

      resolvedCleanupResources.push({ identity, path: plan.path });
    }
  }

  return {
    resolvedCleanupResources,
    snapshotData: { subscribedWebhooks },
  };
}

/**
 * Subscribes a single webhook to Commerce, skipping the API call if the webhook
 * is already subscribed (matched by webhook_method, webhook_type, batch_name, hook_name).
 */
export async function createOrGetWebhookSubscription(
  existingWebhooks: CommerceWebhook[],
  client: WebhooksExecutionContext["commerceWebhooksClient"],
  resolvedWebhook: WebhookSubscribeParams,
  logger: WebhooksExecutionContext["logger"],
): Promise<WebhookSubscribeParams> {
  if (isWebhookInList(existingWebhooks, resolvedWebhook)) {
    logger.info(
      `Webhook already subscribed, skipping: ${getWebhookName(resolvedWebhook)}`,
    );
    return resolvedWebhook;
  }
  const subscribed = await createWebhookSubscription(client, resolvedWebhook);
  logger.info(`Subscribed webhook: ${getWebhookName(resolvedWebhook)}`);
  return subscribed;
}

/**
 * Re-throws `err` as a new Error with an enriched message that includes the webhook name
 * and the unwrapped HTTP response body (if available).
 */
async function rethrowWithWebhookName(
  err: unknown,
  webhookName: string,
  operation: string,
): Promise<never> {
  const msg = await unwrapHttpError(err);
  throw new Error(
    `Failed to ${operation} webhook subscription for "${webhookName}": ${msg}`,
  );
}

/**
 * Subscribes a single webhook to Commerce, enriching the error with the webhook name
 * if the API responds with a string `message`.
 */
export async function createWebhookSubscription(
  client: WebhooksExecutionContext["commerceWebhooksClient"],
  resolvedWebhook: WebhookSubscribeParams,
): Promise<WebhookSubscribeParams> {
  try {
    await client.subscribeWebhook(resolvedWebhook);
    return resolvedWebhook;
  } catch (err) {
    return await rethrowWithWebhookName(
      err,
      getWebhookName(resolvedWebhook),
      "create",
    );
  }
}

/**
 * Unsubscribes a single webhook from Commerce, enriching the error with the webhook name
 * if the API responds with a string `message`.
 */
async function deleteWebhookSubscription(
  client: WebhooksExecutionContext["commerceWebhooksClient"],
  resolvedWebhook: WebhookIdentity,
  params: WebhookUnsubscribeParams,
): Promise<void> {
  try {
    await client.unsubscribeWebhook(params);
  } catch (err) {
    return rethrowWithWebhookName(
      err,
      getWebhookName(resolvedWebhook),
      "delete",
    );
  }
}

/** Shape of the developer_console_oauth credential block expected by the Commerce Webhooks API. */
type DeveloperConsoleOAuth = {
  client_id: string;
  client_secret: string;
  org_id: string;
  environment: string;
};

/**
 * Resolves and validates the IMS credentials required for `developer_console_oauth`.
 *
 * Delegates parsing and validation to `resolveImsAuthParams` from `aio-commerce-lib-auth`,
 * which correctly handles `AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS` whether it arrives as a
 * real array or as a JSON-stringified array string.
 */
export function resolveDeveloperConsoleOAuthCredentials(
  params: Record<string, unknown>,
): DeveloperConsoleOAuth {
  const { AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: imsEnvironment, ...imsParams } =
    params;

  const { clientId, clientSecrets, imsOrgId } = resolveImsAuthParams(imsParams);

  return {
    client_id: clientId,
    client_secret: clientSecrets[0],
    environment:
      !imsEnvironment || String(imsEnvironment).startsWith("prod")
        ? ENVIRONMENT_PRODUCTION
        : ENVIRONMENT_STAGING,
    org_id: imsOrgId,
  };
}

/**
 * Returns true when two webhook identities refer to the same Commerce webhook.
 *
 * The identity check uses: webhook_method, webhook_type, batch_name, hook_name.
 * `webhook_method` is normalised before comparison to handle the case where Commerce strips the
 * `.magento` segment from plugin webhook methods on storage
 * (e.g. `plugin.magento.foo` and `plugin.foo` are treated as the same method).
 */
function webhookIdentitiesMatch(
  a: WebhookIdentity,
  b: WebhookIdentity,
): boolean {
  return (
    normalizeWebhookMethod(a.webhook_method) ===
      normalizeWebhookMethod(b.webhook_method) &&
    a.webhook_type === b.webhook_type &&
    a.batch_name === b.batch_name &&
    a.hook_name === b.hook_name
  );
}

/** Returns true when a webhook with the given four-part identity exists in the list. */
function isWebhookInList(
  existing: CommerceWebhook[],
  candidate: WebhookIdentity,
): boolean {
  return existing.some((w) => webhookIdentitiesMatch(w, candidate));
}

/**
 * Normalises a webhook method name by removing the `.magento` segment that Commerce
 * may drop when persisting plugin webhook methods.
 *
 * @example
 * normalizeWebhookMethod("plugin.magento.foo.bar") // → "plugin.foo.bar"
 * normalizeWebhookMethod("plugin.foo.bar")         // → "plugin.foo.bar" (unchanged)
 */
function normalizeWebhookMethod(method: string): string {
  return method.replace(PLUGIN_MAGENTO_REGEX, "plugin.");
}

/**
 * Generates a URL for a given runtime action using the AIO Runtime API host and namespace.
 * @param runtimeAction
 * @return The generated URL for the runtime action.
 */
function generateUrlForRuntimeAction(runtimeAction: string): string {
  const namespace = process.env.__OW_NAMESPACE;

  if (!namespace) {
    throw new Error(
      `Cannot generate URL for runtime action "${runtimeAction}": namespace environment variable is not set.`,
    );
  }

  return `https://${namespace}.adobeioruntime.net/api/v1/web/${runtimeAction}`;
}

/**
 * Builds a prefix string from the app ID to namespace webhook batch/hook names.
 * Non-identifier characters are replaced with underscores; consecutive underscores
 * are collapsed to one; a trailing underscore is appended. The result is lowercased
 * to ensure consistent matching regardless of input casing.
 *
 * @example
 * ```typescript
 * buildWebhookIdPrefix("my--app.v2") // => "my_app_v2_"
 * buildWebhookIdPrefix("MyApp") // => "myapp_"
 * ```
 * @param appId - The app ID to build the prefix from.
 * @return The built prefix string.
 */
export function buildWebhookIdPrefix(appId: string): string {
  const prefix = appId
    .toLowerCase()
    .replace(NON_IDENTIFIER_CHAR_REGEX, "_")
    .replace(MULTIPLE_UNDERSCORES_REGEX, "_");
  return prefix.endsWith("_") ? prefix : `${prefix}_`;
}

/**
 * Generates a name for a webhook based on its method and type.
 *
 * @param webhook
 * @return A string in the format "webhook_method:webhook_type" to identify the webhook.
 */
function getWebhookName(
  webhook: Pick<WebhookIdentity, "webhook_method" | "webhook_type">,
): string {
  return `${webhook.webhook_method}:${webhook.webhook_type}`;
}
