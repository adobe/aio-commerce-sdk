/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";
import ky from "ky";

import { PROD_CAMS_URL } from "#commands/common/cams/config";
import { CamsClientError } from "#commands/common/cams/errors";

import type { AioProjectConfig } from "@aio-commerce-sdk/scripting-utils/aio";
import type { KyInstance, KyRequest, Options } from "ky";
import type { CommerceInstance } from "#commands/common/cams/commerce-instance";

/** Defines the authentication of a CAMS request: the user token and the organization. */
export type CamsAuth = {
  /** Called before every request, so a long-lived caller always sends a fresh IMS user token. */
  getToken: () => Promise<string>;

  /** The organization of the current project. */
  org: AioProjectConfig["org"];
};

/** Defines the configuration required to build a CAMS HTTP client. */
export type CamsHttpClientConfig = {
  /**
   * The base URL to use for CAMS.
   * @default "https://commerce-app-management.adobe.io"
   */
  baseUrl?: string;
};

/** Defines the parameters required to build an HTTP client for CAMS. */
export type CamsHttpClientParams = {
  /** The authentication of the requests. */
  auth: CamsAuth;

  /** The configuration for the CAMS HTTP client. */
  config?: CamsHttpClientConfig;

  /** Additional fetch options to use for the CAMS HTTP requests. */
  fetchOptions?: Options;
};

/** Header that carries the organization the request is made for. */
const ORG_HEADER = "x-org-id";

/** Headers that carry the Commerce instance the request is made for. */
const COMMERCE_URL_HEADER = "x-ac-url";
const COMMERCE_ENV_HEADER = "x-ac-env";

/**
 * Builds a before request hook that sets the user token as a bearer token, the IMS organization
 * id of the project and, when there is one, the Commerce instance.
 *
 * @throws A {@link CamsClientError} If the token cannot be read.
 */
function buildAuthHook(
  auth: CamsAuth,
  getCommerceInstance: () => CommerceInstance | undefined,
) {
  return async (request: KyRequest) => {
    let token: string;
    try {
      token = await auth.getToken();
    } catch (error) {
      throw new CamsClientError(stringifyError(error), { cause: error });
    }

    request.headers.set("Authorization", `Bearer ${token}`);
    request.headers.set(ORG_HEADER, auth.org.ims_org_id);

    const instance = getCommerceInstance();
    if (instance) {
      request.headers.set(COMMERCE_URL_HEADER, instance.url);
      request.headers.set(COMMERCE_ENV_HEADER, instance.env);
    }
  };
}

type KyHttpClient = Omit<KyInstance, "extend" | "create">;

/**
 * A Ky-based HTTP client used to make requests to CAMS.
 *
 * It has the shape of the HTTP clients of `@adobe/aio-commerce-lib-api`, which do not export their
 * base class.
 * @see https://github.com/sindresorhus/ky
 */
export class CamsHttpClient implements KyHttpClient {
  /** The actual HTTP client instance. */
  protected readonly httpClient: Readonly<KyInstance>;

  /** The configuration used by the HTTP client, with its defaults applied. */
  public readonly config: Readonly<Required<CamsHttpClientConfig>>;

  public readonly get: KyInstance["get"];
  public readonly post: KyInstance["post"];
  public readonly put: KyInstance["put"];
  public readonly delete: KyInstance["delete"];
  public readonly patch: KyInstance["patch"];
  public readonly head: KyInstance["head"];
  public readonly retry: KyInstance["retry"];
  public readonly stop: KyInstance["stop"];

  private commerceInstance: CommerceInstance | undefined;

  /**
   * Creates a new CAMS HTTP client instance.
   * @param params - The authentication, configuration and fetch options.
   */
  public constructor(params: CamsHttpClientParams) {
    const { auth, config, fetchOptions } = params;
    this.config = Object.freeze({ baseUrl: config?.baseUrl ?? PROD_CAMS_URL });

    const httpClient = ky.create({
      hooks: {
        beforeRequest: [buildAuthHook(auth, () => this.commerceInstance)],
      },
      prefixUrl: this.config.baseUrl,
    });

    this.httpClient = Object.freeze(
      fetchOptions ? httpClient.extend(fetchOptions) : httpClient,
    );

    this.get = this.httpClient.get.bind(this.httpClient);
    this.post = this.httpClient.post.bind(this.httpClient);
    this.put = this.httpClient.put.bind(this.httpClient);
    this.delete = this.httpClient.delete.bind(this.httpClient);
    this.patch = this.httpClient.patch.bind(this.httpClient);
    this.head = this.httpClient.head.bind(this.httpClient);
    this.retry = this.httpClient.retry.bind(this.httpClient);
    this.stop = this.httpClient.stop;
  }

  /**
   * Sets the Commerce instance that the following requests are made for.
   * @param instance - The instance, or `undefined` to send no instance.
   */
  public setCommerceInstance(instance: CommerceInstance | undefined) {
    this.commerceInstance = instance;
  }
}
