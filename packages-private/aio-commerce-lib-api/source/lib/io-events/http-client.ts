import { HttpClientBase } from "../http-client-base";
import { buildIoEventsHttpClient } from "./helpers";

import type {
  IoEventsHttpClientConfig,
  IoEventsHttpClientParams,
} from "./types";

/**
 * A Ky-based HTTP client used to make requests to the Adobe I/O Events API.
 * @see https://github.com/sindresorhus/ky
 */
export class AdobeIoEventsHttpClient extends HttpClientBase<IoEventsHttpClientConfig> {
  /**
   * Creates a new Adobe I/O Events HTTP client instance.
   * @param params The configuration, authentication and fetch options parameters.
   */
  public static create(params: IoEventsHttpClientParams) {
    const httpClient = buildIoEventsHttpClient(params);
    const instance = new AdobeIoEventsHttpClient(params.config, httpClient);

    return HttpClientBase.merge(instance, httpClient);
  }
}
