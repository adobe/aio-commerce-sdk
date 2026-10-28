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

import { parseCreditMemoViewButtonRequest } from "../../../source/credit-memo-view-buttons";
import { parseInvoiceViewButtonRequest } from "../../../source/invoice-view-buttons";
import { parseOrderViewButtonRequest } from "../../../source/order-view-buttons";

const REQUEST_ID = "88a9d305-b58a-4aa7-aa42-e60d55d5a95c";

describe.each([
  { entityKey: "orderId", parse: parseOrderViewButtonRequest },
  { entityKey: "invoiceId", parse: parseInvoiceViewButtonRequest },
  { entityKey: "creditMemoId", parse: parseCreditMemoViewButtonRequest },
])("view-button worker params ($entityKey)", ({ entityKey, parse }) => {
  // Shape of the params an App Builder web action receives from Commerce's ViewButton controller.
  const commerceParams = {
    [entityKey]: "1",
    __ow_headers: { authorization: "Bearer", "x-request-id": REQUEST_ID },
    __ow_method: "post",
    buttonId: "refund-offline",
  };

  it("maps buttonId and the x-request-id header onto id and requestId", () => {
    expect(parse(commerceParams)).toEqual({
      [entityKey]: "1",
      id: "refund-offline",
      requestId: REQUEST_ID,
    });
  });

  it("prefers explicit id and requestId params", () => {
    expect(
      parse({ ...commerceParams, id: "explicit", requestId: "explicit-req" }),
    ).toEqual({ [entityKey]: "1", id: "explicit", requestId: "explicit-req" });
  });

  it("rejects params without a request id in body or headers", () => {
    expect(() =>
      parse({ ...commerceParams, __ow_headers: { authorization: "Bearer" } }),
    ).toThrow(CommerceSdkValidationError);
  });
});
