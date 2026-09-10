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

import ky, { HTTPError } from "ky";

import {
  CamsAdoptConflictError,
  CamsRecordNotFoundError,
  CamsUnavailableError,
} from "./errors";

import type { ImsAuthProvider } from "@adobe/aio-commerce-lib-auth";
import type AioLogger from "@adobe/aio-lib-core-logging";

/** Identifiers that locate and guard the app's record in the service. */
export type CamsExtensionIdentity = {
  /** Canonical Commerce instance id (the record's natural-key part). */
  commerceId: string;

  /** Adobe I/O Developer Console workspace id (the record's natural-key part). */
  workspaceId: string;

  /** App Builder application id — asserted against the stored record. */
  extId: string;
};

/** A status entry appended to the record's status history. */
export type CamsStatusUpdate = {
  status: string;
  version?: string;
  error?: { message: string; code?: string };
};

/**
 * A record as returned by the service's extension list, narrowed to the fields
 * the app needs to locate its own record.
 */
export type CamsExtensionRecord = {
  /** The record's id (its table id) — the address for status writes. */
  id: string;
  commerceId: string;
  workspaceId: string;
  workspaceName: string;
};

/** Options for {@link createCamsClient}. */
export type CamsClientOptions = {
  /** Commerce App Management Service base URL. */
  baseUrl: string;

  /** The app's own S2S IMS auth provider — its `client_id` becomes the owner. */
  authProvider: ImsAuthProvider;

  /**
   * Identifiers for the record this client adopts. Optional: the status-by-id
   * and workspace-lookup methods address a record directly and do not need it;
   * only {@link CamsClient.ensureAdopted} (and the adopt-first writes) require it.
   */
  identity?: CamsExtensionIdentity;

  logger: ReturnType<typeof AioLogger>;

  /**
   * Backoff schedule (ms) for retrying a transient adopt failure; its length is
   * the retry count. Defaults to {@link DEFAULT_ADOPT_RETRY_DELAYS_MS}.
   */
  retryDelaysMs?: readonly number[];
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
  patchConfig: (appConfig: unknown) => Promise<void>;

  /**
   * Lists the caller-owned records for a workspace
   * (`GET /v1/extensions?workspaceId=&workspaceName=`). A service caller only
   * sees records it owns, so this locates the app's own record — and its id —
   * without adopting. Used to recover the id for apps that adopted before the id
   * was persisted.
   */
  findOwnedByWorkspace: (
    workspaceId: string,
    workspaceName: string,
  ) => Promise<CamsExtensionRecord[]>;

  /**
   * Appends a status entry to a record addressed directly by its id
   * (`POST /v1/extensions/{id}/status`), without adopting. The caller must
   * already own the record (ownership binds at adopt time).
   */
  postStatusToId: (id: string, update: CamsStatusUpdate) => Promise<void>;
};

/** Default backoff schedule (ms) for retrying a transient adopt failure. */
export const DEFAULT_ADOPT_RETRY_DELAYS_MS = [250, 500, 1000] as const;

const HTTP_NOT_FOUND = 404;
const HTTP_CONFLICT = 409;
const HTTP_SERVER_ERROR_MIN = 500;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Reads a JSON body defensively, returning `undefined` on any failure. */
async function readJsonBody(
  response: Response,
): Promise<Record<string, unknown> | undefined> {
  try {
    return (await response.clone().json()) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

/**
 * Maps a failed adopt request to the matching {@link CamsError}. `409` → terminal
 * conflict; `404` → not-found (retryable); network/`5xx`/other → unavailable
 * (retryable only for network and `5xx`).
 */
async function mapAdoptError(error: unknown): Promise<Error> {
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
  const body = await readJsonBody(error.response);
  const detail =
    typeof body?.detail === "string" ? body.detail : error.response.statusText;

  if (status === HTTP_CONFLICT) {
    return new CamsAdoptConflictError(detail, { cause: error });
  }

  if (status === HTTP_NOT_FOUND) {
    return new CamsRecordNotFoundError(detail, { cause: error });
  }

  return new CamsUnavailableError(
    `The Commerce App Management Service returned HTTP ${status}: ${detail}`,
    { cause: error, retryable: status >= HTTP_SERVER_ERROR_MIN },
  );
}

/**
 * Creates a {@link CamsClient} for a single record, backed by `ky` with the app's
 * S2S auth attached on every request.
 */
export function createCamsClient(options: CamsClientOptions): CamsClient {
  const {
    authProvider,
    baseUrl,
    identity,
    logger,
    retryDelaysMs = DEFAULT_ADOPT_RETRY_DELAYS_MS,
  } = options;

  const http = ky.create({
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
    },
    prefixUrl: baseUrl,
    // Own the retry loop so we can distinguish retryable (404/5xx) from terminal
    // (409) responses; ky's built-in retry cannot inspect the problem+json body.
    retry: 0,
  });

  async function adoptOnce(): Promise<string> {
    try {
      const response = await http.post("v1/extensions:adopt", {
        json: identity as CamsExtensionIdentity,
      });
      const body = (await response.json()) as { id: string };
      return body.id;
    } catch (error) {
      throw await mapAdoptError(error);
    }
  }

  async function adoptWithRetry(): Promise<string> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
      try {
        // Retries are a sequential backoff by design — each attempt waits on the
        // previous one's outcome, so awaiting in the loop is intentional here.
        // biome-ignore lint/performance/noAwaitInLoops: sequential retry/backoff
        return await adoptOnce();
      } catch (error) {
        lastError = error;

        const isRetryable =
          error instanceof CamsUnavailableError
            ? error.retryable
            : error instanceof CamsRecordNotFoundError;

        if (isRetryable && attempt < retryDelaysMs.length) {
          logger.debug(
            `Adopt attempt ${attempt + 1} failed (retryable); retrying`,
          );
          await sleep(retryDelaysMs[attempt]);
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  let adoptedId: Promise<string> | undefined;

  function ensureAdopted(): Promise<string> {
    if (!identity) {
      return Promise.reject(
        new Error(
          "Cannot adopt a Commerce App Management Service record without an identity.",
        ),
      );
    }
    if (!adoptedId) {
      adoptedId = adoptWithRetry().catch((error: unknown) => {
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

  async function patchConfig(appConfig: unknown): Promise<void> {
    const id = await ensureAdopted();
    await http.patch(`v1/extensions/${id}`, { json: { appConfig } });
  }

  async function findOwnedByWorkspace(
    workspaceId: string,
    workspaceName: string,
  ): Promise<CamsExtensionRecord[]> {
    const response = await http.get("v1/extensions", {
      searchParams: { workspaceId, workspaceName },
    });
    const body = (await response.json()) as {
      id: string;
      scope?: {
        commerceId?: string;
        workspaceId?: string;
        workspaceName?: string;
      };
    }[];
    return body.map((record) => ({
      commerceId: record.scope?.commerceId ?? "",
      id: record.id,
      workspaceId: record.scope?.workspaceId ?? "",
      workspaceName: record.scope?.workspaceName ?? "",
    }));
  }

  async function postStatusToId(
    id: string,
    update: CamsStatusUpdate,
  ): Promise<void> {
    await http.post(`v1/extensions/${id}/status`, { json: update });
  }

  return {
    ensureAdopted,
    findOwnedByWorkspace,
    patchConfig,
    postStatus,
    postStatusToId,
  };
}
