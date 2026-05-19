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

import { getCommerceSystemConfig } from "#runtime";

import type { RuntimeActionParams } from "@adobe/aio-commerce-lib-core/params";

function makeParams(
  overrides: Record<string, unknown> = {},
): RuntimeActionParams {
  return overrides as unknown as RuntimeActionParams;
}

describe("getCommerceSystemConfig", () => {
  test("returns the stored config when both params are present", () => {
    const result = getCommerceSystemConfig(
      makeParams({
        AIO_COMMERCE_BASE_URL: "https://commerce.example.com",
        AIO_COMMERCE_ENV: "saas",
      }),
    );

    expect(result).toEqual({
      baseUrl: "https://commerce.example.com",
      env: "saas",
    });
  });

  test("returns config for paas env", () => {
    const result = getCommerceSystemConfig(
      makeParams({
        AIO_COMMERCE_BASE_URL: "https://commerce.example.com",
        AIO_COMMERCE_ENV: "paas",
      }),
    );

    expect(result).toEqual({
      baseUrl: "https://commerce.example.com",
      env: "paas",
    });
  });

  test("returns null when AIO_COMMERCE_BASE_URL is absent", () => {
    const result = getCommerceSystemConfig(
      makeParams({ AIO_COMMERCE_ENV: "saas" }),
    );
    expect(result).toBeNull();
  });

  test("returns null when AIO_COMMERCE_ENV is absent", () => {
    const result = getCommerceSystemConfig(
      makeParams({ AIO_COMMERCE_BASE_URL: "https://commerce.example.com" }),
    );
    expect(result).toBeNull();
  });

  test("returns null when params are empty", () => {
    const result = getCommerceSystemConfig(makeParams());
    expect(result).toBeNull();
  });
});
