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

import { toKyOptions } from "#utils/http/fetch-options";

import type { Input, KyInstance, ResponsePromise } from "ky";
import type { FetchOptions } from "#utils/http/fetch-options";

type HttpMethod = (url: Input, options?: FetchOptions) => ResponsePromise;

type HttpClient = {
  get: HttpMethod;
  post: HttpMethod;
  put: HttpMethod;
  delete: HttpMethod;
  patch: HttpMethod;
  head: HttpMethod;
  retry: KyInstance["retry"];
  stop: KyInstance["stop"];
};

/**
 * Base class for HTTP clients.
 * @template T The type of the configuration object.
 */
export class HttpClientBase<T> implements HttpClient {
  /** The actual HTTP client instance. */
  protected httpClient!: Readonly<KyInstance>;

  /** The configuration used by the HTTP client. */
  public readonly config: Readonly<T>;

  public get!: HttpMethod;
  public post!: HttpMethod;
  public put!: HttpMethod;
  public delete!: HttpMethod;
  public patch!: HttpMethod;
  public head!: HttpMethod;
  public retry!: KyInstance["retry"];
  public stop!: KyInstance["stop"];

  /**
   * Creates a new HTTP client instance.
   * @param config The configuration used by the HTTP client.
   * @param httpClient The actual HTTP client instance.
   */
  protected constructor(config: T, httpClient: KyInstance) {
    this.config = Object.freeze(config);
    this.setHttpClient(httpClient);
  }

  /**
   * Sets the HTTP client instance.
   * @param httpClient The HTTP client instance to set.
   */
  protected setHttpClient(httpClient: KyInstance) {
    this.httpClient = Object.freeze(httpClient);
    this.get = (url, options?) =>
      this.httpClient.get(url, options ? toKyOptions(options) : undefined);
    this.post = (url, options?) =>
      this.httpClient.post(url, options ? toKyOptions(options) : undefined);
    this.put = (url, options?) =>
      this.httpClient.put(url, options ? toKyOptions(options) : undefined);
    this.delete = (url, options?) =>
      this.httpClient.delete(url, options ? toKyOptions(options) : undefined);
    this.patch = (url, options?) =>
      this.httpClient.patch(url, options ? toKyOptions(options) : undefined);
    this.head = (url, options?) =>
      this.httpClient.head(url, options ? toKyOptions(options) : undefined);
    this.retry = this.httpClient.retry.bind(this.httpClient);
    this.stop = this.httpClient.stop;
  }

  /**
   * Extends the current HTTP client instance with the given options.
   * @param options The options to extend the HTTP client with.
   */
  public extend(
    options: FetchOptions | ((parentOptions: FetchOptions) => FetchOptions),
  ) {
    const kyOptions =
      typeof options === "function"
        ? (parent: Parameters<KyInstance["extend"]>[0]) =>
            toKyOptions(options(parent as FetchOptions))
        : toKyOptions(options);

    const client = Object.freeze(this.httpClient.extend(kyOptions));
    return new HttpClientBase(this.config, client);
  }
}
