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
  createHeaderAccessor,
  getHeader,
  parseBearerToken,
} from "@adobe/aio-commerce-lib-core/headers";
import {
  parseOrThrow,
  stringValueSchema,
} from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

import type { ImsAuthHeaders, ImsAuthProvider } from "./types";

const IMS_AUTH_TOKEN_PARAM = "AIO_COMMERCE_IMS_AUTH_TOKEN";
const IMS_AUTH_API_KEY_PARAM = "AIO_COMMERCE_IMS_AUTH_API_KEY";

export const ImsAuthParamsInputSchema = v.looseObject({
  [IMS_AUTH_TOKEN_PARAM]: stringValueSchema(IMS_AUTH_TOKEN_PARAM),
  [IMS_AUTH_API_KEY_PARAM]: v.optional(
    stringValueSchema(IMS_AUTH_API_KEY_PARAM),
  ),
});

const ForwardedImsAuthSourceSchema = v.variant("from", [
  v.object({
    from: v.literal("headers"),
    headers: v.record(v.string(), v.optional(v.string())),
  }),
  v.object({
    from: v.literal("getter"),
    getHeaders: v.custom<() => ImsAuthHeaders | Promise<ImsAuthHeaders>>(
      (input) => typeof input === "function",
      "Expected a function for getHeaders",
    ),
  }),
  v.object({
    from: v.literal("params"),
    params: ImsAuthParamsInputSchema,
  }),
]);

/**
 * Discriminated union for different sources of forwarded IMS auth credentials.
 *
 * - `headers`: Extract credentials from a raw headers object (e.g. an HTTP request).
 * - `getter`: Use a function that returns IMS auth headers (sync or async).
 * - `params`: Read credentials from a params object using `AIO_COMMERCE_IMS_AUTH_TOKEN` and `AIO_COMMERCE_IMS_AUTH_API_KEY` keys.
 */
export type ForwardedImsAuthSource = v.InferOutput<
  typeof ForwardedImsAuthSourceSchema
>;

/**
 * Creates an {@link ImsAuthProvider} by forwarding authentication credentials from various sources.
 *
 * @param source The source of the credentials to forward, as a {@link ForwardedImsAuthSource}.
 * @returns An {@link ImsAuthProvider} instance that returns the forwarded access token and headers.
 *
 * @throws {CommerceSdkValidationError} If the source object is invalid.
 * @throws {CommerceSdkValidationError} If `from: "headers"` is used and the `Authorization` header is missing.
 * @throws {CommerceSdkValidationError} If `from: "headers"` is used and the `Authorization` header is not in Bearer token format.
 * @throws {CommerceSdkValidationError} If `from: "params"` is used and `AIO_COMMERCE_IMS_AUTH_TOKEN` is missing or empty.
 *
 * @example
 * ```typescript
 * import { getForwardedImsAuthProvider } from "@adobe/aio-commerce-lib-auth";
 *
 * // From raw headers (e.g. from an HTTP request).
 * const provider1 = getForwardedImsAuthProvider({
 *   from: "headers",
 *   headers: params.__ow_headers,
 * });
 *
 * // From async getter (e.g. fetch from secret manager)
 * const provider2 = getForwardedImsAuthProvider({
 *   from: "getter",
 *   getHeaders: async () => {
 *     const token = await secretManager.getSecret("ims-token");
 *     return { Authorization: `Bearer ${token}` };
 *   },
 * });
 *
 * // From a params object (using AIO_COMMERCE_IMS_AUTH_TOKEN and AIO_COMMERCE_IMS_AUTH_API_KEY keys)
 * const provider3 = getForwardedImsAuthProvider({
 *   from: "params",
 *   params: actionParams,
 * });
 *
 * // Use the provider
 * const token = await provider1.getAccessToken();
 * const headers = await provider1.getHeaders();
 * ```
 */
export function getForwardedImsAuthProvider(
  source: v.InferInput<typeof ForwardedImsAuthSourceSchema>,
): ImsAuthProvider {
  const validatedSource = parseOrThrow(
    ForwardedImsAuthSourceSchema,
    source,
    "Invalid forwarded IMS auth source",
  );

  // biome-ignore lint/style/useDefaultSwitchClause: `parseOrThrow` catches invalid sources.
  switch (validatedSource.from) {
    case "headers": {
      const { authorization } = createHeaderAccessor(validatedSource.headers, [
        "Authorization",
      ]);

      const apiKey = getHeader(validatedSource.headers, "x-api-key");
      const { token } = parseBearerToken(authorization);

      return {
        getAccessToken: () => token,
        getHeaders: () => {
          const imsHeaders: ImsAuthHeaders = {
            Authorization: `Bearer ${token}`,
          };

          if (apiKey) {
            imsHeaders["x-api-key"] = apiKey;
          }

          return imsHeaders;
        },
      };
    }

    case "getter": {
      return {
        getHeaders: validatedSource.getHeaders,
        getAccessToken: async () => {
          const headers = await validatedSource.getHeaders();
          const { token } = parseBearerToken(headers.Authorization);
          return token;
        },
      };
    }

    case "params": {
      const { params } = validatedSource;
      const accessToken = params[IMS_AUTH_TOKEN_PARAM];
      const apiKey = params[IMS_AUTH_API_KEY_PARAM];

      return {
        getAccessToken: () => accessToken,
        getHeaders: () => {
          const imsHeaders: ImsAuthHeaders = {
            Authorization: `Bearer ${accessToken}`,
          };

          if (apiKey) {
            imsHeaders["x-api-key"] = apiKey;
          }

          return imsHeaders;
        },
      };
    }
  }
}
