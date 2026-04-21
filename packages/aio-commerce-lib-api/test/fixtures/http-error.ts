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

/**
 * Creates a mock ky `HTTPError` with the given status, statusText, and response body string.
 * Uses `Object.setPrototypeOf` to make `instanceof HTTPError` checks work correctly.
 */
export function makeHttpError(
  status: number,
  statusText: string,
  body: string,
): HTTPError {
  const response = new Response(body, { status, statusText });
  const error = Object.assign(
    new Error(`Request failed with status code ${status}`),
    {
      response,
      request: new Request("https://example.com"),
      options: {},
    },
  );
  Object.setPrototypeOf(error, HTTPError.prototype);
  return error as HTTPError;
}
