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
  okRmaViewButtonResponse,
  parseRmaViewButtonRequest,
  RmaViewButtonRequestSchema,
  rmaViewButtonErrorResponse,
} from "#rma-view-buttons/index";

import type { RmaViewButtonRequest } from "#rma-view-buttons/index";

const VALID_REQUEST = {
  id: "approve-return",
  requestId: "550e8400-e29b-41d4-a716-446655440000",
  rmaId: "000000001",
};

describe("parseRmaViewButtonRequest", () => {
  it("returns the return request through the public entrypoint", () => {
    const request: RmaViewButtonRequest =
      parseRmaViewButtonRequest(VALID_REQUEST);
    expect(request).toEqual(VALID_REQUEST);
    expect(RmaViewButtonRequestSchema).toBeDefined();
  });

  it.each(["requestId", "id", "rmaId"] as const)(
    "rejects a missing %s",
    (field) => {
      const input = Object.fromEntries(
        Object.entries(VALID_REQUEST).filter(([key]) => key !== field),
      );
      expect(() => parseRmaViewButtonRequest(input)).toThrow(
        CommerceSdkValidationError,
      );
    },
  );

  it.each(["requestId", "id", "rmaId"] as const)(
    "rejects an empty or non-string %s",
    (field) => {
      for (const value of ["", 123, null, []]) {
        expect(() =>
          parseRmaViewButtonRequest({
            ...VALID_REQUEST,
            [field]: value,
          }),
        ).toThrow(CommerceSdkValidationError);
      }
    },
  );

  it.each(["nope", null, undefined, 1, []])(
    "rejects a non-object payload %j",
    (input) => {
      expect(() => parseRmaViewButtonRequest(input)).toThrow(
        CommerceSdkValidationError,
      );
    },
  );

  it("does not accept an order ID in place of a return ID", () => {
    expect(() =>
      parseRmaViewButtonRequest({
        id: VALID_REQUEST.id,
        orderId: "123",
        requestId: VALID_REQUEST.requestId,
      }),
    ).toThrow(CommerceSdkValidationError);
  });

  it("strips runtime parameters outside the return contract", () => {
    expect(
      parseRmaViewButtonRequest({ ...VALID_REQUEST, orderId: "123" }),
    ).toEqual(VALID_REQUEST);
  });
});

describe("okRmaViewButtonResponse", () => {
  it("returns an HTTP 200 success response with an empty body", () => {
    expect(okRmaViewButtonResponse()).toEqual({
      body: {},
      statusCode: 200,
      type: "success",
    });
  });
});

describe("rmaViewButtonErrorResponse", () => {
  it.each([400, 403, 500])(
    "preserves status %i and the error message",
    (statusCode) => {
      const response = rmaViewButtonErrorResponse(
        statusCode,
        "Could not approve the return",
      );
      expect(response.type).toBe("error");
      expect(response.error.statusCode).toBe(statusCode);
      expect(response.error.body).toMatchObject({
        message: "Could not approve the return",
      });
    },
  );
});
