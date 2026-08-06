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
import ky from "ky";

// WHY: The Extension Manager's update-status endpoint (spec §7.3) does not exist yet;
// its base URL, the S2S `client_id` -> `extensionId` ownership binding, and the
// ordering/authorization contract for concurrent writes are all still owned by the
// AEM team. Everything below is built and tested against an msw mock only, with an
// injectable placeholder base URL, so the real contract can be finalized later
// without reshaping callers (see Task 17).
const DEFAULT_EM_BASE_URL = "https://placeholder-em.adobe.io";

/** The lifecycle status of an extension update, as reported to the Extension Manager. */
export type UpdateStatus =
  | "UPDATING"
  | "INSTALLED"
  | "UPDATE_FAILED"
  | "UPDATE_REVIEW_REQUIRED";

/** Failure details reported alongside an {@link UpdateStatus} of `UPDATE_FAILED`. */
export type UpdateStatusError = {
  /** A human-readable description of the failure. */
  message: string;
};

/** Input for {@link EmStatusClient.writeUpdateStatus}. */
export type WriteUpdateStatusInput = {
  /** The extension whose update status is being reported. */
  extensionId: string;

  /** The current lifecycle status of the update. */
  status: UpdateStatus;

  /** The version the extension is updating to, when known. */
  version?: string;

  /** Present when `status` is `UPDATE_FAILED`. */
  error?: UpdateStatusError;

  /** ISO timestamp identifying when this status was produced. */
  timestamp: string;
};

/** Parameters used to construct an {@link EmStatusClient}. */
export type EmStatusClientParams = {
  /**
   * The App Builder action inputs (or any object exposing the
   * `AIO_COMMERCE_AUTH_IMS_*` keys) used to resolve S2S IMS auth via
   * `resolveImsAuthParams`.
   */
  auth: Record<string, unknown>;

  /**
   * Overrides the Extension Manager base URL. Defaults to a provisional
   * placeholder pending the §7.3 contract.
   */
  baseUrl?: string;
};

/** A client for reporting extension update status to the Extension Manager. */
export type EmStatusClient = {
  /**
   * Reports the current update status of an extension to the Extension Manager.
   * @param input - The status to report.
   */
  writeUpdateStatus: (input: WriteUpdateStatusInput) => Promise<void>;
};

/**
 * Creates a client for the Extension Manager's update-status endpoint (spec §7.3).
 * @param params - The IMS auth inputs and optional base URL override.
 * @example
 * ```typescript
 * const client = createEmStatusClient({ auth: actionParams });
 * await client.writeUpdateStatus({
 *   extensionId: "my-extension",
 *   status: "INSTALLED",
 *   version: "1.2.0",
 *   timestamp: new Date().toISOString(),
 * });
 * ```
 */
export function createEmStatusClient(
  params: EmStatusClientParams,
): EmStatusClient {
  const baseUrl = params.baseUrl ?? DEFAULT_EM_BASE_URL;
  const authProvider = getImsAuthProvider(resolveImsAuthParams(params.auth));
  const httpClient = ky.create({ prefixUrl: baseUrl });

  return {
    async writeUpdateStatus(input: WriteUpdateStatusInput): Promise<void> {
      const { extensionId, ...body } = input;
      const headers = await authProvider.getHeaders();

      await httpClient.patch(
        `v2/extensions/${encodeURIComponent(extensionId)}/update-status`,
        { headers, json: body },
      );
    },
  };
}
