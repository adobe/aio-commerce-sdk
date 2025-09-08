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

import type { HttpClientBase } from "./http-client-base";

/** A generic function that takes an HTTP client and some other arguments and returns a result. */
export type ApiFunction<
  TClient extends HttpClientBase<unknown>,
  TArgs extends unknown[],
  TResult,
> = (clients: TClient, ...args: TArgs) => TResult;

/** A client that bounds a set of {@link ApiFunction} to their HTTP clients. */
export type ApiClientRecord<
  TClient extends HttpClientBase<unknown>,
  TFunctions extends Record<string, ApiFunction<TClient, unknown[], unknown>>,
> = {
  [K in keyof TFunctions]: TFunctions[K] extends ApiFunction<
    TClient,
    infer Args,
    infer Result
  >
    ? (...args: Args) => Result
    : never;
};

/** A client that binds a set of {@link ApiFunction} to a given HTTP client. */
// biome-ignore lint/complexity/noStaticOnlyClass: For consistency with the rest of the codebase.
export class ApiClient {
  /**
   * Creates a new API client that binds a set of {@link ApiFunction} to a given HTTP client.
   * @param client - The HTTP client to bind the API functions to.
   * @param functions - The API functions to bind to the HTTP client.
   */
  public static create<
    TClient extends HttpClientBase<unknown>,
    // biome-ignore lint/suspicious/noExplicitAny: We can't know the type of the argument/return type.
    TFunctions extends Record<string, ApiFunction<TClient, any[], any>>,
  >(client: TClient, functions: TFunctions) {
    const wrapped = {} as ApiClientRecord<TClient, TFunctions>;

    for (const key in functions) {
      if (Object.hasOwn(functions, key)) {
        const fn = functions[key];
        // biome-ignore lint/suspicious/noExplicitAny: We can't know the type of the argument/return type.
        wrapped[key] = ((...args: unknown[]) => fn(client, ...args)) as any;
      }
    }

    return wrapped;
  }
}
