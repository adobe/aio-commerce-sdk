import { HttpClientBase } from "../http-client-base";
import { buildCommerceHttpClient } from "./helpers";

import type {
  CommerceHttpClientConfig,
  CommerceHttpClientParams,
} from "./types";

/**
 * A Ky-based HTTP client used to make requests to the Commerce API.
 * @see https://github.com/sindresorhus/ky
 */
export class AdobeCommerceHttpClient extends HttpClientBase<CommerceHttpClientConfig> {
  /**
   * Creates a new Commerce HTTP client instance.
   * @param params The parameters for building the Commerce HTTP client.
   */
  public static create(params: CommerceHttpClientParams) {
    const httpClient = buildCommerceHttpClient(params);
    const instance = new AdobeCommerceHttpClient(params.config, httpClient);

    return HttpClientBase.merge(instance, httpClient);
  }
}
