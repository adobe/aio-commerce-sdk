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

import { unwrapHttpError } from "@adobe/aio-commerce-lib-api/utils";
import { CommerceSdkErrorBase } from "@adobe/aio-commerce-lib-core/error";
import * as v from "valibot";

import type { CommerceSdkErrorBaseOptions } from "@adobe/aio-commerce-lib-core/error";
import type { HTTPError } from "ky";

const HTTP_CONFLICT = 409;
const HTTP_BAD_GATEWAY = 502;

/** Options for {@link CamsClientError}. */
type CamsClientErrorOptions = CommerceSdkErrorBaseOptions & {
  /** Whether repeating the same request later can succeed. Defaults to `false`. */
  retryable?: boolean;
};

/**
 * Error of every failure while talking to the Commerce App Management Service (CAMS): the user
 * token cannot be read, CAMS cannot be reached, it answers with an error status, or its answer
 * does not have the expected shape.
 */
export class CamsClientError extends CommerceSdkErrorBase {
  /** Whether repeating the same request later can succeed. */
  public readonly retryable: boolean;

  public constructor(message: string, options: CamsClientErrorOptions = {}) {
    const { retryable = false, ...rest } = options;
    super(message, rest);

    this.retryable = retryable;
  }
}

/** Thrown when CAMS refuses a request with a 409 and a code. */
export class CamsConflictError extends CamsClientError {
  /** The code of the refusal, for example `in-progress` or `stale-plan`. */
  public readonly code: string | undefined;

  public constructor(
    message: string,
    options: CommerceSdkErrorBaseOptions & { code?: string } = {},
  ) {
    const { code, ...rest } = options;
    super(message, rest);

    this.code = code;
  }
}

const ConflictBodySchema = v.object({ code: v.string() });

/** The `code` in the body of a 409 answer, if it has one. */
async function readCode(error: HTTPError) {
  const response = error.response.clone();

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return;
  }

  const parsed = v.safeParse(ConflictBodySchema, body);
  return parsed.success ? parsed.output.code : undefined;
}

/**
 * Builds the error for an answer with an error status. A 409 keeps its `code`. A 502 means CAMS
 * could not read the app, which can pass, so it is the only retryable status.
 */
export async function toCamsResponseError(error: HTTPError) {
  const { status } = error.response;
  const message = `The Commerce App Management Service answered: ${await unwrapHttpError(error)}`;

  if (status === HTTP_CONFLICT) {
    return new CamsConflictError(message, {
      cause: error,
      code: await readCode(error),
    });
  }

  return new CamsClientError(message, {
    cause: error,
    retryable: status === HTTP_BAD_GATEWAY,
  });
}
