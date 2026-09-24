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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import {
  getAioCliEnv,
  getAioProjectContext,
  getServiceToken,
} from "@aio-commerce-sdk/scripting-utils/aio";
import { consola } from "consola";
import { colors } from "consola/utils";

import { parseCommerceAppConfig } from "#config/lib/parser";
import { resolveCamsBaseUrl } from "#management/cams/config";
import {
  CamsRecordNotFoundError,
  CamsUnavailableError,
} from "#management/cams/errors";
import { createUpgradeNotifyClient } from "#management/cams/upgrade-notify";

import type { NotifyUpgradeRequest } from "#management/cams/upgrade-notify";

/** The result of the post-deploy upgrade notification. */
export type NotifyResult =
  | { notified: true; extensionId: string }
  | {
      notified: false;
      reason: "not-associated" | "service-unavailable" | "no-service-token";
    };

/**
 * Notifies the Commerce App Management Service that an upgrade is available.
 *
 * The service is the orchestrator: it decides whether to start the upgrade
 * immediately (auto) or wait for the merchant (manual), then executes and polls
 * the app itself. This hook only announces availability and exits — it no longer
 * invokes the app, prints a plan, or waits for the upgrade to run.
 */
export async function run(): Promise<NotifyResult> {
  const appConfig = await parseCommerceAppConfig();
  const { id: metadataId, upgradeMode, version } = appConfig.metadata;

  const { project, namespace } = getAioProjectContext();

  // The service reuses this token to execute and poll the app for an automatic
  // upgrade with no user in the loop, so it must be a SERVICE (technical-account)
  // token — the service rejects a user token. When the workspace has no mintable
  // server-to-server credential the upgrade cannot be announced; that is a soft
  // skip (a deploy must not fail because the upgrade could not be announced), and
  // the next deploy re-announces once a credential is configured.
  let token: string;
  try {
    token = await getServiceToken();
  } catch (error) {
    consola.warn(
      `Could not obtain a service (technical-account) token, so the upgrade notification was skipped: ${
        error instanceof Error ? error.message : String(error)
      }\nAdd an OAuth server-to-server credential to the workspace to enable automatic upgrade notifications.`,
    );
    return { notified: false, reason: "no-service-token" };
  }
  // Target the service host for the app's environment: stage apps talk to the stage
  // host, everything else to production (an explicit override still wins).
  const cliEnv = getAioCliEnv();
  const baseUrl = resolveCamsBaseUrl(process.env, cliEnv);

  // Diagnostics only: kept at debug level so the default (user-facing) output
  // stays clean and never prints the service URL or internal lookup keys.
  consola.debug(
    `[upgrade-notify] target resolved: cliEnv=${cliEnv}, baseUrl=${baseUrl}`,
  );
  consola.debug(
    `[upgrade-notify] record lookup key: workspaceId=${project.workspace.id}, workspaceName=${project.workspace.name}`,
  );

  const request: NotifyUpgradeRequest = {
    metadataId,
    mode: upgradeMode,
    namespace,
    org: { id: project.org.id, imsOrgId: project.org.ims_org_id },
    plan: { to: version },
    workspace: { id: project.workspace.id, name: project.workspace.name },
  };

  consola.log(""); // Whitespace before the output to make it more readable.
  // Call out the stage environment so a stage deploy is not mistaken for prod.
  const envLabel = cliEnv === "stage" ? " (stage)" : "";
  consola.start(
    `Notifying the Commerce App Management Service${envLabel} of the upgrade...`,
  );

  const client = createUpgradeNotifyClient({ baseUrl, token });

  // A deploy must not fail because the upgrade could not be announced. An app that
  // has not been associated yet (no service record) and a temporarily unreachable
  // service are both soft-skips — the next deploy re-announces.
  try {
    const { extensionId } = await client.notify(request);

    const modeLabel =
      upgradeMode === "manual"
        ? "The merchant can start it from the Commerce App Management UI."
        : "It will be started automatically by the service.";

    consola.success(
      `Upgrade notification sent (${colors.cyan(`metadata.upgradeMode: ${upgradeMode}`)}). ${modeLabel}\n`,
    );

    return { extensionId, notified: true };
  } catch (error) {
    if (error instanceof CamsRecordNotFoundError) {
      consola.info(
        "No Commerce App Management record exists for this workspace yet; skipping the upgrade notification. Associate the app first.\n",
      );
      return { notified: false, reason: "not-associated" };
    }
    if (error instanceof CamsUnavailableError) {
      consola.warn(
        "The Commerce App Management Service could not be reached; skipping the upgrade notification. It will be retried on the next deploy.\n",
      );
      return { notified: false, reason: "service-unavailable" };
    }
    throw error;
  }
}

/** Runs the post-app-deploy hook. */
export async function exec() {
  try {
    await run();
  } catch (error) {
    if (error instanceof CommerceSdkValidationError) {
      consola.error(error.display());
    } else {
      consola.error(error);
    }

    process.exit(1);
  }
}
