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

import { consola } from "consola";
import ky, { HTTPError } from "ky";

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
};

/** Client that announces an available upgrade to the Commerce App Management Service. */
export type UpgradeNotifyClient = {
  /**
   * Posts the notification to `POST /v1/extensions:notify-upgrade`. The service
   * resolves the record from the request's `workspace` natural key (scoped to the
   * caller's org) — the deploying CLI never holds the record id.
   * @returns The id of the record the notification was applied to.
   * @throws {CamsRecordNotFoundError} No record exists for the workspace (not associated).
   * @throws {CamsUnavailableError} The service was unreachable or errored.
   */
  notify: (request: NotifyUpgradeRequest) => Promise<{ extensionId: string }>;
};

/** Minimal shape of the upgrade-run response this client reads back. */
type NotifyUpgradeResponse = {
  extensionId: string;
};

/**
 * Creates an {@link UpgradeNotifyClient} backed by `ky`, authenticated with the
 * provided service token on every request.
 *
 * The service resolves the record server-side from the request's `workspace`
 * natural key, so this is a single call — the client does not look the record up.
 */
export function createUpgradeNotifyClient(
  options: UpgradeNotifyClientOptions,
): UpgradeNotifyClient {
  const { baseUrl, token } = options;

  const http = ky.create({
    headers: { Authorization: `Bearer ${token}` },
    prefixUrl: baseUrl,
    retry: 0,
  });

  async function notify(
    request: NotifyUpgradeRequest,
  ): Promise<{ extensionId: string }> {
    // Debug only: the endpoint and request body (service URL, org/workspace ids)
    // must not appear in the default user-facing output.
    consola.debug("[upgrade-notify] POST v1/extensions:notify-upgrade");

    let response: NotifyUpgradeResponse;
    try {
      response = await http
        .post("v1/extensions:notify-upgrade", { json: request })
        .json<NotifyUpgradeResponse>();
    } catch (error) {
      if (error instanceof HTTPError) {
        const { response: errorResponse } = error;
        // A 404 means the app has no record for this workspace yet (not associated, or not installed
        // for this Commerce instance). Announcing an upgrade only makes sense for an installed app, so
        // this is an expected soft-skip on a fresh/not-yet-installed deploy — not a failure, and not
        // logged as an error.
        if (errorResponse.status === 404) {
          throw new CamsRecordNotFoundError(
            "No Commerce App Management Service record exists for this workspace.",
            { cause: error },
          );
        }
        const body = await errorResponse
          .text()
          .catch(() => "<unreadable body>");
        consola.error(
          `[upgrade-notify] notify failed: HTTP ${errorResponse.status} ${errorResponse.url} -> ${body}`,
        );
      } else {
        consola.error("[upgrade-notify] notify failed (non-HTTP):", error);
      }
      throw new CamsUnavailableError(
        `The Commerce App Management Service rejected the upgrade notification: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { cause: error, retryable: true },
      );
    }

    // Internal confirmation; the user-facing success is printed by the caller.
    consola.debug(
      `[upgrade-notify] notify accepted for extensionId=${response.extensionId}`,
    );

    return { extensionId: response.extensionId };
  }

  return { notify };
}
