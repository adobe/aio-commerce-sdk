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

/** The result of reading data that might not be available in the current host context. */
export type Result<T, E = Error> =
  | { data: T; error: null }
  | { data: null; error: E };

type ActionMap = {
  [key: string]: (...args: unknown[]) => PromiseLike<unknown>;
};

/** The result of exposing an API that might not be available in the current host context. */
export type ActionsResult<T extends ActionMap, E = Error> =
  | { actions: T; error: null }
  | { actions: null; error: E };

/** Creates a successful data result. */
export function ok<T>(data: T): { data: T; error: null } {
  return { data, error: null };
}

/** Creates a failed data result. */
export function error(
  message: string,
  options?: ErrorOptions,
): { data: null; error: Error } {
  return { data: null, error: new Error(message, options) };
}

/** Creates a successful actions result. */
export function okActions<T extends ActionMap>(
  actions: T,
): { actions: T; error: null } {
  return { actions, error: null };
}

/** Creates a failed actions result. */
export function actionsError(
  message: string,
  options?: ErrorOptions,
): { actions: null; error: Error } {
  return { actions: null, error: new Error(message, options) };
}
