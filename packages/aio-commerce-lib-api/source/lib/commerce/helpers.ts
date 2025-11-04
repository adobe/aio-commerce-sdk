/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { resolveAuthParams } from "@adobe/aio-commerce-lib-auth";
import { allNonEmpty } from "@adobe/aio-commerce-lib-core/params";
import ky from "ky";

import {
  buildImsAuthBeforeRequestHook,
  buildIntegrationAuthBeforeRequestHook,
  isAuthProvider,
} from "#utils/auth/hooks";
import { ensureImsScopes } from "#utils/auth/ims-scopes";
import { optionallyExtendKy } from "#utils/http/ky";

/** A regex matching a regular SaaS API URL, with a tenant ID and optional trailing slash. */
const COMMERCE_API_URL_REGEX =
  /^([a-zA-Z0-9-]+\.)?api\.commerce\.adobe\.com\/[a-zA-Z0-9-]+\/?$/;

import type {
  CommerceHttpClientParamsWithRequiredConfig,
  PaaSClientParamsWithRequiredConfig,
  RequiredComerceHttpClientConfig,
  SaaSClientParamsWithRequiredConfig,
} from "./http-client";
import type {
  CommerceFlavor,
  CommerceHttpClientParams,
  PaaSClientParams,
  SaaSClientParams,
} from "./types";

const COMMERCE_SAAS_IMS_REQUIRED_SCOPES = [
  "openid",
  "additional_info.projectedProductContext",
  "commerce.accs",
];

/**
 * Gets the Commerce URL for the given configuration and flavor.
 * @param config The Commerce HTTP client configuration.
 */
function getCommerceUrl(config: RequiredComerceHttpClientConfig) {
  const { baseUrl, storeViewCode, version } = config;

  const commerceUrl = new URL(baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  const uppercasedVersion = version?.toUpperCase();

  if (config.flavor === "paas") {
    commerceUrl.pathname += `rest/${storeViewCode}/${uppercasedVersion}`;
  } else if (config.flavor === "saas") {
    commerceUrl.pathname += `${uppercasedVersion}`;
  }

  return commerceUrl.toString();
}

/**
 * Builds a Commerce HTTP client for PaaS.
 * @param params The parameters for building the Commerce PaaS HTTP client.
 */
function buildCommerceHttpClientPaaS(
  params: PaaSClientParamsWithRequiredConfig,
) {
  const { auth, config, fetchOptions } = params;
  const commerceUrl = getCommerceUrl(config);
  const beforeRequestAuthHook = buildIntegrationAuthBeforeRequestHook(auth);

  const httpClient = ky.create({
    prefixUrl: commerceUrl,
    hooks: {
      beforeRequest: [beforeRequestAuthHook],
    },
  });

  return optionallyExtendKy(httpClient, fetchOptions);
}

/**
 * Builds a Commerce HTTP client for SaaS.
 * @param params The parameters for building the Commerce SaaS HTTP client.
 */
function buildCommerceHttpClientSaaS(
  params: SaaSClientParamsWithRequiredConfig,
) {
  const { auth, config, fetchOptions } = params;
  const commerceUrl = getCommerceUrl(config);

  const beforeRequestAuthHook = isAuthProvider(auth)
    ? buildImsAuthBeforeRequestHook(auth)
    : buildImsAuthBeforeRequestHook(
        ensureImsScopes(auth, COMMERCE_SAAS_IMS_REQUIRED_SCOPES),
      );

  const httpClient = ky.create({
    prefixUrl: commerceUrl,
    hooks: {
      beforeRequest: [
        beforeRequestAuthHook,
        (request) => {
          request.headers.set("Store", config.storeViewCode);
        },
      ],
    },
  });

  return optionallyExtendKy(httpClient, fetchOptions);
}

/**
 * Type guard to check if params are for PaaS
 */
function isPaaSParams(
  params: CommerceHttpClientParams,
): params is PaaSClientParams {
  return params.config.flavor === "paas";
}

/**
 * Type guard to check if params are for SaaS
 */
function isSaaSParams(
  params: CommerceHttpClientParams,
): params is SaaSClientParams {
  return params.config.flavor === "saas";
}

/**
 * Builds the Commerce HTTP client for the given parameters.
 * @param params The configuration, authentication and fetch options parameters.
 */
export function buildCommerceHttpClient(
  params: CommerceHttpClientParamsWithRequiredConfig,
) {
  const flavor = params.config.flavor;

  if (isPaaSParams(params)) {
    return buildCommerceHttpClientPaaS(params);
  }

  if (isSaaSParams(params)) {
    return buildCommerceHttpClientSaaS(params);
  }

  throw new Error(`Invalid Commerce configuration. Unknown flavor: ${flavor}`);
}

/**
 * Resolves the {@link CommerceFlavor} from the given API URL.
 * @param apiUrl The API URL to resolve the {@link CommerceFlavor} from.
 */
function resolveCommerceFlavorFromApiUrl(apiUrl: string): CommerceFlavor {
  const { hostname, pathname } = new URL(apiUrl);
  // Combine hostname and pathname (without leading slash) to match the regex pattern
  const hostAndPath = `${hostname}${pathname}`;
  return COMMERCE_API_URL_REGEX.test(hostAndPath) ? "saas" : "paas";
}

/**
 * Resolves the {@link CommerceHttpClientParams} from the given App Builder action inputs.
 * @param params The App Builder action inputs to resolve the {@link CommerceHttpClientParams} from.
 * @throws If the base API URL or the authentication parameters cannot be resolved.
 * @example
 * ```typescript
 * import { resolveCommerceHttpClientParams, AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api/commerce";
 *
 * // Some App Builder runtime action that needs the Commerce HTTP client
 * export function main(params) {
 *   const commerceHttpClientParams = resolveCommerceHttpClientParams(params);
 *   const commerceClient = new AdobeCommerceHttpClient(commerceHttpClientParams);
 * }
 * ```
 */
export function resolveCommerceHttpClientParams(
  params: Record<string, unknown>,
): CommerceHttpClientParams {
  if (allNonEmpty(params, ["AIO_COMMERCE_API_BASE_URL"])) {
    const baseUrl = String(params.AIO_COMMERCE_API_BASE_URL);
    const flavor = resolveCommerceFlavorFromApiUrl(baseUrl);

    if (flavor === "saas") {
      return {
        auth: resolveAuthParams(params, "ims"),
        config: {
          baseUrl,
          flavor,
        },
      };
    }

    return {
      auth: resolveAuthParams(params, "integration"),
      config: {
        baseUrl,
        flavor,
      },
    };
  }

  throw new Error(
    "Can not resolve CommerceHttpClientParams without an AIO_COMMERCE_API_BASE_URL. Please provide one.",
  );
}
