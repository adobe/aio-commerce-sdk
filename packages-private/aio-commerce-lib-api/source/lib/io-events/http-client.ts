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
