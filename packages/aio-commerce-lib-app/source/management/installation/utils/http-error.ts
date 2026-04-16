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

import { stringifyError } from "@aio-commerce-sdk/scripting-utils/error";
import { HTTPError } from "ky";

/**
 * Unwraps a ky `HTTPError` to produce a human-readable string that includes the
 * HTTP status and the message extracted from the response body.
 *
 * If `error` is not an `HTTPError`, falls back to `stringifyError(error)`.
 *
 * Tries the following shapes from the response JSON body, in order:
 * - `body.message` (string) — if `body.parameters` is a non-empty array, `%1`/`%2`/... placeholders are replaced with the corresponding parameter values
 * - `body.error` (string)
 * - `body.error.message` (nested object)
 * - `body.errors[0].message` (array)
 * - raw text body
 *
 * @example
 * // Commerce returns { "message": "Provider already exists" } with status 400
 * await unwrapHttpError(err)
 * // → "HTTP 400 Bad Request — Provider already exists"
 */
export async function unwrapHttpError(error: unknown): Promise<string> {
  if (!(error instanceof HTTPError)) {
    return stringifyError(error);
  }

  const { response } = error;
  const statusPrefix = `HTTP ${response.status} ${response.statusText}`;

  let bodyText: string;
  try {
    bodyText = await response.clone().text();
  } catch {
    return statusPrefix;
  }

  if (!bodyText) {
    return statusPrefix;
  }

  try {
    const json = JSON.parse(bodyText) as unknown;
    const message = extractJsonMessage(json);
    if (message) {
      return `${statusPrefix} — ${message}`;
    }
  } catch {
    // not valid JSON — fall through to raw text
  }

  return `${statusPrefix} — ${bodyText}`;
}

function interpolateParameters(message: string, parameters: unknown[]): string {
  return parameters.reduce<string>(
    (result, param, index) => result.replaceAll(`%${index + 1}`, String(param)),
    message,
  );
}

function extractJsonMessage(json: unknown): string | undefined {
  if (typeof json !== "object" || json === null) {
    return undefined;
  }
  const obj = json as Record<string, unknown>;

  if (typeof obj.message === "string") {
    if (Array.isArray(obj.parameters) && obj.parameters.length > 0) {
      return interpolateParameters(obj.message, obj.parameters);
    }
    return obj.message;
  }
  if (typeof obj.error === "string") {
    return obj.error;
  }
  if (typeof obj.error === "object" && obj.error !== null) {
    const nested = obj.error as Record<string, unknown>;
    if (typeof nested.message === "string") {
      return nested.message;
    }
  }
  if (Array.isArray(obj.errors) && obj.errors.length > 0) {
    const first = obj.errors[0] as Record<string, unknown>;
    if (typeof first.message === "string") {
      return first.message;
    }
  }
  return undefined;
}
