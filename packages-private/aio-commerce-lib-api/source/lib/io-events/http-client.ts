import { HttpClientBase } from "../http-client-base";
import { buildIoEventsHttpClient } from "./helpers";

import type { RequiredDeep } from "type-fest";
import type {
  IoEventsHttpClientConfig,
  IoEventsHttpClientParams,
} from "./types";

const DEFAULT_IO_EVENTS_BASE_URL = "https://api.adobe.io/events";

export type RequiredIoEventsHttpClientConfig =
  RequiredDeep<IoEventsHttpClientConfig>;

export type IoEventsHttpClientParamsWithRequiredConfig =
  IoEventsHttpClientParams & {
    config: RequiredIoEventsHttpClientConfig;
  };

/**
 * A Ky-based HTTP client used to make requests to the Adobe I/O Events API.
 * @see https://github.com/sindresorhus/ky
 */
export class AdobeIoEventsHttpClient extends HttpClientBase<RequiredIoEventsHttpClientConfig> {
  /**
   * Creates a new Adobe I/O Events HTTP client instance.
   * @param params The parameters for building the Adobe I/O Events HTTP client.
   */
  public constructor(params: IoEventsHttpClientParams) {
    // A deep-required version of the config to ensure all default values are set. */
    const config: RequiredIoEventsHttpClientConfig = {
      ...params.config,
      baseUrl: params.config?.baseUrl ?? DEFAULT_IO_EVENTS_BASE_URL,
    };

    const httpClient = buildIoEventsHttpClient({ ...params, config });
    super(config, httpClient);
  }
}
