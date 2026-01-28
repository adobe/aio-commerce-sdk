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
  getHeadersFromParams,
  parseBearerToken,
} from "@adobe/aio-commerce-lib-core/headers";
import {
  parseOrThrow,
  stringValueSchema,
} from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";
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

/**
 * Creates an {@link ImsAuthProvider} by forwarding authentication credentials from incoming
 * runtime action request headers.
 *
 * This is a convenience wrapper around {@link getForwardedImsAuthProvider} for the common case
 * of forwarding credentials from Adobe I/O Runtime action parameters.
 *
 * @param params The runtime action parameters containing the `__ow_headers` object with authentication headers.
 * @returns An {@link ImsAuthProvider} instance that returns the forwarded access token and headers.
 *
 * @throws {Error} If the `Authorization` header is missing from the request headers.
 * @throws {Error} If the `Authorization` header is not in the correct Bearer token format.
 *
 * @example
 * ```typescript
 * import { forwardImsAuthProviderFromRequest } from "@adobe/aio-commerce-lib-auth";
 *
 * // In an Adobe I/O Runtime action
 * async function main(params) {
 *   // params.__ow_headers contains: { Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."}
 *
 *   // Forward the authentication from the incoming request
 *   const authProvider = forwardImsAuthProviderFromRequest(params);
 *
 *   // Get the forwarded access token
 *   const token = await authProvider.getAccessToken();
 *   console.log(token); // "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."
 *
 *   // Get headers for downstream API requests
 *   const headers = await authProvider.getHeaders();
 *   console.log(headers);
 *   // {
 *   //   Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
 *   //   "x-api-key": "client-id-from-request" // Only if present in original request
 *   // }
 *
 *   // Use the forwarded credentials in downstream API calls
 *   const response = await fetch('...', {
 *     headers: await authProvider.getHeaders()
 *   });
 *
 *   return { statusCode: 200, body: await response.json() };
 * }
 * ```
 */
export function forwardImsAuthProviderFromRequest(
  params: RuntimeActionParams,
): ImsAuthProvider {
  return getForwardedImsAuthProvider({
    from: "headers",
    headers: getHeadersFromParams(params),
  });
}

/**
 * Creates an {@link ImsAuthProvider} by forwarding authentication credentials from a params object.
 *
 * This is a convenience wrapper around {@link getForwardedImsAuthProvider} for the common case
 * of forwarding credentials from runtime action parameters. It reads:
 * - `AIO_COMMERCE_IMS_AUTH_TOKEN` for the access token (required)
 * - `AIO_COMMERCE_IMS_AUTH_API_KEY` for the API key (optional)
 *
 * @param params The params object containing the authentication credentials.
 * @returns An {@link ImsAuthProvider} instance that returns the access token and headers from the params.
 *
 * @throws {CommerceSdkValidationError} If `AIO_COMMERCE_IMS_AUTH_TOKEN` is not set or is empty.
 *
 * @example
 * ```typescript
 * import { forwardImsAuthProviderFromParams } from "@adobe/aio-commerce-lib-auth";
 *
 * // In an Adobe I/O Runtime action
 * async function main(params) {
 *   // params contains: { AIO_COMMERCE_IMS_AUTH_TOKEN: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..." }
 *   const authProvider = forwardImsAuthProviderFromParams(params);
 *
 *   // Get the access token
 *   const token = await authProvider.getAccessToken();
 *
 *   // Get headers for downstream API requests
 *   const headers = await authProvider.getHeaders();
 *   // {
 *   //   Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
 *   //   "x-api-key": "my-api-key" // Only if AIO_COMMERCE_IMS_AUTH_API_KEY is set
 *   // }
 * }
 * ```
 */
export function forwardImsAuthProviderFromParams(
  params: Record<string, unknown>,
): ImsAuthProvider {
  const validatedParams = parseOrThrow(
    ImsAuthParamsInputSchema,
    params,
    "Missing AIO_COMMERCE_IMS_AUTH_TOKEN in params",
  );
  return getForwardedImsAuthProvider({
    from: "params",
    params: validatedParams,
  });
}

/**
 * Creates an {@link ImsAuthProvider} by forwarding authentication credentials from runtime action parameters.
 *
 * This function automatically detects the source of credentials by trying multiple strategies in order:
 * 1. **Params token** - Looks for `AIO_COMMERCE_IMS_AUTH_TOKEN` (and optionally `AIO_COMMERCE_IMS_AUTH_API_KEY`) in the params object
 * 2. **HTTP headers** - Falls back to extracting the `Authorization` header from `__ow_headers`
 *
 * Use this function when building actions that receive authenticated requests and need to forward
 * those credentials to downstream services (proxy pattern).
 *
 * @param params The runtime action parameters object. Can contain either:
 *   - `AIO_COMMERCE_IMS_AUTH_TOKEN` and optionally `AIO_COMMERCE_IMS_AUTH_API_KEY` for direct token forwarding
 *   - `__ow_headers` with an `Authorization` header for HTTP request forwarding
 * @returns An {@link ImsAuthProvider} instance that returns the forwarded access token and headers.
 *
 * @throws {Error} If neither a valid token param nor Authorization header is found.
 *
 * @example
 * ```typescript
 * import { forwardImsAuthProvider } from "@adobe/aio-commerce-lib-auth";
 *
 * export async function main(params: Record<string, unknown>) {
 *   // Automatically detects credentials from params or headers
 *   const authProvider = forwardImsAuthProvider(params);
 *
 *   // Get the access token
 *   const token = await authProvider.getAccessToken();
 *
 *   // Get headers for downstream API requests
 *   const headers = await authProvider.getHeaders();
 *   // {
 *   //   Authorization: "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
 *   //   "x-api-key": "my-api-key" // Only if available
 *   // }
 *
 *   // Use the forwarded credentials in downstream API calls
 *   const response = await fetch("https://api.adobe.io/some-endpoint", {
 *     headers,
 *   });
 *
 *   return { statusCode: 200, body: await response.json() };
 * }
 * ```
 */
export function forwardImsAuthProvider(
  params: Record<string, unknown>,
): ImsAuthProvider {
  let provider: ImsAuthProvider;

  try {
    // Try from params first.
    provider = forwardImsAuthProviderFromParams(params);
    return provider;
  } catch {
    // Do nothing, we could not resolve it, we'll throw a different error.
  }

  try {
    // Try from HTTP headers.
    provider = forwardImsAuthProviderFromRequest(params);
    return provider;
  } catch {
    // Do nothing, we could not resolve it, we'll throw a different error.
  }

  throw new Error(
    `Can't forward IMS authentication from the given params. ` +
      "Make sure your params contain an AIO_COMMERCE_IMS_AUTH_TOKEN input " +
      "or an Authorization header with an IMS token.",
  );
}
