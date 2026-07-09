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

import { HTTPError } from "ky";

import {
  AdminUiPermissionDeniedError,
  AdminUiPermissionError,
} from "../../errors";
import { checkPermission } from "../permissions/endpoints";
import { getAclResourceId } from "./acl-resource-id";

import type { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";

const DEFAULT_CACHE_TTL_MS = 300_000;

/** Options used to create an Admin UI SDK permission client. */
export type AdminUiPermissionClientOptions = {
  /** The application's `metadata.id` value. When provided, `check()` and `require()` can be called with no resource argument. */
  appId?: string;
  /**
   * Milliseconds to cache a permission result. Default: 300_000 (5 minutes).
   * Set to 0 to disable result caching. Note: in-flight deduplication of concurrent identical
   * requests is independent of this setting and remains active even when caching is disabled.
   */
  cacheTtlMs?: number;
  /** Return false instead of throwing when a network or parse error occurs. Default: true. */
  denyOnError?: boolean;
  /** Commerce HTTP client used to call the Admin UI SDK permission endpoint. */
  httpClient: AdobeCommerceHttpClient;
};

/** Client for checking the current user's Admin UI SDK resource permissions. */
export type AdminUiPermissionClient = {
  /**
   * Checks whether the current user has the given ACL resource granted.
   *
   * @param resource - The ACL resource id to check. When omitted, defaults to the id derived from `appId`.
   * @returns `true` when granted; `false` when denied, on network or parse errors while `denyOnError` is
   *   `true` (the default), or immediately when neither `resource` nor a valid `appId` is available.
   * @throws {@link AdminUiPermissionError} on HTTP 401, regardless of `denyOnError`.
   */
  check: (resource?: string) => Promise<boolean>;
  /**
   * Clears cached permission results.
   *
   * @param resource - The ACL resource id whose cached result to clear. When omitted, clears all cached
   *   entries and in-flight tracking without aborting outstanding HTTP requests.
   */
  invalidate: (resource?: string) => void;
  /**
   * Resolves when the current user has the given ACL resource granted.
   *
   * @param resource - The ACL resource id to require. When omitted, defaults to the id derived from `appId`.
   * @throws {@link AdminUiPermissionDeniedError} when the resource is explicitly denied.
   * @throws {@link AdminUiPermissionError} on HTTP 401, on network or parse errors while `denyOnError` is
   *   `false`, or immediately when neither `resource` nor a valid `appId` is available.
   */
  require: (resource?: string) => Promise<void>;
};

type PermissionCheckResult =
  | {
      allowed: boolean;
      cacheable: true;
    }
  | {
      error: AdminUiPermissionError;
      cacheable: false;
    };

/** Returns true when the error is an HTTP 401 Unauthorized response from ky. */
function isUnauthorizedError(error: unknown) {
  return error instanceof HTTPError && error.response.status === 401;
}

/** Wraps an arbitrary thrown value in an `AdminUiPermissionError`, passing through instances that are already one. */
function toPermissionError(error: unknown) {
  return error instanceof AdminUiPermissionError
    ? error
    : new AdminUiPermissionError("Permission check failed", {
        cause: error,
      });
}

/**
 * Creates a client for checking Admin UI SDK ACL resources.
 *
 * @param options - Client configuration; see {@link AdminUiPermissionClientOptions}.
 * @returns An {@link AdminUiPermissionClient} for checking and requiring ACL resources.
 */
export function getAdminUiPermissionClient(
  options: AdminUiPermissionClientOptions,
): AdminUiPermissionClient {
  const {
    httpClient,
    appId,
    cacheTtlMs = DEFAULT_CACHE_TTL_MS,
    denyOnError = true,
  } = options;
  const cache = new Map<string, { value: boolean; expiresAt: number }>();
  const inFlight = new Map<string, Promise<PermissionCheckResult>>();

  /**
   * Performs the network request for `resource` and maps the outcome to a `PermissionCheckResult`.
   * Always throws `AdminUiPermissionError` on 401. On other errors, returns a non-cacheable error
   * result when `denyOnError` is true, or re-throws otherwise.
   */
  async function fetchCheck(resource: string): Promise<PermissionCheckResult> {
    try {
      const result = await checkPermission(httpClient, { resource });

      return {
        allowed: result.allowed,
        cacheable: true,
      };
    } catch (error) {
      if (isUnauthorizedError(error)) {
        throw new AdminUiPermissionError("Unauthorized", { cause: error });
      }

      if (denyOnError) {
        return {
          cacheable: false,
          error: toPermissionError(error),
        };
      }

      throw toPermissionError(error);
    }
  }

  /**
   * Returns a permission check result for `resource`, serving from the TTL cache or an
   * in-flight request when available, and falling back to a fresh `fetchCheck` call otherwise.
   * Successful cacheable results are written to the TTL cache once the in-flight promise settles.
   */
  function resolveCheck(resource: string) {
    if (cacheTtlMs > 0) {
      const cached = cache.get(resource);

      if (cached !== undefined && cached.expiresAt > Date.now()) {
        return {
          allowed: cached.value,
          cacheable: true,
        };
      }
    }

    const existing = inFlight.get(resource);

    if (existing !== undefined) {
      return existing;
    }

    const promise = fetchCheck(resource);
    const trackedPromise = promise
      .then((result) => {
        if (
          cacheTtlMs > 0 &&
          result.cacheable &&
          inFlight.get(resource) === trackedPromise
        ) {
          cache.set(resource, {
            expiresAt: Date.now() + cacheTtlMs,
            value: result.allowed,
          });
        }

        return result;
      })
      .finally(() => {
        if (inFlight.get(resource) === trackedPromise) {
          inFlight.delete(resource);
        }
      });

    inFlight.set(resource, trackedPromise);
    return trackedPromise;
  }

  /**
   * Resolves the ACL resource id for a call: uses the explicit argument when provided,
   * otherwise derives it from `appId`. Returns an empty string when neither source yields a
   * valid id, which callers interpret as "no resource available."
   */
  function resolveResource(resource?: string): string {
    return resource ?? getAclResourceId(appId ?? "");
  }

  return {
    async check(resource?: string) {
      const resolved = resolveResource(resource);
      if (resolved === "") {
        return false;
      }
      const result = await resolveCheck(resolved);
      return "error" in result ? false : result.allowed;
    },
    invalidate(resource?: string) {
      if (resource === undefined) {
        cache.clear();
        inFlight.clear();
        return;
      }

      cache.delete(resource);
      inFlight.delete(resource);
    },
    async require(resource?: string) {
      const resolved = resolveResource(resource);
      if (resolved === "") {
        throw new AdminUiPermissionError(
          "No ACL resource ID could be resolved: provide a resource argument or set appId in options",
        );
      }
      const result = await resolveCheck(resolved);

      if ("error" in result) {
        throw result.error;
      }

      if (!result.allowed) {
        throw new AdminUiPermissionDeniedError(resolved);
      }
    },
  };
}
