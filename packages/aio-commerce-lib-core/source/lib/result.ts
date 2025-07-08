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

export type Success<T> = { type: "success"; value: T; error: never };
export type Failure<E extends ErrorType> = {
  type: "failure";
  value: never;
  error: E;
};
export type Result<T, E extends ErrorType> = Success<T> | Failure<E>;

export type ErrorType = {
  _tag: string;
  [key: string]: unknown;
};

export function succeed<T>(value: T): Success<T> {
  return { type: SuccessOrFailure.SUCCESS, value, error: undefined as never };
}

export function fail<E extends ErrorType>(error: E): Failure<E> {
  return { type: SuccessOrFailure.FAILURE, error, value: undefined as never };
}

export function getData<T, E extends ErrorType>(result: Result<T, E>) {
  if (result.type === SuccessOrFailure.SUCCESS) {
    return result.value satisfies T;
  }
  throw new Error("Cannot get data from a Failure");
}

export function getError<T, E extends ErrorType>(result: Result<T, E>) {
  if (result.type === SuccessOrFailure.FAILURE) {
    return result.error satisfies E;
  }
  throw new Error("Cannot get error from a Success");
}

export function isSuccess<T, E extends ErrorType>(
  result: Result<T, E>,
): result is Success<T> {
  return result.type === SuccessOrFailure.SUCCESS;
}

export function isFailure<T, E extends ErrorType>(
  result: Result<T, E>,
): result is Failure<E> {
  return result.type === SuccessOrFailure.FAILURE;
}
