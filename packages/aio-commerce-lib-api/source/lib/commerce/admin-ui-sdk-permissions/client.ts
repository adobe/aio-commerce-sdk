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
import * as v from "valibot";

import {
  AdminUiSdkPermissionDeniedError,
  AdminUiSdkPermissionError,
} from "./errors";
import { permissionCheckResponseSchema } from "./schemas";

import type {
  AdminUiSdkPermissionClient,
  AdminUiSdkPermissionClientOptions,
} from "./types";

const DEFAULT_CACHE_TTL_MS = 300_000;
const CHECK_ENDPOINT = "adminuisdk/permission/check";

type PermissionCheckResult = {
  allowed: boolean;
  cacheable: boolean;
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
      const raw = await httpClient
        .post(CHECK_ENDPOINT, {
          json: { resource },
        })
        .json<unknown>();
      const parsed = v.safeParse(permissionCheckResponseSchema, raw);

      if (!parsed.success) {
        throw new AdminUiSdkPermissionError("Unexpected response shape");
      }

      return {
        allowed: parsed.output.allowed,
        cacheable: true,
      };
    } catch (error) {
      if (isUnauthorizedError(error)) {
        throw new AdminUiSdkPermissionError("Unauthorized", { cause: error });
      }

      if (denyOnError) {
        return {
          allowed: false,
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
      return result.allowed;
    },
    async require(resource: string) {
      const result = await resolveCheck(resource);

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
