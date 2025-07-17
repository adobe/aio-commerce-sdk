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

import util from "node:util";

/** Defines the base options for CommerceSdkErrorBase. */
export type CommerceSdkErrorBaseOptions = ErrorOptions & {
  traceId?: string;
};

/**
 * Helper type to define custom error options.
 * @example
 * ```ts
 * type ValidationErrorOptions = CommerceSdkErrorOptions<{
 *   field: string;
 *   value: unknown;
 * }>;
 * ```
 */
export type CommerceSdkErrorOptions<
  T extends Record<string, unknown> = Record<string, unknown>,
> = CommerceSdkErrorBaseOptions & T;

/**
 * Base class for all AioCommerceSdk errors.
 * @example
 * ```ts
 * class ValidationError extends CommerceSdkErrorBase {
 *   constructor(message: string, options: ValidationErrorOptions) {
 *     super(message, options);
 *   }
 * }
 *
 * const err = new ValidationError("Invalid value", {
 *   tag: "ValidationError",
 *   field: "name",
 *   value: "John Doe",
 * });
 *
 * console.log(err.toJSON());
 * ```
 */
export abstract class CommerceSdkErrorBase extends Error {
  readonly traceId?: string;

  /**
   * Constructs a new CommerceSdkErrorBase instance.
   *
   * @param message - A human-friendly description of the error.
   * @param traceId - An optional trace ID for tracking the error in logs.
   * @param options - Required error options.
   */
  constructor(
    message: string,
    { traceId, ...options }: CommerceSdkErrorBaseOptions,
  ) {
    super(message, options);

    // See TypeScript example on: https://github.com/goldbergyoni/nodebestpractices/blob/master/sections/errorhandling/useonlythebuiltinerror.md#code-example--doing-it-even-better
    Object.setPrototypeOf(this, new.target.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }

    this.name = "AioCommerceSdkError";
    this.traceId = traceId;
  }

  /** Checks if the error is an CommerceSdkErrorBase instance. */
  static is(error: unknown): error is CommerceSdkErrorBase {
    return error instanceof CommerceSdkErrorBase;
  }

  /** Returns the full stack trace of the error and its causes. */
  get fullStack() {
    let out = this.stack ?? "";
    let cause = this.cause;

    while (cause instanceof Error) {
      out += `\nCaused by: ${cause.stack ?? cause.message}`;
      cause = cause.cause;
    }

    return out;
  }

  /** Returns the root cause of the error. */
  get rootCause() {
    let cause = this.cause;

    while (cause) {
      if (cause instanceof Error) {
        cause = cause.cause;
      } else {
        break;
      }
    }

    return cause;
  }

  /** Converts the error to a JSON-like representation. */
  toJSON() {
    // This is needed, otherwise JSON.stringify returns '{}' 🤡
    return {
      name: this.name,
      message: this.message,
      stack: this.fullStack,
      cause: this.cause,
      traceId: this.traceId,
    };
  }

  /** Returns a pretty string representation of the error. */
  toString(inspect = true) {
    if (inspect) {
      // This returns a pretty-printed string with more details than `toString`
      return util.inspect(this, {
        depth: null,
        colors: true,
        sorted: true,
        maxStringLength: Number.POSITIVE_INFINITY,
      });
    }

    return super.toString();
  }
}
