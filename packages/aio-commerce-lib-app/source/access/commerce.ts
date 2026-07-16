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

import { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";

import { AssociationRecordNotFoundError } from "#errors/association-record-not-found-error";
import { getAssociationData } from "#management/association/association-repository";

import type { CommerceHttpClientParams } from "@adobe/aio-commerce-lib-api";
import type {
  ImsAuthParams,
  ImsAuthProvider,
} from "@adobe/aio-commerce-lib-auth";
import type { AssociatedCommerceData } from "#management/association/types";

/**
 * Returns the Commerce instance this app is currently associated with.
 *
 * @throws {AssociationRecordNotFoundError} If the app is not associated, was
 *   unassociated, or was associated by an older SDK that did not store this
 *   data. Re-associating the app resolves the error.
 *
 * @example
 * ```ts
 * import { getCommerceInstance } from "@adobe/aio-commerce-lib-app";
 *
 * export async function main() {
 *   const instance = await getCommerceInstance();
 *
 *   // instance.baseUrl — e.g. "https://my-store.example.com"
 *   // instance.env     — "saas" | "paas"
 * }
 * ```
 */
export async function getCommerceInstance(): Promise<AssociatedCommerceData> {
  const data = await getAssociationData();
  if (!data?.commerce) {
    throw new AssociationRecordNotFoundError();
  }
  return data.commerce;
}

/**
 * Returns an initialised `AdobeCommerceHttpClient` for the Commerce instance
 * this app is currently associated with.
 *
 * The base URL and flavor come from the stored association data
 * ({@link getCommerceInstance}); the caller supplies the resolved IMS auth.
 *
 * @param auth - Resolved IMS auth params or an IMS auth provider.
 * @param fetchOptions - Optional global fetch options forwarded to the
 *   underlying `AdobeCommerceHttpClient` (e.g. `headers`, `timeout`, `retry`).
 * @throws {AssociationRecordNotFoundError} If the app is not associated, was
 *   unassociated, or was associated by an older SDK that did not store this
 *   data. Re-associating the app resolves the error.
 *
 * @example
 * ```ts
 * import { getCommerceClient } from "@adobe/aio-commerce-lib-app";
 * import { resolveImsAuthParams } from "@adobe/aio-commerce-lib-auth";
 *
 * export async function main(params) {
 *   const client = await getCommerceClient(resolveImsAuthParams(params));
 *   const products = await client.get("products").json();
 * }
 * ```
 */
export async function getCommerceClient(
  auth: ImsAuthParams | ImsAuthProvider,
  fetchOptions?: CommerceHttpClientParams["fetchOptions"],
): Promise<AdobeCommerceHttpClient> {
  const instance = await getCommerceInstance();

  // `CommerceHttpClientParams` is a flavor-discriminated union; the stored env
  // is a runtime value TypeScript cannot narrow against the auth union, so the
  // assembled params are asserted to the resolved shape.
  return new AdobeCommerceHttpClient({
    auth,
    config: { baseUrl: instance.baseUrl, flavor: instance.env },
    fetchOptions,
  } as CommerceHttpClientParams);
}
