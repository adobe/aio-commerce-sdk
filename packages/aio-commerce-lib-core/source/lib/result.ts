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

export type Ok<T> = { type: "success"; value: T };
export type Err<E extends ErrorType> = {
  type: "failure";
  error: E;
};
export type Result<T, E extends ErrorType> = Ok<T> | Err<E>;

export type ErrorType = {
  _tag: string;
  [key: string]: unknown;
};

export function ok<T>(value: T): Ok<T> {
  return { type: SuccessOrFailure.SUCCESS, value };
}

export function err<E extends ErrorType>(error: E): Err<E> {
  return { type: SuccessOrFailure.FAILURE, error };
}

export function unwrap<T, E extends ErrorType>(result: Result<T, E>) {
  if (result.type === SuccessOrFailure.SUCCESS) {
    return result.value satisfies T;
  }
  throw new Error("Cannot get data from a Err");
}

export function unwrapErr<T, E extends ErrorType>(result: Result<T, E>) {
  if (result.type === SuccessOrFailure.FAILURE) {
    return result.error satisfies E;
  }
  throw new Error("Cannot get error from a Ok");
}

export function isOk<T, E extends ErrorType>(
  result: Result<T, E>,
): result is Ok<T> {
  return result.type === SuccessOrFailure.SUCCESS;
}

export function isErr<T, E extends ErrorType>(
  result: Result<T, E>,
): result is Err<E> {
  return result.type === SuccessOrFailure.FAILURE;
}
