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
  okOrderViewButtonResponse,
  orderViewButtonErrorResponse,
  parseOrderViewButtonRequest,
} from "../../../source/order-view-buttons/presets";

const VALID_REQUEST = {
  requestId: "550e8400-e29b-41d4-a716-446655440000",
  id: "sync-inventory",
  orderId: "000000001",
};

describe("parseOrderViewButtonRequest", () => {
  it("returns the parsed request when input is valid", () => {
    expect(parseOrderViewButtonRequest(VALID_REQUEST)).toEqual(VALID_REQUEST);
  });

  it("throws when requestId is missing", () => {
    const { requestId: _, ...input } = VALID_REQUEST;
    expect(() => parseOrderViewButtonRequest(input)).toThrow(
      CommerceSdkValidationError,
    );
  });

  it("throws when requestId is empty", () => {
    expect(() =>
      parseOrderViewButtonRequest({ ...VALID_REQUEST, requestId: "" }),
    ).toThrow(CommerceSdkValidationError);
  });

  it("throws when id is missing", () => {
    const { id: _, ...input } = VALID_REQUEST;
    expect(() => parseOrderViewButtonRequest(input)).toThrow(
      CommerceSdkValidationError,
    );
  });

  it("throws when id is empty", () => {
    expect(() =>
      parseOrderViewButtonRequest({ ...VALID_REQUEST, id: "" }),
    ).toThrow(CommerceSdkValidationError);
  });

  it("throws when orderId is missing", () => {
    const { orderId: _, ...input } = VALID_REQUEST;
    expect(() => parseOrderViewButtonRequest(input)).toThrow(
      CommerceSdkValidationError,
    );
  });

  it("throws when orderId is empty", () => {
    expect(() =>
      parseOrderViewButtonRequest({ ...VALID_REQUEST, orderId: "" }),
    ).toThrow(CommerceSdkValidationError);
  });

  it("throws when the input is not an object", () => {
    expect(() => parseOrderViewButtonRequest("nope")).toThrow(
      CommerceSdkValidationError,
    );
  });
});

describe("okOrderViewButtonResponse", () => {
  it("returns a 200 success response with an empty body", () => {
    expect(okOrderViewButtonResponse()).toEqual({
      type: "success",
      statusCode: 200,
      body: {},
    });
  });
});

describe("orderViewButtonErrorResponse", () => {
  it("returns an error response with the given status code", () => {
    const response = orderViewButtonErrorResponse(
      500,
      "Could not reach inventory service",
    );
    expect(response.type).toBe("error");
    expect(response.error.statusCode).toBe(500);
  });

  it("puts the error message in the message field of the body", () => {
    const response = orderViewButtonErrorResponse(
      500,
      "Could not reach inventory service",
    );
    expect(response.error.body).toMatchObject({
      message: "Could not reach inventory service",
    });
  });

  it("forwards the status code unchanged", () => {
    const response = orderViewButtonErrorResponse(400, "Bad input");
    expect(response.error.statusCode).toBe(400);
  });
});
