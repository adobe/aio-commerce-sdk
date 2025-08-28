import ky from "ky";

import {
  buildImsAuthBeforeRequestHook,
  buildIntegrationAuthBeforeRequestHook,
  isAuthProvider,
} from "~/utils/auth/hooks";
import {
  BASE_IMS_REQUIRED_SCOPES,
  ensureImsScopes,
} from "~/utils/auth/ims-scopes";
import { optionallyExtendKy } from "~/utils/http/ky";

import type { KyInstance } from "ky";
import type {
  CommerceHttpClient,
  CommerceHttpClientConfig,
  CommerceHttpClientParams,
  PaaSClientParams,
  SaaSClientParams,
} from "./types";

const COMMERCE_SAAS_IMS_REQUIRED_SCOPES = [
  ...BASE_IMS_REQUIRED_SCOPES,
  "commerce.accs",
];

/**
 * Gets the Commerce URL for the given configuration and flavor.
 * @param config The Commerce HTTP client configuration.
 * @param fetchOptions The fetch options to use for the Commerce HTTP requests.
 * @returns The Commerce URL.
 */
function getCommerceUrl(config: CommerceHttpClientConfig) {
  const { baseUrl, storeViewCode = "all", version = "v1", flavor } = config;
  const basePaths = {
    paas: "/rest",
    saas: "",
  };

  const basePath = `${basePaths[flavor]}/${storeViewCode}/${version?.toUpperCase()}`;
  const commerceUrl = new URL(basePath, baseUrl);

  return commerceUrl.toString();
}

/**
 * Builds a Commerce HTTP client for PaaS.
 * @param params The parameters for building the Commerce PaaS HTTP client.
 */
function buildCommerceHttpClientPaaS(params: PaaSClientParams) {
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
function buildCommerceHttpClientSaaS(params: SaaSClientParams) {
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
      beforeRequest: [beforeRequestAuthHook],
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
 * Builds a Commerce HTTP client with proper authentication based on the flavor.
 * @param params The parameters for building the Commerce HTTP client.
 * @returns A configured Commerce HTTP client.
 */
export function buildCommerceHttpClient(
  params: CommerceHttpClientParams,
): CommerceHttpClient {
  const flavor = params.config.flavor;
  let commerceHttpClient: KyInstance;

  if (isPaaSParams(params)) {
    commerceHttpClient = buildCommerceHttpClientPaaS(params);
  } else if (isSaaSParams(params)) {
    commerceHttpClient = buildCommerceHttpClientSaaS(params);
  } else {
    throw new Error(
      `Invalid Commerce configuration. Unknown flavor: ${flavor}`,
    );
  }

  return Object.assign(commerceHttpClient, {
    config: params.config,
  });
}
