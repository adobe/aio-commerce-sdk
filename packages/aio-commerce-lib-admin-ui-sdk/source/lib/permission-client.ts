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

import { checkPermission } from "#api/permissions/endpoints";
import {
  AdminUiSdkPermissionDeniedError,
  AdminUiSdkPermissionError,
} from "#errors";

import type { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";

const DEFAULT_CACHE_TTL_MS = 300_000;

/** Options used to create an Admin UI SDK permission client. */
export interface AdminUiSdkPermissionClientOptions {
  /** Milliseconds to cache a permission result. Default: 300_000 (5 minutes). Set to 0 to disable caching. */
  cacheTtlMs?: number;
  /** Return false instead of throwing when a network or parse error occurs. Default: true. */
  denyOnError?: boolean;
  /** Commerce HTTP client used to call the Admin UI SDK permission endpoint. */
  httpClient: AdobeCommerceHttpClient;
}

/** Client for checking the current user's Admin UI SDK resource permissions. */
export interface AdminUiSdkPermissionClient {
  /**
   * Returns `true` if the current user has the given resource granted, `false` if denied.
   * Returns `false` on network or parse errors when `denyOnError: true` (default).
   * Always throws `AdminUiSdkPermissionError` on 401, regardless of `denyOnError`.
   */
  check(resource: string): Promise<boolean>;
  /**
   * Clears the cached result for `resource`. If called without an argument, clears
   * all cached entries and in-flight tracking without aborting outstanding HTTP requests.
   */
  invalidate(resource?: string): void;
  /**
   * Resolves when the current user has the given resource granted.
   * Throws `AdminUiSdkPermissionDeniedError` if denied.
   * Throws `AdminUiSdkPermissionError` on 401, network, and parse errors.
   */
  require(resource: string): Promise<void>;
}

type PermissionCheckResult =
  | {
      allowed: boolean;
      cacheable: true;
    }
  | {
      error: AdminUiSdkPermissionError;
      cacheable: false;
    };

function isUnauthorizedError(error: unknown) {
  return error instanceof HTTPError && error.response.status === 401;
}

function toPermissionError(error: unknown) {
  return error instanceof AdminUiSdkPermissionError
    ? error
    : new AdminUiSdkPermissionError("Permission check failed", {
        cause: error,
      });
}

/** Creates a client for checking Admin UI SDK ACL resources. */
export function getAdminUiSdkPermissionClient(
  options: AdminUiSdkPermissionClientOptions,
): AdminUiSdkPermissionClient {
  const {
    httpClient,
    cacheTtlMs = DEFAULT_CACHE_TTL_MS,
    denyOnError = true,
  } = options;
  const cache = new Map<string, { value: boolean; expiresAt: number }>();
  const inFlight = new Map<string, Promise<PermissionCheckResult>>();

  async function fetchCheck(resource: string): Promise<PermissionCheckResult> {
    try {
      const result = await checkPermission(httpClient, { resource });

      return {
        allowed: result.allowed,
        cacheable: true,
      };
    } catch (error) {
      if (isUnauthorizedError(error)) {
        throw new AdminUiSdkPermissionError("Unauthorized", { cause: error });
      }

      if (denyOnError) {
        return {
          error: toPermissionError(error),
          cacheable: false,
        };
      }

      throw toPermissionError(error);
    }
  }

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
            value: result.allowed,
            expiresAt: Date.now() + cacheTtlMs,
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

  return {
    async check(resource: string) {
      const result = await resolveCheck(resource);
      return "error" in result ? false : result.allowed;
    },
    async require(resource: string) {
      const result = await resolveCheck(resource);

      if ("error" in result) {
        throw result.error;
      }

      if (!result.allowed) {
        throw new AdminUiSdkPermissionDeniedError(resource);
      }
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
  };
}
