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
  toCamsResponseError,
} from "#commands/common/cams/errors";
import { CamsHttpClient } from "#commands/common/cams/http-client";

import type { CamsHttpClientParams } from "#commands/common/cams/http-client";

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

/**
 * Creates an API client for the Commerce App Management Service (CAMS).
 * @param params - The parameters to build the HTTP client that will communicate with CAMS.
 */
export function createCamsClient(params: CamsHttpClientParams) {
  const httpClient = new CamsHttpClient(params);

  return {
    findExtension: bind(httpClient, endpoints.findExtension),
    planUpgrade: bind(httpClient, endpoints.planUpgrade),
    pollUpgrade: bind(httpClient, endpoints.pollUpgrade),
    readLatestUpgrade: bind(httpClient, endpoints.readLatestUpgrade),
    startUpgrade: bind(httpClient, endpoints.startUpgrade),
  };
}

/**
 * An API client for CAMS.
 * @see {@link createCamsClient}
 */
export type CamsClient = ReturnType<typeof createCamsClient>;
