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

import { unregisterExtension } from "#management/installation/admin-ui/helpers";
import { createAdminUiStepContext } from "#management/installation/admin-ui/utils";
import { createEventsStepContext } from "#management/installation/events/context";
import {
  reconcileCommerceSubscriptions,
  reconcileIoEvents,
} from "#management/installation/events/reconcile";
import { COMMERCE_PROVIDER_TYPE } from "#management/installation/events/utils";
import { reconcileWebhookSubscriptions } from "#management/installation/webhooks/branch";
import { createWebhooksStepContext } from "#management/installation/webhooks/context";

import { diffConfig } from "./diff";
import { createCleanupStore, PLAN_KEY } from "./plan-store";

import type { EventProviderType } from "@adobe/aio-commerce-lib-events/io-events";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { WebhooksConfig } from "#config/schema/webhooks";
import type { InstallationContext } from "#management/index";
import type { EventsExecutionContext } from "#management/installation/events/context";
import type { WebhooksExecutionContext } from "#management/installation/webhooks/context";
import type { ConfigDiff, ResourceDomain } from "./types";

/** Domains with no generic, identity-addressable delete path (spec §11 known gap). */
const UNSUPPORTED_CLEANUP_DOMAINS: ReadonlySet<ResourceDomain> = new Set([
  // A removed custom installation step has no leaf in the executed tree to source an
  // `uninstall` closure from once it's absent from the target config, and there's no
  // schema-level way to invoke a script's uninstall logic by identity alone.
  "customStep",
  // Business config fields are merchant-configurable settings, not an externally
  // created/deleted resource — there is nothing to tear down.
  "businessConfig",
]);

/**
 * Runs a single per-domain cleanup step, logging and swallowing any error so one
 * domain's failure never prevents the others (or the calling uninstall) from completing.
 */
async function attemptCleanup(
  label: string,
  logger: InstallationContext["logger"],
  fn: () => Promise<unknown>,
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    logger.warn(
      `Cleanup-list teardown: ${label} failed: ${stringifyError(error)}. Continuing.`,
    );
  }
}

/**
 * Tears down cleanup-list entries (spec §11) not already covered by the baseline
 * uninstall walk. Called after a successful uninstall: the baseline walk removes every
 * resource declared in the installed snapshot, but a failed in-flight update may have
 * added/touched resources that were never part of that snapshot — this catches those.
 *
 * A cleanup entry is "covered" when a resource with the same `domain`/`identity` exists
 * in `config` (i.e. the baseline walk was always going to remove it anyway). Uncovered
 * entries are torn down best-effort, reusing the same per-domain reconcile delete paths
 * the update reconcile engine uses for `removed` changes — a resource that no longer
 * exists is treated as already removed (idempotent no-op).
 *
 * Does not read or clear the cleanup store itself — the caller owns that lifecycle
 * (mirrors how `POST /update/execution` owns clearing the plan/cleanup stores after
 * calling into the update workflow).
 *
 * `customStep`/`businessConfig` entries have no generic identity-addressable delete path
 * (see {@link UNSUPPORTED_CLEANUP_DOMAINS}) and are left in place, logged as a warning.
 *
 * @param config - The baseline config the uninstall walk just tore down.
 * @param installationContext - The installation context (params, logger, appData) to build
 * per-domain execution contexts from.
 */
export async function runCleanupTeardown(
  config: CommerceAppConfigOutputModel,
  installationContext: InstallationContext,
): Promise<void> {
  const { logger } = installationContext;

  const cleanupStore = await createCleanupStore();
  const cleanupList = await cleanupStore.get(PLAN_KEY);

  if (!cleanupList || cleanupList.entries.length === 0) {
    return;
  }

  const baselineIdentities = new Set(
    diffConfig(config, config).changes.map(
      (change) => `${change.domain}:${change.identity}`,
    ),
  );

  const uncovered = cleanupList.entries.filter(
    (entry) => !baselineIdentities.has(`${entry.domain}:${entry.identity}`),
  );

  if (uncovered.length === 0) {
    return;
  }

  logger.debug(
    `Cleanup-list teardown: ${uncovered.length} entrie(s) not covered by the baseline uninstall walk; tearing down.`,
  );

  const syntheticDiff: ConfigDiff = {
    changes: uncovered.map((entry) => ({
      destructive: true,
      domain: entry.domain,
      identity: entry.identity,
      kind: "removed",
      supported: true,
    })),
  };

  const eventsContext: EventsExecutionContext = {
    ...installationContext,
    ...createEventsStepContext(installationContext),
  };

  await attemptCleanup(
    "I/O Events provider/registration/metadata",
    logger,
    () =>
      reconcileIoEvents(
        [],
        config.metadata,
        COMMERCE_PROVIDER_TYPE as EventProviderType,
        syntheticDiff,
        eventsContext,
      ),
  );

  await attemptCleanup("Commerce event subscriptions", logger, () =>
    reconcileCommerceSubscriptions(
      [],
      config.metadata,
      syntheticDiff,
      eventsContext,
    ),
  );

  const webhooksContext: WebhooksExecutionContext = {
    ...installationContext,
    ...createWebhooksStepContext(installationContext),
  };

  const webhooksConfig: WebhooksConfig = {
    ...config,
    webhooks: config.webhooks ?? [],
  };

  await attemptCleanup("Commerce webhooks", logger, () =>
    reconcileWebhookSubscriptions(
      webhooksConfig,
      syntheticDiff,
      webhooksContext,
    ),
  );

  if (uncovered.some((entry) => entry.domain === "adminUi")) {
    const adminUiContext = {
      ...installationContext,
      ...(await createAdminUiStepContext(installationContext)),
    };

    // unregisterExtension already best-effort try/catches internally; this call is not
    // wrapped again to avoid a redundant double-catch, matching its own contract.
    await unregisterExtension(adminUiContext);
  }

  const unsupported = uncovered.filter((entry) =>
    UNSUPPORTED_CLEANUP_DOMAINS.has(entry.domain),
  );

  if (unsupported.length > 0) {
    logger.warn(
      `Cleanup-list teardown: ${unsupported.length} entrie(s) have no generic delete-by-identity path and were left in place: ${unsupported.map((entry) => `${entry.domain}:${entry.identity}`).join(", ")}`,
    );
  }
}
