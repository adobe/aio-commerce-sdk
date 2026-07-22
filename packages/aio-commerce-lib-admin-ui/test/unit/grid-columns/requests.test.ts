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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { describe, expect, it } from "vitest";

import { parseGridRequest } from "#grid-columns/requests/presets";

import type { GridType } from "#grid-columns/requests/types";

const VALID_REQUEST = {
  gridType: "order",
  ids: ["000000001", "000000002"],
  requestId: "550e8400-e29b-41d4-a716-446655440000",
};

describe("parseGridRequest", () => {
  it.each(["order", "product", "customer"] satisfies GridType[])(
    "accepts gridType %s",
    (gridType) => {
      const result = parseGridRequest({ ...VALID_REQUEST, gridType });
      expect(result.gridType).toBe(gridType);
    },
  );

  it("returns the parsed request when input is valid", () => {
    expect(parseGridRequest(VALID_REQUEST)).toEqual(VALID_REQUEST);
  });

  it("throws when requestId is missing", () => {
    const input = { gridType: "order", ids: ["1"] };
    expect(() => parseGridRequest(input)).toThrow(CommerceSdkValidationError);
  });

  it("throws when requestId is empty", () => {
    expect(() => parseGridRequest({ ...VALID_REQUEST, requestId: "" })).toThrow(
      CommerceSdkValidationError,
    );
  });

  it("throws when ids is empty", () => {
    expect(() => parseGridRequest({ ...VALID_REQUEST, ids: [] })).toThrow(
      CommerceSdkValidationError,
    );
  });

  it("throws when ids contains a non-string entry", () => {
    expect(() => parseGridRequest({ ...VALID_REQUEST, ids: ["1", 2] })).toThrow(
      CommerceSdkValidationError,
    );
  });

  it("throws when ids contains an empty string", () => {
    expect(() =>
      parseGridRequest({ ...VALID_REQUEST, ids: ["1", ""] }),
    ).toThrow(CommerceSdkValidationError);
  });

  it("throws when gridType is not a known value", () => {
    expect(() =>
      parseGridRequest({ ...VALID_REQUEST, gridType: "sales_order_grid" }),
    ).toThrow(CommerceSdkValidationError);
  });

  it("throws when the input is not an object", () => {
    expect(() => parseGridRequest("nope")).toThrow(CommerceSdkValidationError);
  });
});
