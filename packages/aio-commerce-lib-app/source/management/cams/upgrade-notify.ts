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

import ky from "ky";

import { CamsRecordNotFoundError, CamsUnavailableError } from "./errors";

/**
 * The version transition an upgrade notification describes.
 *
 * `from` is best-effort: the deploying CLI does not hold the app's installed
 * baseline version (it lives in runtime state), so the service resolves the
 * authoritative `from` from the app's execute response and reconciles it.
 */
export type UpgradeNotifyPlan = {
  /** The version the app is upgrading from (the current baseline), when known. */
  from?: string;

  /** The version the app is upgrading to (the deployed target). */
  to: string;
};

/**
 * The payload sent to the Commerce App Management Service when a deployed app
 * announces that an upgrade is available.
 *
 * The service derives the app's execute and status URLs from `namespace`, so the
 * notification never carries callable endpoints.
 */
export type NotifyUpgradeRequest = {
  /** Whether the service should start the upgrade automatically or wait for the merchant. */
  mode: "auto" | "manual";

  /** The version transition being announced. */
  plan: UpgradeNotifyPlan;

  /** App Builder Runtime namespace the service derives the app URLs from. */
  namespace: string;

  /** Stable application id (`metadata.id`). */
  metadataId: string;

  /** Adobe organization the app belongs to. */
  org: {
    /** Adobe I/O Developer Console organization id. */
    id: string;

    /** IMS organization id. */
    imsOrgId: string;
  };

  /** Adobe I/O Developer Console workspace the app is deployed to. */
  workspace: {
    /** Workspace id. */
    id: string;

    /** Workspace name. */
    name: string;
  };
};

/** Identifiers that locate the app's record in the service. */
export type UpgradeNotifyIdentity = {
  /** Adobe I/O Developer Console workspace id (the record's natural-key part). */
  workspaceId: string;

  /** Adobe I/O Developer Console workspace name (the record's natural-key part). */
  workspaceName: string;

  /** App Builder application id (`metadata.id`), matched against the stored record. */
  extId: string;
};

/** Options for {@link createUpgradeNotifyClient}. */
export type UpgradeNotifyClientOptions = {
  /** Commerce App Management Service base URL. */
  baseUrl: string;

  /**
   * A SERVICE (technical-account) IMS access token. The service reuses this
   * token to execute and poll the app for an automatic upgrade, so it must not
   * be a user token.
   */
  token: string;

  /** Identifiers for the record this client notifies. */
  identity: UpgradeNotifyIdentity;
};

/** Client that announces an available upgrade to the Commerce App Management Service. */
export type UpgradeNotifyClient = {
  /**
   * Resolves the record id from the workspace natural key, then posts the
   * notification to `POST /v1/extensions/{extensionId}/upgrades:notify`.
   * @returns The resolved record id the notification was sent to.
   * @throws {CamsRecordNotFoundError} No matching record exists for the workspace.
   * @throws {CamsUnavailableError} The service was unreachable or errored.
   */
  notify: (request: NotifyUpgradeRequest) => Promise<{ extensionId: string }>;
};

/** Minimal shape of the record fields this client reads back from the service. */
type ExtensionRecord = {
  id: string;
  extId: string;
};

/**
 * Creates an {@link UpgradeNotifyClient} backed by `ky`, authenticated with the
 * provided service token on every request.
 *
 * The service addresses records by their internal id, which the deploying CLI
 * does not hold, so the client first looks the record up by the workspace
 * natural key before sending the notification.
 */
export function createUpgradeNotifyClient(
  options: UpgradeNotifyClientOptions,
): UpgradeNotifyClient {
  const { baseUrl, identity, token } = options;

  const http = ky.create({
    headers: { Authorization: `Bearer ${token}` },
    prefixUrl: baseUrl,
    retry: 0,
  });

  async function resolveExtensionId(): Promise<string> {
    let records: ExtensionRecord[];
    try {
      records = await http
        .get("v1/extensions", {
          searchParams: {
            workspaceId: identity.workspaceId,
            workspaceName: identity.workspaceName,
          },
        })
        .json<ExtensionRecord[]>();
    } catch (error) {
      throw new CamsUnavailableError(
        `Failed to reach the Commerce App Management Service: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { cause: error, retryable: true },
      );
    }

    const record = records.find((entry) => entry.extId === identity.extId);
    if (!record) {
      throw new CamsRecordNotFoundError(
        `No Commerce App Management Service record was found for application "${identity.extId}" in workspace "${identity.workspaceName}".`,
      );
    }

    return record.id;
  }

  async function notify(
    request: NotifyUpgradeRequest,
  ): Promise<{ extensionId: string }> {
    const extensionId = await resolveExtensionId();

    try {
      await http.post(`v1/extensions/${extensionId}/upgrades:notify`, {
        json: request,
      });
    } catch (error) {
      throw new CamsUnavailableError(
        `The Commerce App Management Service rejected the upgrade notification: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { cause: error, retryable: true },
      );
    }

    return { extensionId };
  }

  return { notify };
}
