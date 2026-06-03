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

import { errorGridResponse, okGridResponse } from "#grid-columns/responses";

describe("okGridResponse", () => {
  it("wraps rows in the data envelope with statusCode 200", () => {
    const result = okGridResponse({
      rows: {
        "000000001": { fulfillment_status: "shipped", risk_score: 12 },
        "000000002": { fulfillment_status: "pending", risk_score: 47 },
      },
    });

    expect(result).toEqual({
      type: "success",
      statusCode: 200,
      body: {
        data: {
          "000000001": { fulfillment_status: "shipped", risk_score: 12 },
          "000000002": { fulfillment_status: "pending", risk_score: 47 },
        },
      },
    });
  });

  it("does not include the wildcard key when defaults are omitted", () => {
    const result = okGridResponse({ rows: { "1": { col: "a" } } });
    expect(result.body?.data).not.toHaveProperty("*");
  });

  it("adds the wildcard key when defaults are provided", () => {
    const result = okGridResponse({
      rows: { "1": { col: "a" } },
      defaults: { col: "default" },
    });

    expect(result.body?.data).toEqual({
      "1": { col: "a" },
      "*": { col: "default" },
    });
  });

  it("emits an empty data object when rows is empty", () => {
    const result = okGridResponse({ rows: {} });
    expect(result.body).toEqual({ data: {} });
  });

  it("emits only the wildcard key when rows is empty and defaults are provided", () => {
    const result = okGridResponse({
      rows: {},
      defaults: { col: "fallback" },
    });
    expect(result.body?.data).toEqual({ "*": { col: "fallback" } });
  });
});

describe("errorGridResponse", () => {
  it("produces a 200 response carrying errorStatus only when no message is given", () => {
    const result = errorGridResponse("INTERNAL_ERROR");
    expect(result).toEqual({
      type: "success",
      statusCode: 200,
      body: { errorStatus: "INTERNAL_ERROR" },
    });
  });

  it("includes errorMessage when provided", () => {
    const result = errorGridResponse(
      "INTERNAL_ERROR",
      "Could not reach inventory service",
    );
    expect(result.body).toEqual({
      errorStatus: "INTERNAL_ERROR",
      errorMessage: "Could not reach inventory service",
    });
  });

  it("preserves an explicit empty errorMessage", () => {
    const result = errorGridResponse("X", "");
    expect(result.body).toEqual({ errorStatus: "X", errorMessage: "" });
  });
});
