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
import { describe, expect, test } from "vitest";

import { AssociationRecordNotFoundError } from "#errors/association-record-not-found-error";

const ASSOCIATION_RECORD_REGEX = /association record/i;
const RE_ASSOCIATE_REGEX = /re-associate/i;

describe("AssociationRecordNotFoundError", () => {
  test("extends CommerceSdkErrorBase", () => {
    const error = new AssociationRecordNotFoundError();
    expect(error).toBeInstanceOf(CommerceSdkErrorBase);
    expect(error).toBeInstanceOf(Error);
  });

  test("has a default message describing the association requirement", () => {
    const error = new AssociationRecordNotFoundError();
    expect(error.message).toMatch(ASSOCIATION_RECORD_REGEX);
    expect(error.message).toMatch(RE_ASSOCIATE_REGEX);
  });

  test("accepts a custom message", () => {
    const error = new AssociationRecordNotFoundError("Custom message");
    expect(error.message).toBe("Custom message");
  });

  test("accepts a cause via options", () => {
    const cause = new Error("Underlying failure");
    const error = new AssociationRecordNotFoundError("Custom", { cause });
    expect(error.cause).toBe(cause);
  });

  test("accepts a traceId via options", () => {
    const error = new AssociationRecordNotFoundError("Custom", {
      traceId: "abc-123",
    });
    expect(error.traceId).toBe("abc-123");
  });

  test("sets the error name to the class name", () => {
    const error = new AssociationRecordNotFoundError();
    expect(error.name).toBe("AssociationRecordNotFoundError");
  });

  test("is detectable via CommerceSdkErrorBase.isSdkError", () => {
    const error = new AssociationRecordNotFoundError();
    expect(CommerceSdkErrorBase.isSdkError(error)).toBe(true);
  });
});
