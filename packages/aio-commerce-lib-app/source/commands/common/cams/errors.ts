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

import { CommerceSdkErrorBase } from "@adobe/aio-commerce-lib-core/error";

import type { CommerceSdkErrorBaseOptions } from "@adobe/aio-commerce-lib-core/error";
import type { HTTPError } from "ky";

const HTTP_CONFLICT = 409;
const HTTP_BAD_GATEWAY = 502;
const HTTP_SERVICE_UNAVAILABLE = 503;

/** The request that CAMS answered with an error: its method and its path, without the host. */
export type CamsRequest = {
  method: string;
  path: string;
};

/** Options for {@link CamsClientError}. */
type CamsClientErrorOptions = CommerceSdkErrorBaseOptions & {
  /** Whether repeating the same request later can succeed. Defaults to `false`. */
  retryable?: boolean;

  /** The HTTP status of the answer. */
  status?: number;

  /** The machine-readable code of the answer, for example `in-progress` or `stale-plan`. */
  code?: string;

  /** The request that CAMS answered with an error. */
  request?: CamsRequest;
};

/**
 * Error of every failure while talking to the Commerce App Management Service (CAMS): the user
 * token cannot be read, CAMS cannot be reached, it answers with an error status, or its answer
 * does not have the expected shape.
 */
export class CamsClientError extends CommerceSdkErrorBase {
  /** Whether repeating the same request later can succeed. */
  public readonly retryable: boolean;

  /** The HTTP status of the answer, when CAMS answered. */
  public readonly status: number | undefined;

  /** The machine-readable code of the answer, when it has one. */
  public readonly code: string | undefined;

  /** The request that CAMS answered with an error, when CAMS answered. */
  public readonly request: CamsRequest | undefined;

  public constructor(message: string, options: CamsClientErrorOptions = {}) {
    const { retryable = false, status, code, request, ...rest } = options;
    super(message, rest);

    this.retryable = retryable;
    this.status = status;
    this.code = code;
    this.request = request;
  }
}

/** Thrown when CAMS refuses a request with a 409. Its `code` tells why. */
export class CamsConflictError extends CamsClientError {}

/** The `code` and text of an error answer, plus retryability when provided. */
export async function readAnswer(response: Response) {
  const body = (
    await response
      .clone()
      .text()
      .catch(() => "")
  ).trim();

  try {
    const json: unknown = JSON.parse(body);
    if (typeof json === "object" && json !== null) {
      const { code, message, detail, retryable } = json as Record<
        string,
        unknown
      >;
      const text = [message, detail].find((value) => typeof value === "string");

      return {
        code: typeof code === "string" ? code : undefined,
        retryable: typeof retryable === "boolean" ? retryable : undefined,
        text: typeof text === "string" ? text : "",
      };
    }
  } catch {
    // The body is not JSON, so its text is the message.
  }

  return { code: undefined, retryable: undefined, text: body };
}

/**
 * Builds the error for an answer with an error status. The backend retryable flag takes precedence;
 * older responses fall back to treating 502 and 503 as retryable.
 */
export async function toCamsResponseError(error: HTTPError) {
  const { status, statusText } = error.response;
  const {
    code,
    retryable: backendRetryable,
    text,
  } = await readAnswer(error.response);
  const retryable =
    backendRetryable ??
    (status === HTTP_BAD_GATEWAY || status === HTTP_SERVICE_UNAVAILABLE);

  const answer = [status, statusText].filter(Boolean).join(" ");
  const message =
    text || `The Commerce App Management Service answered with HTTP ${answer}`;

  const options = {
    cause: error,
    code,
    request: {
      method: error.request.method,
      path: new URL(error.request.url).pathname,
    },
    retryable,
    status,
  };

  if (status === HTTP_CONFLICT) {
    return new CamsConflictError(message, options);
  }

  return new CamsClientError(message, options);
}
