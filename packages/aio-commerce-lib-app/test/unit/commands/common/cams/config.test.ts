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

import { afterEach, describe, expect, test, vi } from "vitest";

import {
  CAMS_URL_ENV_VAR,
  PROD_CAMS_URL,
  resolveCamsBaseUrl,
  STAGE_CAMS_URL,
} from "#commands/common/cams/config";

describe("resolveCamsBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test.each([
    ["prod", {}, PROD_CAMS_URL],
    ["stage", {}, STAGE_CAMS_URL],
    [
      "stage",
      { [CAMS_URL_ENV_VAR]: "http://localhost:8080" },
      "http://localhost:8080",
    ],
    [
      "prod",
      { [CAMS_URL_ENV_VAR]: " service.example.com " },
      "https://service.example.com",
    ],
    ["prod", { [CAMS_URL_ENV_VAR]: "HTTP://localhost" }, "HTTP://localhost"],
    ["prod", { [CAMS_URL_ENV_VAR]: "  " }, PROD_CAMS_URL],
  ] as const)(
    "resolves the %s environment with %j to %s",
    (env, variables, expected) => {
      expect(resolveCamsBaseUrl(env, variables)).toBe(expected);
    },
  );

  test("reads process.env by default", () => {
    vi.stubEnv(CAMS_URL_ENV_VAR, "https://from-env.example.com");

    expect(resolveCamsBaseUrl("prod")).toBe("https://from-env.example.com");
  });
});
