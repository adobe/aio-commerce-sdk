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
import { consola } from "consola";
import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  CamsClientError,
  CamsConflictError,
} from "#commands/common/cams/errors";
import {
  describeCamsFailure,
  findCamsError,
  reportFailure,
} from "#commands/common/cams/report";

vi.mock("consola", () => ({
  consola: { debug: vi.fn(), error: vi.fn() },
}));

const REQUEST = { method: "POST", path: "/v1/extensions/ext-1/upgrades/plan" };

function conflict() {
  return new CamsConflictError("Refused", {
    code: "in-progress",
    request: REQUEST,
    status: 409,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("findCamsError", () => {
  test("finds the error itself", () => {
    const error = conflict();

    expect(findCamsError(error)).toBe(error);
  });

  test("finds an error among the causes", () => {
    const cause = conflict();
    const error = new Error("Wrapper", {
      cause: new Error("Middle", { cause }),
    });

    expect(findCamsError(error)).toBe(cause);
  });

  test.each([
    ["an error without a cause", new Error("Broken")],
    ["a value that is not an error", "broken"],
    ["nothing", undefined],
  ])("finds nothing in %s", (_, value) => {
    expect(findCamsError(value)).toBeUndefined();
  });
});

describe("describeCamsFailure", () => {
  test("lists the status, the code and the request", () => {
    expect(describeCamsFailure(conflict())).toBe(
      "Details: HTTP 409, code in-progress, POST /v1/extensions/ext-1/upgrades/plan",
    );
  });

  test("leaves out what the failure does not have", () => {
    const error = new CamsClientError("Down", {
      request: REQUEST,
      status: 500,
    });

    expect(describeCamsFailure(error)).toBe(
      "Details: HTTP 500, POST /v1/extensions/ext-1/upgrades/plan",
    );
  });

  test("has no line for a failure without any of them", () => {
    expect(describeCamsFailure(new CamsClientError("Offline"))).toBeUndefined();
  });
});

describe("reportFailure", () => {
  test("prints a failure of the service as one block and logs the chain for debugging", () => {
    const error = new Error("The upgrade was not planned: Refused", {
      cause: conflict(),
    });

    reportFailure(error);

    expect(consola.error).toHaveBeenCalledExactlyOnceWith(
      "The upgrade was not planned: Refused\nDetails: HTTP 409, code in-progress, POST /v1/extensions/ext-1/upgrades/plan",
    );
    expect(consola.debug).toHaveBeenCalledExactlyOnceWith(error);
  });

  test("prints only the message when the failure has no details", () => {
    reportFailure(new CamsClientError("Offline"));

    expect(consola.error).toHaveBeenCalledExactlyOnceWith("Offline");
  });

  test("prints the given message instead of the one of the error", () => {
    reportFailure(conflict(), "Could not read the run");

    expect(consola.error).toHaveBeenCalledExactlyOnceWith(
      "Could not read the run\nDetails: HTTP 409, code in-progress, POST /v1/extensions/ext-1/upgrades/plan",
    );
  });

  test("prints an unexpected failure with its stack and causes", () => {
    const error = new Error("Broken", { cause: new Error("Root") });

    reportFailure(error);

    expect(consola.error).toHaveBeenCalledExactlyOnceWith(error);
    expect(consola.debug).not.toHaveBeenCalled();
  });

  test("prints an unexpected failure as the given message only", () => {
    reportFailure(new Error("Broken"), "Chosen");

    expect(consola.error).toHaveBeenCalledExactlyOnceWith("Chosen");
  });

  test("prints a validation failure in its readable form", () => {
    const error = new CommerceSdkValidationError("Invalid", { issues: [] });
    vi.spyOn(error, "display").mockReturnValue("Readable");

    reportFailure(error);

    expect(consola.error).toHaveBeenCalledExactlyOnceWith("Readable");
  });
});
