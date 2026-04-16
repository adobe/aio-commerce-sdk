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

import { describe, expect, test } from "vitest";

import { unwrapHttpError } from "#management/installation/utils/http-error";
import { makeHttpError } from "#test/fixtures/http-error";

describe("unwrapHttpError", () => {
  test("falls back to stringifyError for a plain Error", async () => {
    const result = await unwrapHttpError(new Error("plain error"));
    expect(result).toBe("plain error");
  });

  test("falls back to stringifyError for a non-Error value", async () => {
    const result = await unwrapHttpError("unexpected string");
    expect(result).toBe("unexpected string");
  });

  test("returns status prefix when body is empty", async () => {
    const error = makeHttpError(400, "Bad Request", "");
    expect(await unwrapHttpError(error)).toBe("HTTP 400 Bad Request");
  });

  test("extracts message from body.message", async () => {
    const error = makeHttpError(
      400,
      "Bad Request",
      JSON.stringify({ message: "Provider already exists" }),
    );
    expect(await unwrapHttpError(error)).toBe(
      "HTTP 400 Bad Request — Provider already exists",
    );
  });

  test("extracts message from body.error (string)", async () => {
    const error = makeHttpError(
      422,
      "Unprocessable Entity",
      JSON.stringify({ error: "Invalid event code" }),
    );
    expect(await unwrapHttpError(error)).toBe(
      "HTTP 422 Unprocessable Entity — Invalid event code",
    );
  });

  test("extracts message from body.error.message (nested object)", async () => {
    const error = makeHttpError(
      500,
      "Internal Server Error",
      JSON.stringify({ error: { message: "DB connection failed" } }),
    );
    expect(await unwrapHttpError(error)).toBe(
      "HTTP 500 Internal Server Error — DB connection failed",
    );
  });

  test("extracts message from body.errors[0].message (array)", async () => {
    const error = makeHttpError(
      400,
      "Bad Request",
      JSON.stringify({ errors: [{ message: "Field required" }] }),
    );
    expect(await unwrapHttpError(error)).toBe(
      "HTTP 400 Bad Request — Field required",
    );
  });

  test("interpolates %1, %2 parameters into body.message", async () => {
    const error = makeHttpError(
      400,
      "Bad Request",
      JSON.stringify({
        message:
          'The event provider id "%1" is not configured. The list of configured event provider ids are: [%2]',
        parameters: ["918d1e28-bc6c-4303-8a3e-827b42b30795", "abc, xyz"],
      }),
    );
    expect(await unwrapHttpError(error)).toBe(
      'HTTP 400 Bad Request — The event provider id "918d1e28-bc6c-4303-8a3e-827b42b30795" is not configured. The list of configured event provider ids are: [abc, xyz]',
    );
  });

  test("returns raw message when parameters array is empty", async () => {
    const error = makeHttpError(
      400,
      "Bad Request",
      JSON.stringify({ message: "Something failed", parameters: [] }),
    );
    expect(await unwrapHttpError(error)).toBe(
      "HTTP 400 Bad Request — Something failed",
    );
  });

  test("falls back to raw text body when JSON has no known message field", async () => {
    const error = makeHttpError(
      400,
      "Bad Request",
      JSON.stringify({ code: "ERR_001" }),
    );
    expect(await unwrapHttpError(error)).toBe(
      `HTTP 400 Bad Request — ${JSON.stringify({ code: "ERR_001" })}`,
    );
  });

  test("falls back to raw text body for non-JSON response", async () => {
    const error = makeHttpError(503, "Service Unavailable", "Service is down");
    expect(await unwrapHttpError(error)).toBe(
      "HTTP 503 Service Unavailable — Service is down",
    );
  });
});
