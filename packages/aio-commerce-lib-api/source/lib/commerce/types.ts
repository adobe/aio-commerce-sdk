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

import type {
  ImsAuthProvider,
  IntegrationAuthParams,
  IntegrationAuthProvider,
} from "@adobe/aio-commerce-lib-auth";
import type { Options } from "ky";
import type { ImsAuthParamsWithOptionalScopes } from "#utils/auth/ims-scopes";

/** Defines the base configuration required to build an Adobe Commerce HTTP client. */
export type CommerceHttpClientConfigBase = {
  /** The base URL of the Commerce API. */
  baseUrl: string;

  /**
   * The store view code use to make requests to the Commerce API.
   * @default "all"
   */
  storeViewCode?: string;

  /**
   * The version of the Commerce API to use. Currently only `v1` is supported.
   * @default "V1"
   */
  version?: "V1";
};

/** Defines the configuration required to build an Adobe Commerce HTTP client for PaaS. */
export type CommerceHttpClientConfigPaaS = CommerceHttpClientConfigBase & {
  /** The flavor of the Commerce instance. */
  flavor: "paas";
};

/** Defines the configuration required to build an Adobe Commerce HTTP client for SaaS. */
export type CommerceHttpClientConfigSaaS = CommerceHttpClientConfigBase & {
  /** The flavor of the Commerce instance. */
  flavor: "saas";
};

/** Defines the configuration required to build an Adobe Commerce HTTP client. */
export type CommerceHttpClientConfig =
  | CommerceHttpClientConfigPaaS
  | CommerceHttpClientConfigSaaS;

/** Defines the flavor of a Commerce instance. */
export type CommerceFlavor = CommerceHttpClientConfig["flavor"];

/** Defines the configuration required to build an Adobe Commerce HTTP client for SaaS. */
export type SaaSClientParams = {
  auth: ImsAuthProvider | ImsAuthParamsWithOptionalScopes; // We provide default scopes.
  config: CommerceHttpClientConfigSaaS;
  fetchOptions?: Options;
};

/** Defines the configuration required to build an Adobe Commerce HTTP client for PaaS. */
export type PaaSClientParams = {
  auth:
    | IntegrationAuthProvider
    | IntegrationAuthParams
    | ImsAuthProvider
    | ImsAuthParamsWithOptionalScopes;

  config: CommerceHttpClientConfigPaaS;
  fetchOptions?: Options;
};

/** Defines the parameters required to build an Adobe Commerce HTTP client (either SaaS or PaaS). */
export type CommerceHttpClientParams = SaaSClientParams | PaaSClientParams;
