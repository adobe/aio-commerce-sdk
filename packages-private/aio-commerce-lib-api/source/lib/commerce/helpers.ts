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

import type {
  CommerceHttpClientConfig,
  CommerceHttpClientParams,
  PaaSClientParams,
  SaaSClientParams,
} from "./types";

const COMMERCE_SAAS_IMS_REQUIRED_SCOPES = [
  ...BASE_IMS_REQUIRED_SCOPES,
  "commerce.accs",
];

const DEFAULT_STORE_VIEW_CODE = "default";
const DEFAULT_API_VERSION = "v1";

/**
 * Gets the Commerce URL for the given configuration and flavor.
 * @param config The Commerce HTTP client configuration.
 */
function getCommerceUrl(config: CommerceHttpClientConfig) {
  const {
    baseUrl,
    storeViewCode = DEFAULT_STORE_VIEW_CODE,
    version = DEFAULT_API_VERSION,
  } = config;

  const commerceUrl = new URL(baseUrl);
  const uppercasedVersion = version?.toUpperCase();

  if (config.flavor === "paas") {
    commerceUrl.pathname += `rest/${storeViewCode}/${uppercasedVersion}`;
  } else if (config.flavor === "saas") {
    commerceUrl.pathname += `/${uppercasedVersion}`;
  }

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
      beforeRequest: [
        beforeRequestAuthHook,
        (request) => {
          request.headers.set(
            "Store",
            config.storeViewCode ?? DEFAULT_STORE_VIEW_CODE,
          );
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
export function buildCommerceHttpClient(params: CommerceHttpClientParams) {
  const flavor = params.config.flavor;

  if (isPaaSParams(params)) {
    return buildCommerceHttpClientPaaS(params);
  }

  if (isSaaSParams(params)) {
    return buildCommerceHttpClientSaaS(params);
  }

  throw new Error(`Invalid Commerce configuration. Unknown flavor: ${flavor}`);
}
