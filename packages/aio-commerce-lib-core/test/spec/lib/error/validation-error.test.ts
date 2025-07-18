/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/** biome-ignore-all lint/performance/useTopLevelRegex: No performance impact as these are tests. */

import { type GenericIssue, safeParse } from "valibot";
import { describe, expect, it } from "vitest";

import { CommerceSdkValidationError } from "~/lib/error/validation-error";
import {
  mockInvalidUserForInputError,
  mockInvalidUserForSchemaValidationError,
  mockInvalidUserForTransformationError,
  mockUserSchema,
} from "~~/test/fixtures/valibot";

/** Returns mock validation issues for an input error */
function getMockInputErrorIssues() {
  return safeParse(mockUserSchema, mockInvalidUserForInputError)
    .issues as GenericIssue[];
}

/** Returns mock validation issues for a schema validation error */
function getMockSchemaErrorIssues() {
  return safeParse(mockUserSchema, mockInvalidUserForSchemaValidationError)
    .issues as GenericIssue[];
}

/** Returns mock validation issues for a transformation error */
function getMockTransformationErrorIssues() {
  return safeParse(mockUserSchema, mockInvalidUserForTransformationError)
    .issues as GenericIssue[];
}

describe("CommerceSdkValidationError", () => {
  describe("constructor", () => {
    it("should create an error with message and issues", () => {
      const issues = getMockInputErrorIssues();
      const error = new CommerceSdkValidationError("Validation failed", {
        issues,
      });

      expect(error.message).toBe("Validation failed");
      expect(error.issues).toBe(issues);
    });
  });

  describe("display", () => {
    const BRANCH_PATTERN = /├──/;
    const LAST_PATTERN = /└──/;

    it.each([
      ["tree structure - branch", BRANCH_PATTERN, getMockInputErrorIssues()],
      ["tree structure - last item", LAST_PATTERN, getMockInputErrorIssues()],
      ["path separator", /→/, getMockInputErrorIssues()],
      ["input error title", /Input error at/, getMockInputErrorIssues()],
      [
        "schema error title",
        /Schema validation error at/,
        getMockSchemaErrorIssues(),
      ],
      [
        "transformation error title",
        /Transformation error at/,
        getMockTransformationErrorIssues(),
      ],
      ["id field error", /id must not be empty/, getMockInputErrorIssues()],
      [
        "email field error",
        /email must be a valid email/,
        getMockInputErrorIssues(),
      ],
      ["age field error", /age must be 18 or older/, getMockInputErrorIssues()],
    ])("should include %s in output", (_, pattern, issues) => {
      const error = new CommerceSdkValidationError("Validation failed", {
        issues,
      });

      expect(error.display(false)).toMatch(pattern);
    });

    it("should handle single validation issue", () => {
      const [issue] = getMockInputErrorIssues();
      const error = new CommerceSdkValidationError("Single issue", {
        issues: [issue],
      });

      const display = error.display(false);
      expect(display).toMatch(LAST_PATTERN);
      expect(display).not.toMatch(BRANCH_PATTERN);
    });

    it("should handle multiple validation issues", () => {
      const issues = getMockInputErrorIssues();
      const error = new CommerceSdkValidationError("Multiple issues", {
        issues,
      });

      const display = error.display(false);
      const lines = display.split("\n");

      expect(lines[0]).toBe("Multiple issues");
      expect(lines.length - 1).toBe(issues.length); // -1 for error message line

      // Check branch characters
      const branchLines = lines.slice(1, -1);
      for (const line of branchLines) {
        expect(line).toMatch(BRANCH_PATTERN);
      }

      // Check last item character
      expect(lines.at(-1)).toMatch(LAST_PATTERN);
    });

    it.each([
      ["id", /at id →/],
      ["email", /at email →/],
      ["age", /at age →/],
    ])("should include %s path in dot notation", (_, pattern) => {
      const error = new CommerceSdkValidationError("Validation failed", {
        issues: getMockInputErrorIssues(),
      });
      expect(error.display(false)).toMatch(pattern);
    });
  });
});
