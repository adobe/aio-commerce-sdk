import { HttpClientBase } from "../http-client-base";
import { buildCommerceHttpClient } from "./helpers";

import type { RequiredDeep } from "type-fest";
import type {
  CommerceHttpClientConfig,
  CommerceHttpClientConfigPaaS,
  CommerceHttpClientConfigSaaS,
  CommerceHttpClientParams,
  PaaSClientParams,
  SaaSClientParams,
} from "./types";

const DEFAULT_STORE_VIEW_CODE = "all";
const DEFAULT_API_VERSION = "V1";

export type RequiredComerceHttpClientConfig =
  RequiredDeep<CommerceHttpClientConfig>;

export type PaaSClientParamsWithRequiredConfig = PaaSClientParams & {
  config: RequiredDeep<CommerceHttpClientConfigPaaS> & { flavor: "paas" };
};

export type SaaSClientParamsWithRequiredConfig = SaaSClientParams & {
  config: RequiredDeep<CommerceHttpClientConfigSaaS> & { flavor: "saas" };
};

export type CommerceHttpClientParamsWithRequiredConfig =
  | PaaSClientParamsWithRequiredConfig
  | SaaSClientParamsWithRequiredConfig;

/**
 * A Ky-based HTTP client used to make requests to the Commerce API.
 * @see https://github.com/sindresorhus/ky
 */
export class AdobeCommerceHttpClient extends HttpClientBase<RequiredComerceHttpClientConfig> {
  /**
   * Creates a new Commerce HTTP client instance.
   * @param params The parameters for building the Commerce HTTP client.
   */
  public constructor(params: CommerceHttpClientParams) {
    // A deep-required version of the config to ensure all default values are set. */
    const config: RequiredComerceHttpClientConfig = {
      ...params.config,

      storeViewCode: params.config.storeViewCode ?? DEFAULT_STORE_VIEW_CODE,
      version: params.config.version ?? DEFAULT_API_VERSION,
    };

    const requiredParams = {
      ...params,
      config,
    } as CommerceHttpClientParamsWithRequiredConfig;

    const httpClient = buildCommerceHttpClient(requiredParams);
    super(config, httpClient);
  }
}
