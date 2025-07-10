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
 * Wraps the given value in a successful {@link Result}.
 * @param value The value to wrap.
 * @returns An {@link Ok} variant of {@link Result} containing the given value.
 */
export function ok<T>(value: T): Ok<T> {
  return { type: SuccessOrFailure.SUCCESS, value };
}

/**
 * Wraps the given error in a failed {@link Result}.
 * @param error The error to wrap.
 * @returns An {@link Err} variant of {@link Result} containing the given error.
 */
export function err<E extends ErrorType<ErrorTag>>(error: E): Err<E> {
  return { type: SuccessOrFailure.FAILURE, error };
}

/**
 * Unwraps a {@link Result} to retrieve its value.
 * If the {@link Result} is an {@link Err} value, an error will be thrown.
 *
 * @param result The {@link Result} to unwrap.
 * @returns The value contained in the successful {@link Result}.
 * @throws An error if the {@link Result} is an {@link Err} value.
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
 * Unwraps a {@link Result} to retrieve its error.
 * If the {@link Result} is an {@link Ok} value, an error will be thrown.
 *
 * @param result The {@link Result} to unwrap.
 * @returns The error contained in the failed {@link Result}.
 * @throws An error if the {@link Result} is an {@link Ok} value.
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
 * Checks if a {@link Result} is a success.
 * @param result The {@link Result} to check.
 * @returns True if the {@link Result} is an {@link Ok} value, false otherwise.
 */
export function isOk<T, E extends ErrorType<ErrorTag>>(
  result: Result<T, E>,
): result is Ok<T> {
  return result.type === SuccessOrFailure.SUCCESS;
}

/**
 * Checks if a {@link Result} is a failure.
 * @param result The {@link Result} to check.
 * @returns True if the {@link Result} is an {@link Err} value, false otherwise.
 */
export function isErr<T, E extends ErrorType<ErrorTag>>(
  result: Result<T, E>,
): result is Err<E> {
  return result.type === SuccessOrFailure.FAILURE;
}

/**
 * Maps a successful {@link Result} to another value.
 * If the {@link Result} is an {@link Err}, it is returned unchanged.
 *
 * @param result The {@link Result} to map.
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
 * Maps a successful {@link Result} to an asynchronous value.
 * If the {@link Result} is an {@link Err}, it is returned unchanged.
 *
 * @param result The {@link Result} to map.
 * @param fn An async function to transform the success value.
 * @returns A {@link Promise} of a new {@link Result} with the transformed value or the original error.
 */
export async function mapAsync<T, U, E extends ErrorType<ErrorTag>>(
  result: Result<T, E>,
  fn: (value: T) => Promise<U>,
): Promise<Result<U, E>> {
  if (isOk(result)) {
    const transformed = await fn(result.value);
    return ok(transformed);
  }

  return result;
}

/**
 * Flat maps a successful {@link Result} to another {@link Result}.
 * If the {@link Result} is an {@link Err}, it is returned unchanged.
 *
 * @param result The {@link Result} to flat map.
 * @param fn A function that returns a {@link Result}.
 * @returns The {@link Result} returned by fn or the original error.
 */
export function andThen<
  T,
  U,
  E extends ErrorType<ErrorTag>,
  F extends ErrorType<ErrorTag>,
>(result: Result<T, E>, fn: (value: T) => Result<U, F>): Result<U, E | F> {
  if (isOk(result)) {
    return fn(result.value);
  }

  return result;
}

/**
 * Flat maps a successful {@link Result} to another asynchronous {@link Result}.
 * If the {@link Result} is an {@link Err}, it is returned unchanged.
 *
 * @param result The result to flat map.
 * @param fn An async function that returns a {@link Result}.
 * @returns A {@link Promise} of the {@link Result} returned by fn or the original error.
 */
export async function andThenAsync<
  T,
  U,
  E extends ErrorType<ErrorTag>,
  F extends ErrorType<ErrorTag>,
>(
  result: Result<T, E>,
  fn: (value: T) => Promise<Result<U, F>>,
): Promise<Result<U, E | F>> {
  if (isOk(result)) {
    return await fn(result.value);
  }

  return result;
}

/**
 * Maps a failed {@link Result}'s error to another error value.
 * If the {@link Result} is a success, it is returned unchanged.
 *
 * @param result The result to map.
 * @param fn A function to transform the error value.
 * @returns A new {@link Result} with the original value or transformed error.
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

type MatchCallbacks<T, U, E extends ErrorType<ErrorTag>> = {
  /**
   * A function to execute if the result is an {@link Ok} value.
   * @param value The value of the {@link Ok} result.
   * @returns The value to return.
   */
  onSuccess: (value: T) => U;

  /**
   * A function to execute if the result is an {@link Err} value.
   * @param error The error of the {@link Err} result.
   * @returns The value to return.
   */
  onFailure: (error: E) => U;
};

/**
 * Matches a {@link Result} to a value based on its type.
 *
 * @param result The result to match.
 * @param callbacks The callbacks to execute based on the result type.
 * @returns The value returned by the matching function.
 */
export function match<T, U, E extends ErrorType<ErrorTag>>(
  result: Result<T, E>,
  callbacks: MatchCallbacks<T, U, E>,
): U {
  if (isOk(result)) {
    return callbacks.onSuccess(result.value);
  }

  return callbacks.onFailure(result.error);
}
