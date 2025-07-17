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

import { cyanBright, dim, whiteBright, yellowBright } from "ansis";
import { type BaseIssue, type GenericIssue, getDotPath } from "valibot";

import {
  CommerceSdkErrorBase,
  type CommerceSdkErrorOptions,
} from "~/lib/error";

const LAST_RETURN_CHAR = "└── ";
const RETURN_CHAR = "├── ";

/** Defines the different types of validation issues that can occur. */
type IssueKind = "schema" | "validation" | "transformation";

/** Maps issue kinds to their corresponding error titles for display purposes. */
const ISSUE_KIND_TO_ERROR_TITLE: Record<IssueKind, string> = {
  schema: "Schema validation error",
  validation: "Input error",
  transformation: "Transformation error",
};

/**
 * Converts validation issues to a formatted display string.
 * @param issues Array of validation issues to format.
 * @returns A formatted string representation of the issues.
 * @example
 * ```typescript
 * const issues = [
 *   { kind: "validation", message: "Expected a string", path: ["name"] },
 *   { kind: "schema", message: "Missing required field", path: ["email"] }
 * ];
 * const display = issueToDisplay(issues);
 * console.log(display);
 * // ├── Input error at name → Expected a string
 * // └── Schema validation error at email → Missing required field
 * ```
 */
function issueToDisplay<TInput>(issues: BaseIssue<TInput>[]) {
  const lines = issues.map((issue, index) => {
    const returnChar = cyanBright(
      index === issues.length - 1 ? LAST_RETURN_CHAR : RETURN_CHAR,
    );

    const kindText = yellowBright(
      ISSUE_KIND_TO_ERROR_TITLE[issue.kind as IssueKind] ||
        "Unknown issue kind",
    );

    const dotPath = getDotPath(issue);
    const path = dotPath ? cyanBright(dotPath) + whiteBright(dim(" →")) : "";
    const issueLine = `${kindText} ${whiteBright("at")} ${path} ${whiteBright(issue.message)}`;

    return `${returnChar} ${issueLine}`;
  });

  return lines.join("\n");
}

/**
 * Prints a validation error to display with the error message and the issues.
 * @param error {@link CommerceSdkValidationError} The validation error to summarize.
 * @returns A pretty-printed string containing the summary of the validation error.
 * @example
 * ```typescript
 * const error = new CommerceSdkValidationError("Configuration validation failed", {
 *   issues: [
 *     { kind: "validation", message: "Expected a non-empty string", path: ["clientId"] },
 *     { kind: "schema", message: "Missing required field", path: ["clientSecret"] }
 *   ]
 * });
 *
 * const displayText = displayValidationError(error);
 * console.log(displayText);
 * // Configuration validation failed
 * // ├── Input error at clientId → Expected a non-empty string
 * // └── Schema validation error at clientSecret → Missing required field
 * ```
 */
function displayValidationError(error: CommerceSdkValidationError) {
  return `${whiteBright(error.message)}\n${issueToDisplay(error.issues)}`;
}

/** Defines the base options for CommerceSdkValidationErrorOptions. */
export type CommerceSdkValidationErrorOptions = CommerceSdkErrorOptions<{
  issues: GenericIssue[];
}>;

/**
 * Represents a validation error in the Commerce SDK.
 * This error is thrown when the input does not conform to the expected schema.
 * It contains a list of issues that describe the validation errors.
 *
 * @example
 * ```ts
 * const error = new CommerceSdkValidationError("Invalid input", {
 *   issues: [
 *     { kind: "validation", message: "Expected a non-empty string", path: "name" },
 *   ],
 * });
 *
 * console.log(error.display());
 * ```
 */
export class CommerceSdkValidationError extends CommerceSdkErrorBase {
  readonly issues: GenericIssue[];
  /**
   * Constructs a new CommerceSdkValidationError instance.
   *
   * @param message - A human-friendly description of the validation error.
   * @param options - Options for the validation error, including the issues that caused the error.
   */
  constructor(
    message: string,
    { issues, ...options }: CommerceSdkValidationErrorOptions,
  ) {
    super(message, options);
    this.issues = issues;
  }

  /** Returns a pretty string representation of the validation error. */
  display() {
    return displayValidationError(this);
  }
}
