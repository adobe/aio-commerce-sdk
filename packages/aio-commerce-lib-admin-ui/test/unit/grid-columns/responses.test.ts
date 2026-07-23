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

import { describe, expect, it } from "vitest";

import {
  errorGridResponse,
  okGridResponse,
} from "#grid-columns/responses/presets";

describe("okGridResponse", () => {
  it("wraps rows in the data envelope with statusCode 200", () => {
    const result = okGridResponse({
      "000000001": { fulfillment_status: "shipped", risk_score: 12 },
      "000000002": { fulfillment_status: "pending", risk_score: 47 },
    });

    expect(result).toEqual({
      body: {
        data: {
          "000000001": { fulfillment_status: "shipped", risk_score: 12 },
          "000000002": { fulfillment_status: "pending", risk_score: 47 },
        },
      },
      statusCode: 200,
      type: "success",
    });
  });

  it("does not include the wildcard key when defaults are omitted", () => {
    const result = okGridResponse({ "1": { col: "a" } });
    expect(result.body?.data).not.toHaveProperty("*");
  });

  it("adds the wildcard key when defaults are provided", () => {
    const result = okGridResponse({ "1": { col: "a" } }, { col: "default" });

    expect(result.body?.data).toEqual({
      "*": { col: "default" },
      "1": { col: "a" },
    });
  });

  it("emits an empty data object when rows is empty", () => {
    const result = okGridResponse({});
    expect(result.body).toEqual({ data: {} });
  });

  it("emits only the wildcard key when rows is empty and defaults are provided", () => {
    const result = okGridResponse({}, { col: "fallback" });
    expect(result.body?.data).toEqual({ "*": { col: "fallback" } });
  });
});

describe("errorGridResponse", () => {
  it("returns the given HTTP status code", () => {
    const result = errorGridResponse(500, "Could not reach inventory service");
    expect(result).toEqual({
      error: {
        body: { message: "Could not reach inventory service" },
        statusCode: 500,
      },
      type: "error",
    });
  });

  it("wraps the error message in a message field", () => {
    const result = errorGridResponse(422, "Unprocessable entity");
    expect(result.error.body).toEqual({ message: "Unprocessable entity" });
  });
});
