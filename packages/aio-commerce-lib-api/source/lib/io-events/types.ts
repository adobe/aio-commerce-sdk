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

import type { ImsAuthProvider } from "@adobe/aio-commerce-lib-auth";
import type { Options } from "ky";
import type { ImsAuthParamsWithOptionalScopes } from "#utils/auth/ims-scopes";

/** Defines the configuration required to build an Adobe I/O HTTP client. */
export type IoEventsHttpClientConfig = {
  /**
   * The base URL to use for the Adobe I/O Events API.
   * @default "https://api.adobe.io/events"
   */
  baseUrl?: string;
};

/** Defines the parameters required to build an HTTP client for the Adobe I/O Events API. */
export type IoEventsHttpClientParams = {
  /** The IMS authentication parameters. */
  auth: ImsAuthProvider | ImsAuthParamsWithOptionalScopes;

  /** The configuration for the I/O Events HTTP client. */
  // Optional because all config values are optional. If ever more are added,
  // the optionality should be re-evaluated (would imply breaking changes).
  config?: IoEventsHttpClientConfig;

  /** Additional fetch options to use for the I/O Events HTTP requests. */
  fetchOptions?: Options;
};
