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

import { decodeCommerceInstance } from "#commands/common/cams/commerce-instance";

const encode = (value: string) => Buffer.from(value).toString("base64url");

describe("decodeCommerceInstance", () => {
  test.each([
    ["https://shop.example.com/env/saas", "https://shop.example.com", "saas"],
    [
      "http://localhost:8080/path/env/paas",
      "http://localhost:8080/path",
      "paas",
    ],
    ["https://shop.example.com/env/SAAS", "https://shop.example.com", "saas"],
  ])("reads %s", (decoded, url, env) => {
    expect(decodeCommerceInstance(encode(decoded))).toEqual({ env, url });
  });

  test("reads an id that keeps its base64 padding", () => {
    const padded = Buffer.from("https://a.example.com/env/saas").toString(
      "base64",
    );

    expect(decodeCommerceInstance(padded)).toEqual({
      env: "saas",
      url: "https://a.example.com",
    });
  });

  test.each([
    ["is missing", undefined],
    ["is empty", ""],
    ["has no environment", encode("https://shop.example.com")],
    ["has an unknown environment", encode("https://shop.example.com/env/dev")],
    ["is not a URL", encode("shop.example.com/env/saas")],
    ["is not base64", "%%%"],
  ])("returns undefined when the id %s", (_, commerceId) => {
    expect(decodeCommerceInstance(commerceId)).toBeUndefined();
  });
});
