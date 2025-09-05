import ky from "ky";

import {
  buildImsAuthBeforeRequestHook,
  buildIntegrationAuthBeforeRequestHook,
  isAuthProvider,
} from "#utils/auth/hooks";
import { ensureImsScopes } from "#utils/auth/ims-scopes";
import { optionallyExtendKy } from "#utils/http/ky";

import type {
  CommerceHttpClientParamsWithRequiredConfig,
  PaaSClientParamsWithRequiredConfig,
  RequiredComerceHttpClientConfig,
  SaaSClientParamsWithRequiredConfig,
} from "./http-client";
import type {
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
