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

import { parseMassActionSelection } from "#mass-actions/view/presets";

const VALID_SELECTION = JSON.stringify({
  gridType: "customer",
  ids: ["000000001", "000000002"],
});

describe("parseMassActionSelection", () => {
  it("parses a valid JSON selection string", () => {
    const result = parseMassActionSelection(VALID_SELECTION);
    expect(result).toEqual({
      gridType: "customer",
      ids: ["000000001", "000000002"],
    });
  });

  it.each([
    "order",
    "product",
    "customer",
  ] as const)("accepts gridType %s", (gridType) => {
    const raw = JSON.stringify({ gridType, ids: ["1"] });
    expect(parseMassActionSelection(raw).gridType).toBe(gridType);
  });

  it("accepts a single id", () => {
    const raw = JSON.stringify({ gridType: "order", ids: ["000000001"] });
    const result = parseMassActionSelection(raw);
    expect(result.ids).toEqual(["000000001"]);
  });

  it("throws with a clear message when input is null", () => {
    expect(() => parseMassActionSelection(null)).toThrow(
      "selection query parameter is missing",
    );
  });

  it("throws with a clear message when input is undefined", () => {
    expect(() => parseMassActionSelection(undefined)).toThrow(
      "selection query parameter is missing",
    );
  });

  it("throws when input is not valid JSON", () => {
    expect(() => parseMassActionSelection("not-json")).toThrow(Error);
  });

  it("throws when ids is empty", () => {
    const raw = JSON.stringify({ gridType: "order", ids: [] });
    expect(() => parseMassActionSelection(raw)).toThrow(
      CommerceSdkValidationError,
    );
  });

  it("throws when ids contains an empty string", () => {
    const raw = JSON.stringify({ gridType: "order", ids: ["1", ""] });
    expect(() => parseMassActionSelection(raw)).toThrow(
      CommerceSdkValidationError,
    );
  });

  it("throws when gridType is unknown", () => {
    const raw = JSON.stringify({ gridType: "sales_order_grid", ids: ["1"] });
    expect(() => parseMassActionSelection(raw)).toThrow(
      CommerceSdkValidationError,
    );
  });

  it("throws when ids is missing", () => {
    const raw = JSON.stringify({ gridType: "order" });
    expect(() => parseMassActionSelection(raw)).toThrow(
      CommerceSdkValidationError,
    );
  });

  it("throws when gridType is missing", () => {
    const raw = JSON.stringify({ ids: ["1"] });
    expect(() => parseMassActionSelection(raw)).toThrow(
      CommerceSdkValidationError,
    );
  });
});
