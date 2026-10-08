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
  InvoiceViewButtonRequestSchema,
  invoiceViewButtonErrorResponse,
  okInvoiceViewButtonResponse,
  parseInvoiceViewButtonRequest,
} from "../../../source/invoice-view-buttons";

import type { InvoiceViewButtonRequest } from "../../../source/invoice-view-buttons";

const VALID_REQUEST = {
  id: "export-invoice",
  invoiceId: "000000001",
  requestId: "550e8400-e29b-41d4-a716-446655440000",
};

describe("parseInvoiceViewButtonRequest", () => {
  it("returns the invoice request through the public entrypoint", () => {
    const request: InvoiceViewButtonRequest =
      parseInvoiceViewButtonRequest(VALID_REQUEST);
    expect(request).toEqual(VALID_REQUEST);
    expect(InvoiceViewButtonRequestSchema).toBeDefined();
  });

  it.each(["requestId", "id", "invoiceId"] as const)(
    "rejects a missing %s",
    (field) => {
      const input = Object.fromEntries(
        Object.entries(VALID_REQUEST).filter(([key]) => key !== field),
      );
      expect(() => parseInvoiceViewButtonRequest(input)).toThrow(
        CommerceSdkValidationError,
      );
    },
  );

  it.each(["requestId", "id", "invoiceId"] as const)(
    "rejects an empty or non-string %s",
    (field) => {
      for (const value of ["", 123, null, []]) {
        expect(() =>
          parseInvoiceViewButtonRequest({ ...VALID_REQUEST, [field]: value }),
        ).toThrow(CommerceSdkValidationError);
      }
    },
  );

  it.each(["nope", null, undefined, 1, []])(
    "rejects a non-object payload %j",
    (input) => {
      expect(() => parseInvoiceViewButtonRequest(input)).toThrow(
        CommerceSdkValidationError,
      );
    },
  );

  it("does not accept an order ID in place of an invoice ID", () => {
    expect(() =>
      parseInvoiceViewButtonRequest({
        id: VALID_REQUEST.id,
        orderId: "123",
        requestId: VALID_REQUEST.requestId,
      }),
    ).toThrow(CommerceSdkValidationError);
  });

  it("strips runtime parameters outside the invoice contract", () => {
    expect(
      parseInvoiceViewButtonRequest({ ...VALID_REQUEST, orderId: "123" }),
    ).toEqual(VALID_REQUEST);
  });
});

describe("okInvoiceViewButtonResponse", () => {
  it("returns an HTTP 200 success response with an empty body", () => {
    expect(okInvoiceViewButtonResponse()).toEqual({
      body: {},
      statusCode: 200,
      type: "success",
    });
  });
});

describe("invoiceViewButtonErrorResponse", () => {
  it.each([400, 403, 500])(
    "preserves status %i and the error message",
    (statusCode) => {
      const response = invoiceViewButtonErrorResponse(
        statusCode,
        "Could not export the invoice",
      );
      expect(response.type).toBe("error");
      expect(response.error.statusCode).toBe(statusCode);
      expect(response.error.body).toMatchObject({
        message: "Could not export the invoice",
      });
    },
  );
});
