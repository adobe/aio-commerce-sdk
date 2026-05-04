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

import { CommerceSdkErrorBase } from "@adobe/aio-commerce-lib-core/error";
import { describe, expect, it } from "vitest";

import {
  AdminUiSdkPermissionDeniedError,
  AdminUiSdkPermissionError,
} from "#lib/commerce/admin-ui-sdk-permissions/errors";

describe("AdminUiSdkPermissionError", () => {
  it("extends CommerceSdkErrorBase", () => {
    const error = new AdminUiSdkPermissionError("something went wrong");

    expect(error).toBeInstanceOf(CommerceSdkErrorBase);
    expect(error).toBeInstanceOf(AdminUiSdkPermissionError);
    expect(error.message).toBe("something went wrong");
  });

  it("forwards traceId", () => {
    const error = new AdminUiSdkPermissionError("err", {
      traceId: "trace-abc",
    });

    expect(error.traceId).toBe("trace-abc");
  });

  it("is recognised by CommerceSdkErrorBase.isSdkError", () => {
    const error = new AdminUiSdkPermissionError("err");

    expect(CommerceSdkErrorBase.isSdkError(error)).toBe(true);
  });
});

describe("AdminUiSdkPermissionDeniedError", () => {
  it("extends AdminUiSdkPermissionError", () => {
    const error = new AdminUiSdkPermissionDeniedError(
      "Acme_Promotions::dashboard",
    );

    expect(error).toBeInstanceOf(AdminUiSdkPermissionError);
    expect(error).toBeInstanceOf(AdminUiSdkPermissionDeniedError);
  });

  it("includes the resource in the message", () => {
    const error = new AdminUiSdkPermissionDeniedError(
      "Acme_Promotions::dashboard",
    );

    expect(error.message).toContain("Acme_Promotions::dashboard");
  });

  it("exposes the resource property", () => {
    const error = new AdminUiSdkPermissionDeniedError(
      "Acme_Promotions::dashboard",
    );

    expect(error.resource).toBe("Acme_Promotions::dashboard");
  });
});
