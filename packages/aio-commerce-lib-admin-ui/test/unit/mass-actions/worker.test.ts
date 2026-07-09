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

import {
  massActionErrorResponse,
  okMassActionResponse,
  parseMassActionRequest,
} from "#mass-actions/worker/presets";

import type { MassActionGridType } from "#mass-actions/worker/types";

const VALID_REQUEST = {
  gridType: "order",
  requestId: "550e8400-e29b-41d4-a716-446655440000",
  selectedIds: ["000000001", "000000002"],
};

describe("parseMassActionRequest", () => {
  it.each([
    "order",
    "product",
    "customer",
  ] satisfies MassActionGridType[])("accepts gridType %s", (gridType) => {
    const result = parseMassActionRequest({ ...VALID_REQUEST, gridType });
    expect(result.gridType).toBe(gridType);
  });

  it("returns the parsed request when input is valid", () => {
    expect(parseMassActionRequest(VALID_REQUEST)).toEqual(VALID_REQUEST);
  });

  it("throws when requestId is missing", () => {
    expect(() =>
      parseMassActionRequest({ gridType: "order", selectedIds: ["1"] }),
    ).toThrow(CommerceSdkValidationError);
  });

  it("throws when requestId is empty", () => {
    expect(() =>
      parseMassActionRequest({ ...VALID_REQUEST, requestId: "" }),
    ).toThrow(CommerceSdkValidationError);
  });

  it("throws when selectedIds is empty", () => {
    expect(() =>
      parseMassActionRequest({ ...VALID_REQUEST, selectedIds: [] }),
    ).toThrow(CommerceSdkValidationError);
  });

  it("throws when selectedIds contains an empty string", () => {
    expect(() =>
      parseMassActionRequest({ ...VALID_REQUEST, selectedIds: ["1", ""] }),
    ).toThrow(CommerceSdkValidationError);
  });

  it("throws when gridType is not a known value", () => {
    expect(() =>
      parseMassActionRequest({ ...VALID_REQUEST, gridType: "unknown_grid" }),
    ).toThrow(CommerceSdkValidationError);
  });

  it("throws when the input is not an object", () => {
    expect(() => parseMassActionRequest("not-an-object")).toThrow(
      CommerceSdkValidationError,
    );
  });
});

describe("okMassActionResponse", () => {
  it("returns a 200 response with an empty body by default", () => {
    const response = okMassActionResponse();
    expect(response.type).toBe("success");
    expect(response.body).toEqual({});
  });

  it("returns a 200 response with a custom body when provided", () => {
    const response = okMassActionResponse({ exported: 3 });
    expect(response.type).toBe("success");
    expect(response.body).toEqual({ exported: 3 });
  });
});

describe("massActionErrorResponse", () => {
  it("returns an error response with the given status code", () => {
    const response = massActionErrorResponse(422, "something went wrong");
    expect(response.type).toBe("error");
    expect(response.error.statusCode).toBe(422);
  });

  it("puts the errorMessage in the message field of the body", () => {
    const response = massActionErrorResponse(500, "could not reach service");
    expect(response.error.body).toMatchObject({
      message: "could not reach service",
    });
  });
});
