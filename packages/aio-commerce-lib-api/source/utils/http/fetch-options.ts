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

import type { BeforeRetryState, Options } from "ky";

type BeforeRequestHook = (
  request: Request,
) => undefined | Request | Response | Promise<Request | Response | undefined>;

type AfterResponseHook = (
  request: Request,
  response: Response,
) => undefined | Response | Promise<Response | undefined>;

type BeforeErrorHook = (error: HTTPError) => HTTPError | Promise<HTTPError>;

type BeforeRetryHook = (state: BeforeRetryState) => void | Promise<void>;

type Hooks = {
  beforeRequest?: BeforeRequestHook[];
  afterResponse?: AfterResponseHook[];
  beforeError?: BeforeErrorHook[];
  beforeRetry?: BeforeRetryHook[];
};

/**
 * Per-request fetch options accepted by SDK HTTP clients.
 *
 * A subset of ky's `Options` with SDK-owned hook signatures. The hook types use
 * v1-compatible positional-argument form so existing consumer code continues to work
 * after the ky v2 upgrade. URL-routing fields (`prefix`, `baseUrl`) are excluded —
 * the SDK manages those internally.
 */
export type FetchOptions = Omit<Options, "hooks" | "prefix" | "baseUrl"> & {
  hooks?: Hooks;
};

/**
 * Converts SDK-facing `FetchOptions` into ky v2 `Options` by wrapping
 * SDK hook types into ky's state-object-based signatures.
 * @param fetchOptions - The fetch options to convert.
 */
export function toKyOptions(fetchOptions: FetchOptions): Options {
  const { hooks, ...rest } = fetchOptions;

  if (!hooks) {
    return rest as Options;
  }

  return {
    ...rest,
    hooks: {
      beforeRequest: hooks.beforeRequest?.map(
        (hook) =>
          ({ request }: { request: Request }) =>
            hook(request),
      ),
      afterResponse: hooks.afterResponse?.map(
        (hook) =>
          ({ request, response }: { request: Request; response: Response }) =>
            hook(request, response),
      ),
      beforeError: hooks.beforeError?.map(
        (hook) =>
          ({ error }: { error: Error }) =>
            error instanceof HTTPError ? hook(error) : error,
      ),
      beforeRetry: hooks.beforeRetry?.map(
        (hook) => (state: BeforeRetryState) => hook(state),
      ),
    },
  } as Options;
}
