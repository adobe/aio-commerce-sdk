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

import { describe, expect, test, vi } from "vitest";

import { throwHttpError } from "#management/installation/utils/http-error";
import { makeHttpError } from "#test/fixtures/http-error";

describe("throwHttpError", () => {
  test("logs and throws an enriched error message", async () => {
    const logger = { error: vi.fn() };
    const error = makeHttpError(
      400,
      "Bad Request",
      JSON.stringify({ message: "Boom" }),
    );

    await expect(
      throwHttpError(logger, error, "Failed to do the thing"),
    ).rejects.toThrow("Failed to do the thing: HTTP 400 Bad Request — Boom");
    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to do the thing: HTTP 400 Bad Request — Boom",
    );
  });

  test("enriches plain Error with the given prefix", async () => {
    const logger = { error: vi.fn() };

    await expect(
      throwHttpError(logger, new Error("plain"), "Failed to do the thing"),
    ).rejects.toThrow("Failed to do the thing: plain");
  });
});
