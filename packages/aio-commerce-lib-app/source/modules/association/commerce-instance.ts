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
  AdobeCommerceHttpClient,
  resolveCommerceHttpClientParams,
} from "@adobe/aio-commerce-lib-api";

import { AppNotAssociatedError } from "../../errors/app-not-associated-error";
import { getAssociationData } from "./association-repository";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
import type { AssociatedCommerceInstance } from "./types";

/**
 * Returns the Commerce instance this app is currently associated with.
 *
 * @param _params - The standard params object every runtime action receives.
 * @throws {AppNotAssociatedError} If the app is not associated, was
 *   unassociated, or was associated by an older SDK that did not store this
 *   data. Re-associating the app resolves the error.
 *
 * @example
 * ```ts
 * import { getCommerceInstance } from "@adobe/aio-commerce-lib-app";
 *
 * export async function main(params) {
 *   const instance = await getCommerceInstance(params);
 *
 *   // instance.baseUrl — e.g. "https://my-store.example.com"
 *   // instance.env     — "saas" | "paas"
 * }
 * ```
 */
export async function getCommerceInstance(
  _params: RuntimeActionParams,
): Promise<AssociatedCommerceInstance> {
  const instance = await getAssociationData();
  if (instance === null) {
    throw new AppNotAssociatedError();
  }
  return instance;
}

/**
 * Returns an initialised `AdobeCommerceHttpClient` for the Commerce instance
 * this app is currently associated with.
 *
 * Internally calls {@link getCommerceInstance} and combines the stored
 * `baseUrl` and `env` with the auth credentials present in `params` to build
 * the client.
 *
 * @param params - The standard params object every runtime action receives.
 * @throws {AppNotAssociatedError} If the app is not associated, was
 *   unassociated, or was associated by an older SDK that did not store this
 *   data. Re-associating the app resolves the error.
 *
 * @example
 * ```ts
 * import { getCommerceClient } from "@adobe/aio-commerce-lib-app";
 *
 * export async function main(params) {
 *   const client = await getCommerceClient(params);
 *   const products = await client.get("rest/V1/products").json();
 * }
 * ```
 */
export async function getCommerceClient(
  params: RuntimeActionParams,
): Promise<AdobeCommerceHttpClient> {
  const instance = await getCommerceInstance(params);

  const httpClientParams = resolveCommerceHttpClientParams({
    ...params,
    AIO_COMMERCE_API_BASE_URL: instance.baseUrl,
    AIO_COMMERCE_API_FLAVOR: instance.env,
  });

  return new AdobeCommerceHttpClient(httpClientParams);
}
