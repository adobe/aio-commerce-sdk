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

const SuccessOrFailure = {
  SUCCESS: "success",
  FAILURE: "failure",
} as const;

/** Defines the tag of an error type. */
export type ErrorTag = `${string}Error`;

/** Defines a successful result. */
export type Ok<T> = { type: "success"; value: T };

/** Defines a failed result. */
export type Err<E extends ErrorType<ErrorTag>> = {
  type: "failure";
  error: E;
};

/** Defines a result that can be either a success or a failure. */
export type Result<T, E extends ErrorType<ErrorTag>> = Ok<T> | Err<E>;

/** Defines an error type that can contain any additional properties. */
export type ErrorType<
  TTag extends ErrorTag = `Error`,
  TInfo extends Record<string, unknown> = Record<string, unknown>,
> = TInfo & {
  _tag: TTag;
};

/**
 * Wraps the given value in a successful result.
 * @param value The value to wrap.
 * @returns A successful result containing the given value.
 */
export function ok<T>(value: T): Ok<T> {
  return { type: SuccessOrFailure.SUCCESS, value };
}

/**
 * Wraps the given error in a failed result.
 * @param error The error to wrap.
 * @returns A failed result containing the given error.
 */
export function err<E extends ErrorType<ErrorTag>>(error: E): Err<E> {
  return { type: SuccessOrFailure.FAILURE, error };
}

/**
 * Unwraps a result to retrieve its value.
 * If the result is a failure, an error will be thrown.
 *
 * @param result The result to unwrap.
 * @returns The value contained in the successful result.
 * @throws An error if the result is a failure.
 */
export function unwrap<T, E extends ErrorType<ErrorTag>>(result: Result<T, E>) {
  if (result.type === SuccessOrFailure.SUCCESS) {
    return result.value satisfies T;
  }

  throw new Error(
    "Can't unwrap the value from this result because it's a failure",
  );
}

/**
 * Unwraps a result to retrive it's error.
 * If the result is a success, an error will be thrown.
 *
 * @param result The result to unwrap.
 * @returns The error contained in the failed result.
 * @throws An error if the result is a success.
 */
export function unwrapErr<T, E extends ErrorType<ErrorTag>>(
  result: Result<T, E>,
) {
  if (result.type === SuccessOrFailure.FAILURE) {
    return result.error satisfies E;
  }

  throw new Error(
    "Can't unwrap the error from this result because it's a success",
  );
}

/**
 * Checks if a result is a success.
 * @param result The result to check.
 * @returns True if the result is a success, false otherwise.
 */
export function isOk<T, E extends ErrorType<ErrorTag>>(
  result: Result<T, E>,
): result is Ok<T> {
  return result.type === SuccessOrFailure.SUCCESS;
}

/**
 * Checks if a result is a failure.
 * @param result The result to check.
 * @returns True if the result is a failure, false otherwise.
 */
export function isErr<T, E extends ErrorType<ErrorTag>>(
  result: Result<T, E>,
): result is Err<E> {
  return result.type === SuccessOrFailure.FAILURE;
}

/**
 * Maps a successful result to another value.
 * If the result is a failure, it is returned unchanged.
 *
 * @param result The result to map.
 * @param fn A function to transform the success value.
 * @returns A new {@link Result} with the transformed value or the original error.
 */
export function map<T, U, E extends ErrorType<ErrorTag>>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.value));
  }

  return result;
}

/**
 * Maps a failed result's error to another error value.
 * If the result is a success, it is returned unchanged.
 *
 * @param result The result to map.
 * @param fn A function to transform the error value.
 * @returns A new Result with the original value or transformed error.
 */
export function mapErr<
  T,
  E extends ErrorType<ErrorTag>,
  F extends ErrorType<ErrorTag>,
>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  if (isErr(result)) {
    return err(fn(result.error));
  }

  return result;
}
