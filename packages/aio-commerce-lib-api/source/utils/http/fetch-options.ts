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

import { HTTPError } from "ky";

import type {
  AfterResponseState,
  BeforeErrorState,
  BeforeRequestState,
  BeforeRetryState,
  NormalizedOptions,
  Options,
} from "ky";

type BeforeRequestHook = (
  request: Request,
  options: NormalizedOptions,
  retryCount: number,
) => undefined | Request | Response | Promise<Request | Response | undefined>;

type AfterResponseHook = (
  request: Request,
  response: Response,
  options: NormalizedOptions,
  retryCount: number,
) => undefined | Response | Promise<Response | undefined>;

type BeforeErrorHook = (
  error: HTTPError,
  request: Request,
  options: NormalizedOptions,
  retryCount: number,
) => HTTPError | Promise<HTTPError>;

type BeforeRetryHook = (
  request: Request,
  options: NormalizedOptions,
  error: Error,
  retryCount: number,
) => void | Promise<void>;

type Hooks = {
  beforeRequest?: BeforeRequestHook[];
  afterResponse?: AfterResponseHook[];
  beforeError?: BeforeErrorHook[];
  beforeRetry?: BeforeRetryHook[];
};

type LegacyFetchOptions = {
  /**
   * Legacy ky v1 URL prefix option.
   *
   * This is mapped to ky v2's `prefix` option at the SDK boundary.
   */
  prefixUrl?: Options["prefix"];
};

/**
 * Per-request fetch options accepted by SDK HTTP clients.
 *
 * A subset of ky's `Options` with SDK-owned hook signatures. Hook signatures use
 * positional-argument form — each hook receives the primary subject (`request`,
 * `response`, or `error`) followed by `options` (the normalized request options) and
 * `retryCount`. URL-routing fields (`prefix`, `baseUrl`) are excluded — the SDK
 * manages those internally. The legacy ky v1 `prefixUrl` field is accepted for
 * compatibility and mapped internally.
 */
export type FetchOptions = Omit<Options, "hooks" | "prefix" | "baseUrl"> &
  LegacyFetchOptions & {
    hooks?: Hooks;
  };

/**
 * Converts SDK-facing `FetchOptions` into ky v2 `Options` by wrapping
 * SDK hook types into ky's state-object-based signatures.
 * @param fetchOptions - The fetch options to convert.
 */
export function toKyOptions(fetchOptions: FetchOptions): Options {
  const { hooks, prefixUrl, ...rest } = fetchOptions;
  const kyOptions = {
    ...rest,
    ...(prefixUrl === undefined ? {} : { prefix: prefixUrl }),
  };

  if (!hooks) {
    return kyOptions as Options;
  }

  return {
    ...kyOptions,
    hooks: {
      beforeRequest: hooks.beforeRequest?.map(
        (hook) =>
          ({ request, options, retryCount }: BeforeRequestState) =>
            hook(request, options, retryCount),
      ),
      afterResponse: hooks.afterResponse?.map(
        (hook) =>
          ({ request, response, options, retryCount }: AfterResponseState) =>
            hook(request, response, options, retryCount),
      ),
      beforeError: hooks.beforeError?.map(
        (hook) =>
          ({ error, request, options, retryCount }: BeforeErrorState) =>
            error instanceof HTTPError
              ? hook(error, request, options, retryCount)
              : error,
      ),
      beforeRetry: hooks.beforeRetry?.map(
        (hook) =>
          ({ request, options, error, retryCount }: BeforeRetryState) =>
            hook(request, options, error, retryCount),
      ),
    },
  } as Options;
}

/**
 * Converts ky v2 `Options` into SDK-facing `FetchOptions`.
 * @param kyOptions - The ky options to convert.
 */
export function toFetchOptions(kyOptions: Options): FetchOptions {
  const { hooks, prefix, baseUrl: _baseUrl, ...rest } = kyOptions;
  const fetchOptions = {
    ...rest,
    ...(prefix === undefined ? {} : { prefixUrl: prefix }),
  } as FetchOptions;

  if (!hooks) {
    return fetchOptions;
  }

  return {
    ...fetchOptions,
    hooks: {
      beforeRequest: hooks.beforeRequest?.map(
        (hook) => (request, options, retryCount) =>
          hook({
            request: request as BeforeRequestState["request"],
            options,
            retryCount: retryCount as BeforeRequestState["retryCount"],
          }) as ReturnType<BeforeRequestHook>,
      ),
      afterResponse: hooks.afterResponse?.map(
        (hook) => (request, response, options, retryCount) =>
          hook({
            request: request as AfterResponseState["request"],
            response: response as AfterResponseState["response"],
            options,
            retryCount,
          }) as ReturnType<AfterResponseHook>,
      ),
      beforeError: hooks.beforeError?.map(
        (hook) => (error, request, options, retryCount) =>
          hook({
            error,
            request: request as BeforeErrorState["request"],
            options,
            retryCount,
          }) as ReturnType<BeforeErrorHook>,
      ),
      beforeRetry: hooks.beforeRetry?.map(
        (hook) => (request, options, error, retryCount) =>
          hook({
            request: request as BeforeRetryState["request"],
            options,
            error,
            retryCount,
          }) as ReturnType<BeforeRetryHook>,
      ),
    },
  };
}
