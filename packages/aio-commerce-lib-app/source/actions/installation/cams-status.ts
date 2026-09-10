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

import {
  getImsAuthProvider,
  resolveImsAuthParams,
} from "@adobe/aio-commerce-lib-auth";

import {
  getAssociationData,
  setAssociationData,
} from "#management/association/repository";
import { createCamsClient, resolveCamsBaseUrl } from "#management/cams/index";

import type { AssociationData } from "#management/association/types";
import type { CamsClient, CamsStatusUpdate } from "#management/cams/index";
import type { LifecycleContext } from "#management/index";
import type { LifecycleExecutionRouteParams } from "./common";

/**
 * Auto-upgrade status values the Commerce App Management Service accepts. The app
 * reports `updating` before it starts applying an upgrade, then `installed` on
 * success or `updateFailed` on failure.
 */
export const UPGRADE_STATUS = {
  installed: "INSTALLED",
  updateFailed: "UPDATE_FAILED",
  updating: "UPDATING",
} as const;

/**
 * Reports auto-upgrade status to the Commerce App Management Service. Every method
 * is best-effort: a failure to reach or authenticate with the service is logged
 * and swallowed so it never blocks or fails the upgrade.
 */
export type UpgradeStatusReporter = {
  updating: (version: string) => Promise<void>;
  installed: (version: string) => Promise<void>;
  updateFailed: (
    version: string,
    error?: { message: string; code?: string },
  ) => Promise<void>;
};

type CreateUpgradeStatusReporterArgs = {
  params: LifecycleExecutionRouteParams;
  logger: LifecycleContext["logger"];
};

/**
 * Resolves the app's record id in the Commerce App Management Service.
 *
 * Prefers the id persisted at association. When it is absent — an app that
 * adopted before the id was persisted — it recovers the id by listing the
 * records the app owns for its workspace (a service caller only sees its own),
 * then backfills it into the association record so later flows skip the lookup.
 * Returns `undefined` when no owned record exists yet (e.g. an app associated
 * before ownership adoption existed), so auto-upgrade keeps working.
 */
async function resolveExtensionId(
  camsClient: CamsClient,
  association: AssociationData,
  workspaceId: string,
  workspaceName: string,
  logger: CreateUpgradeStatusReporterArgs["logger"],
): Promise<string | undefined> {
  if (association.camsExtensionId) {
    return association.camsExtensionId;
  }

  logger.info(
    "Auto-upgrade status reporting: no record id persisted; recovering it from the owned records for this workspace",
  );
  const owned = await camsClient.findOwnedByWorkspace(
    workspaceId,
    workspaceName,
  );

  // A workspace usually owns one record; if it owns several (multiple Commerce
  // instances), match on the persisted commerceId. Without a unique match the
  // record is ambiguous, so skip rather than write to the wrong one.
  const match =
    owned.length === 1
      ? owned[0]
      : owned.find((record) => record.commerceId === association.commerceId);

  if (!match) {
    logger.info(
      `Skipping auto-upgrade status reporting: could not resolve the app's record id (found ${owned.length} owned record(s) for this workspace). The app may not be adopted yet.`,
    );
    return undefined;
  }

  try {
    await setAssociationData({ ...association, camsExtensionId: match.id });
    logger.info(
      `Auto-upgrade status reporting: recovered and persisted record id "${match.id}"`,
    );
  } catch (error) {
    // Backfill is an optimization; a failure only means the next upgrade repeats
    // the lookup, so report status anyway.
    logger.warn(
      `Could not persist the recovered Commerce App Management Service record id; status reporting continues: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  return match.id;
}

/**
 * Builds an {@link UpgradeStatusReporter} that reports auto-upgrade status by the
 * app's record id. The id is resolved from the association record (or recovered
 * from the service), so no per-write adopt — and therefore no `commerceId`/`extId`
 * identity — is needed. Returns `undefined` when the id cannot be resolved
 * (missing workspace info, or no owned record yet), so auto-upgrade keeps working.
 */
export async function createUpgradeStatusReporter({
  params,
  logger,
}: CreateUpgradeStatusReporterArgs): Promise<
  UpgradeStatusReporter | undefined
> {
  logger.info(
    "Auto-upgrade status reporting: resolving the app's Commerce App Management Service record",
  );

  const workspaceId = params.appData?.workspaceId;
  const workspaceName = params.appData?.workspaceName;

  let extensionId: string | undefined;
  let camsClient: CamsClient;
  try {
    const association = await getAssociationData();

    if (!association) {
      logger.info(
        "Skipping auto-upgrade status reporting: the app is not associated with a Commerce instance",
      );
      return undefined;
    }

    if (!(workspaceId && workspaceName)) {
      logger.info(
        "Skipping auto-upgrade status reporting: the request is missing workspace information (workspaceId/workspaceName)",
      );
      return undefined;
    }

    const baseUrl = resolveCamsBaseUrl(params);
    camsClient = createCamsClient({
      authProvider: getImsAuthProvider(resolveImsAuthParams(params)),
      baseUrl,
      logger,
    });

    extensionId = await resolveExtensionId(
      camsClient,
      association,
      workspaceId,
      workspaceName,
      logger,
    );
  } catch (error) {
    logger.warn(
      `Skipping auto-upgrade status reporting; could not resolve the app's record or build the Commerce App Management Service client: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return undefined;
  }

  if (!extensionId) {
    return undefined;
  }

  const recordId = extensionId;
  const report = async (update: CamsStatusUpdate) => {
    logger.info(
      `Reporting auto-upgrade status "${update.status}"${
        update.version ? ` (version ${update.version})` : ""
      } to the Commerce App Management Service (record "${recordId}")`,
    );
    try {
      await camsClient.postStatusToId(recordId, update);
      logger.info(
        `Reported auto-upgrade status "${update.status}" to the Commerce App Management Service`,
      );
    } catch (error) {
      logger.warn(
        `Failed to report auto-upgrade status "${update.status}" to the Commerce App Management Service: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  };

  return {
    installed: (version) =>
      report({ status: UPGRADE_STATUS.installed, version }),
    updateFailed: (version, error) =>
      report({ error, status: UPGRADE_STATUS.updateFailed, version }),
    updating: (version) => report({ status: UPGRADE_STATUS.updating, version }),
  };
}
