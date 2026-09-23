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
  HTTP_CONFLICT,
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_NOT_FOUND,
} from "@adobe/aio-commerce-lib-core/responses";
import ky, { HTTPError } from "ky";
import * as v from "valibot";

import {
  CamsAdoptConflictError,
  CamsRecordNotFoundError,
  CamsUnavailableError,
} from "./errors";

import type { ImsAuthProvider } from "@adobe/aio-commerce-lib-auth";
import type AioLogger from "@adobe/aio-lib-core-logging";
import type { Options } from "ky";
import type { CommerceAppConfigOutputModel } from "#config/schema/app";

/** Identifiers that locate and guard the app's record in the service. */
export type CamsExtensionIdentity = {
  /** Canonical Commerce instance id (the record's natural-key part). */
  commerceId: string;

  /** Adobe I/O Developer Console workspace id (the record's natural-key part). */
  workspaceId: string;

  /**
   * The App Builder application id. Not a lookup key — the service asserts it
   * matches the stored record's `extId` and rejects the adopt on a mismatch, so
   * a different app cannot claim ownership of this record.
   */
  extId: string;
};

/** Status vocabulary accepted by the Commerce App Management Service. */
export type CamsAppStatus =
  | "ASSOCIATED"
  | "PARTIALLY_INSTALLED"
  | "INSTALLED"
  | "UNASSOCIATED"
  | "UPGRADE_AVAILABLE"
  | "UPDATING"
  | "UPDATE_FAILED";

/** A status entry appended to the record's status history. */
export type CamsStatusUpdate = {
  status: CamsAppStatus;
  version?: string;
  error?: { message: string; code?: string };
};

/** Options for {@link createCamsClient}. */
export type CamsClientOptions = {
  /** Commerce App Management Service base URL. */
  baseUrl: string;

  /** The app's own S2S IMS auth provider — its `client_id` becomes the owner. */
  authProvider: ImsAuthProvider;

  /** Identifiers for the record this client operates on. */
  identity: CamsExtensionIdentity;

  /** Logger used to trace adopt/status/config calls. */
  logger: ReturnType<typeof AioLogger>;

  /**
   * `ky` options merged onto the client's defaults (via `ky.extend`), so callers
   * can tune retry, timeout, or add hooks. The built-in auth `beforeRequest` hook
   * is always preserved.
   */
  fetchOptions?: Options;
};

/**
 * A client for the app's own record in the Commerce App Management Service.
 *
 * Every owner-gated write first ensures the record is adopted (ownership bound to
 * the app's S2S `client_id`), so callers never have to sequence the adopt
 * themselves.
 */
export type CamsClient = {
  /**
   * Idempotently adopts the record (`POST /v1/extensions:adopt`) and returns its
   * id. Memoized: the adopt runs at most once per client instance.
   *
   * @throws {CamsAdoptConflictError} The record is owned by another client or the
   *   `extId` does not match — terminal.
   * @throws {CamsRecordNotFoundError} No record exists yet, after retries.
   * @throws {CamsUnavailableError} The service was unreachable or errored.
   */
  ensureAdopted: () => Promise<string>;

  /** Appends a status entry (`POST /v1/extensions/{id}/status`); adopts first. */
  postStatus: (update: CamsStatusUpdate) => Promise<void>;

  /** Patches the stored app config (`PATCH /v1/extensions/{id}`); adopts first. */
  patchConfig: (appConfig: CommerceAppConfigOutputModel) => Promise<void>;
};

/** Backoff schedule (ms) applied to each successive retry, in order. */
export const DEFAULT_RETRY_DELAYS_MS = [250, 500, 1000] as const;

/** Methods eligible for retry — includes the non-idempotent POST/PATCH this client uses. */
const RETRYABLE_METHODS = [
  "get",
  "post",
  "patch",
  "put",
  "head",
  "delete",
] as const;

/** Transient response codes retried on every call. */
const TRANSIENT_STATUS_CODES = [408, 429, 500, 502, 503, 504] as const;

/** Shape of the `:adopt` response — only the record id is consumed. */
const AdoptResponseSchema = v.object({ id: v.string() });

/** Backoff delay for the n-th retry (`attemptCount` is 1-based). */
const retryDelay = (attemptCount: number) =>
  DEFAULT_RETRY_DELAYS_MS.at(attemptCount - 1) ??
  DEFAULT_RETRY_DELAYS_MS.at(-1) ??
  0;

/**
 * Maps a failed adopt request to the matching {@link CamsError}. `409` → terminal
 * conflict; `404` → not-found (retryable); network/`5xx`/other → unavailable
 * (retryable only for network and `5xx`).
 */
async function mapAdoptError(error: unknown): Promise<Error> {
  if (error instanceof v.ValiError) {
    // A 2xx with a payload that doesn't match the contract — not transient.
    return new CamsUnavailableError(
      "The Commerce App Management Service returned a malformed adopt response.",
      { cause: error, retryable: false },
    );
  }

  if (!(error instanceof HTTPError)) {
    // No HTTP response — a transport failure OR a failure minting the S2S token
    // in the auth hook (e.g. IMS `invalid_client`). Both surface here; keep the
    // wording neutral so an auth failure isn't misread as a network outage.
    const message =
      error instanceof Error ? error.message : "Request to the service failed.";
    return new CamsUnavailableError(
      `Failed to reach or authenticate with the Commerce App Management Service: ${message}`,
      { cause: error, retryable: true },
    );
  }

  const { status } = error.response;

  // Prefer the problem+json `detail`; fall back to the status text when the body
  // is missing or not JSON.
  let detail = error.response.statusText;
  try {
    const { detail: bodyDetail } = (await error.response
      .clone()
      .json()) as Record<string, unknown>;
    if (typeof bodyDetail === "string") {
      detail = bodyDetail;
    }
  } catch {
    // Non-JSON body; keep the status-text fallback.
  }

  if (status === HTTP_CONFLICT) {
    return new CamsAdoptConflictError(detail, { cause: error });
  }

  if (status === HTTP_NOT_FOUND) {
    return new CamsRecordNotFoundError(detail, { cause: error });
  }

  return new CamsUnavailableError(
    `The Commerce App Management Service returned HTTP ${status}: ${detail}`,
    { cause: error, retryable: status >= HTTP_INTERNAL_SERVER_ERROR },
  );
}

/**
 * Creates a {@link CamsClient} for a single record, backed by `ky` with the app's
 * S2S auth attached on every request.
 */
export function createCamsClient(options: CamsClientOptions): CamsClient {
  const { authProvider, baseUrl, identity, logger, fetchOptions } = options;

  const baseHttp = ky.create({
    hooks: {
      beforeRequest: [
        async (request) => {
          const headers = await authProvider.getHeaders();
          request.headers.set("Authorization", headers.Authorization);
          const apiKey = headers["x-api-key"];
          if (apiKey) {
            request.headers.set("x-api-key", apiKey);
          }
        },
      ],
      beforeRetry: [
        ({ retryCount }) => {
          logger.debug(
            `Retrying Commerce App Management Service request (attempt ${retryCount})`,
          );
        },
      ],
    },
    prefixUrl: baseUrl,
    retry: {
      delay: retryDelay,
      limit: DEFAULT_RETRY_DELAYS_MS.length,
      methods: [...RETRYABLE_METHODS],
      statusCodes: [...TRANSIENT_STATUS_CODES],
    },
  });

  // `ky.extend` merges the caller's options onto the defaults; hook arrays are
  // concatenated, so the auth `beforeRequest` hook above is always preserved.
  const http = fetchOptions ? baseHttp.extend(fetchOptions) : baseHttp;

  async function adoptOnce(): Promise<string> {
    try {
      const response = await http.post("v1/extensions:adopt", {
        json: identity,
        // Adopt also retries 404 while the just-created record becomes visible.
        // ky deep-merges this onto the base retry (concatenating statusCodes), so
        // it keeps the shared limit/delay and only adds 404 for this call. A 404
        // on the owner-gated status/config calls stays terminal.
        retry: { statusCodes: [HTTP_NOT_FOUND] },
      });
      return v.parse(AdoptResponseSchema, await response.json()).id;
    } catch (error) {
      throw await mapAdoptError(error);
    }
  }

  let adoptedId: Promise<string> | undefined;

  function ensureAdopted(): Promise<string> {
    if (!adoptedId) {
      adoptedId = adoptOnce().catch((error: unknown) => {
        // Drop the memoized rejection so a later call can try again.
        adoptedId = undefined;
        throw error;
      });
    }
    return adoptedId;
  }

  async function postStatus(update: CamsStatusUpdate): Promise<void> {
    const id = await ensureAdopted();
    await http.post(`v1/extensions/${id}/status`, { json: update });
  }

  async function patchConfig(
    appConfig: CommerceAppConfigOutputModel,
  ): Promise<void> {
    const id = await ensureAdopted();
    await http.patch(`v1/extensions/${id}`, { json: { appConfig } });
  }

  return { ensureAdopted, patchConfig, postStatus };
}
