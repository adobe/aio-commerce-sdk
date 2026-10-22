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
import { HTTPError } from "ky";

import * as endpoints from "#commands/common/cams/endpoints";
import {
  CamsClientError,
  readAnswer,
  toCamsResponseError,
} from "#commands/common/cams/errors";
import { CamsHttpClient } from "#commands/common/cams/http-client";

import type { Options } from "ky";
import type {
  CamsHttpClientConfig,
  CamsHttpClientParams,
} from "#commands/common/cams/http-client";
import type { AssociatedCommerceData } from "#management/association/types";
import type { FindAttemptParams } from "./schema";

/** Connection options shared by workspace and instance clients. */
type CamsClientParams = Omit<CamsHttpClientParams, "config"> & {
  config?: Omit<CamsHttpClientConfig, "commerceInstance">;
};

/** A function of the API that takes the HTTP client first and then its own arguments. */
type Endpoint<TArgs extends unknown[], TResult> = (
  httpClient: CamsHttpClient,
  ...args: TArgs
) => Promise<TResult>;

/** Turns a failure of a call into a {@link CamsClientError}. Validation errors pass through. */
async function toCamsError(error: unknown) {
  if (
    error instanceof CamsClientError ||
    error instanceof CommerceSdkValidationError
  ) {
    return error;
  }

  if (error instanceof HTTPError) {
    return await toCamsResponseError(error);
  }

  return new CamsClientError(
    "The Commerce App Management Service could not be reached",
    { cause: error, retryable: true },
  );
}

/** Binds an endpoint to the HTTP client and reports its failures as {@link CamsClientError}. */
function bind<TArgs extends unknown[], TResult>(
  httpClient: CamsHttpClient,
  endpoint: Endpoint<TArgs, TResult>,
) {
  return async (...args: TArgs) => {
    try {
      return await endpoint(httpClient, ...args);
    } catch (error) {
      throw await toCamsError(error);
    }
  };
}

/** Binds a failsafe version of the poll upgrade endpoint that falls back to a normal read upgrade. */
function bindFailsafePollUpgrade(httpClient: CamsHttpClient) {
  return async (params: FindAttemptParams, options?: Options) => {
    try {
      return await endpoints.pollUpgrade(httpClient, params, options);
    } catch (error) {
      if (error instanceof HTTPError && error.response?.status === 409) {
        const { code } = await readAnswer(error.response);

        if (code === "attempt-not-open") {
          // The attempt being polled/synced is not the running one, fallback to a normal GET.
          return await bind(httpClient, endpoints.readUpgrade)(params, {
            ...options,
            retry: 0,
          });
        }
      }

      throw await toCamsError(error);
    }
  };
}

/**
 * Creates a CAMS client for workspace operations without Commerce instance headers.
 * @param params - The parameters to build the HTTP client that will communicate with CAMS.
 */
export function createCamsWorkspaceClient(params: CamsClientParams) {
  const httpClient = new CamsHttpClient(params);

  return {
    findExtension: bind(httpClient, endpoints.findExtension),
  };
}

/**
 * Creates a CAMS client for operations targeting a Commerce instance.
 * @param params - The authentication, configuration and fetch options.
 * @param commerceInstance - The Commerce instance to target.
 */
export function createCamsInstanceClient(
  params: CamsClientParams,
  commerceInstance: AssociatedCommerceData,
) {
  const httpClient = new CamsHttpClient({
    ...params,
    config: { ...params.config, commerceInstance },
  });

  return {
    planUpgrade: bind(httpClient, endpoints.planUpgrade),
    pollUpgrade: bindFailsafePollUpgrade(httpClient),
    readLatestUpgrade: bind(httpClient, endpoints.readLatestUpgrade),
    readUpgrade: bind(httpClient, endpoints.readUpgrade),
    startUpgrade: bind(httpClient, endpoints.startUpgrade),
  };
}

/** A CAMS client for workspace operations. */
export type CamsWorkspaceClient = ReturnType<typeof createCamsWorkspaceClient>;

/** A CAMS client for Commerce instance operations. */
export type CamsInstanceClient = ReturnType<typeof createCamsInstanceClient>;
