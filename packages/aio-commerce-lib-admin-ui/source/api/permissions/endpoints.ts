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

import { parseOrThrow } from "@aio-commerce-sdk/common-utils/valibot";

import { permissionCheckResponseSchema } from "./schema";

import type { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
import type { HTTPError } from "ky";
import type { PermissionCheckResponse } from "./schema";

/** Parameters for POST /V1/adminuisdk/permission/check. */
type PermissionCheckParams = {
  resource: string;
};

/**
 * Checks whether the current user has the given ACL resource granted via POST /V1/adminuisdk/permission/check.
 * This is the raw HTTP call — prefer {@link getAdminUiPermissionClient} for caching and deduplication.
 *
 * @param httpClient - The {@link AdobeCommerceHttpClient} to use to make the request.
 * @param params - The resource to check.
 *
 * @throws {@link HTTPError} if the response status is not in the 2xx range.
 */
export async function checkPermission(
  httpClient: AdobeCommerceHttpClient,
  params: PermissionCheckParams,
): Promise<PermissionCheckResponse> {
  const raw = await httpClient
    .post("adminuisdk/permission/check", {
      json: { resource: params.resource },
    })
    .json();

  return parseOrThrow(permissionCheckResponseSchema, raw);
}
