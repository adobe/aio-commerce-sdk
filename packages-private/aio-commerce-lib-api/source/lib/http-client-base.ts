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

import type { KyInstance, Options } from "ky";

type KyHttpClient = Omit<KyInstance, "extend" | "create">;

/**
 * Base class for HTTP clients.
 * @template T The type of the configuration object.
 */
export class HttpClientBase<T> implements KyHttpClient {
  /** The actual HTTP client instance. */
  protected httpClient!: Readonly<KyInstance>;

  /** The configuration used by the HTTP client. */
  public readonly config: Readonly<T>;

  public get!: KyInstance["get"];
  public post!: KyInstance["post"];
  public put!: KyInstance["put"];
  public delete!: KyInstance["delete"];
  public patch!: KyInstance["patch"];
  public head!: KyInstance["head"];
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
    this.get = this.httpClient.get.bind(this.httpClient);
    this.post = this.httpClient.post.bind(this.httpClient);
    this.put = this.httpClient.put.bind(this.httpClient);
    this.delete = this.httpClient.delete.bind(this.httpClient);
    this.patch = this.httpClient.patch.bind(this.httpClient);
    this.head = this.httpClient.head.bind(this.httpClient);
    this.stop = this.httpClient.stop;
  }

  /**
   * Extends the current HTTP client instance with the given options.
   * @param options The options to extend the HTTP client with.
   */
  public extend(options: Options | ((parentOptions: Options) => Options)) {
    const client = Object.freeze(this.httpClient.extend(options));
    return new HttpClientBase(this.config, client);
  }
}
