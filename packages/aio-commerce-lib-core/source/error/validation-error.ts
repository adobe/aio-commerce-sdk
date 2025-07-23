/**
 * @license
 *
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
import { getDotPath } from "valibot";

import { CommerceSdkErrorBase } from "./base-error";

import type { BaseIssue, GenericIssue } from "valibot";
import type { CommerceSdkErrorOptions } from "./base-error";

const LAST_RETURN_CHAR = "└── ";
const RETURN_CHAR = "├── ";

/** Defines the different types of validation issues that can occur. */
type IssueKind = "schema" | "validation" | "transformation";

/** Maps issue kinds to their corresponding error titles for display purposes. */
const ISSUE_KIND_TO_ERROR_TITLE: Record<IssueKind, string> = {
  schema: "Schema validation error",
  transformation: "Transformation error",
  validation: "Input error",
};

function getReturnChar(isLastItem: boolean, withColor: boolean) {
  const char = isLastItem ? LAST_RETURN_CHAR : RETURN_CHAR;
  return withColor ? cyanBright(char) : char;
}

function getKindText(kind: IssueKind, withColor: boolean) {
  const text = ISSUE_KIND_TO_ERROR_TITLE[kind] ?? "Unknown issue kind";
  return withColor ? yellowBright(text) : text;
}

function getPathText(dotPath: string | null, withColor: boolean) {
  if (!dotPath) {
    return "";
  }

  return withColor
    ? `${cyanBright(dotPath)}${whiteBright(dim(" →"))}`
    : `${dotPath} →`;
}

function issueToDisplay<TInput>(
  issues?: BaseIssue<TInput>[],
  withColor = true,
) {
  const lines = issues?.map((issue, index) => {
    const returnChar = getReturnChar(index === issues.length - 1, withColor);
    const kindText = getKindText(issue.kind as IssueKind, withColor);
    const path = getPathText(getDotPath(issue), withColor);

    const message = withColor ? whiteBright(issue.message) : issue.message;
    const at = withColor ? whiteBright("at") : "at";

    const issueLine = `${kindText} ${at} ${path} ${message}`;
    return `${returnChar} ${issueLine}`;
  });

  return lines?.join("\n") ?? "";
}

function displayValidationError(
  error: CommerceSdkValidationError,
  withColor = true,
) {
  const display = issueToDisplay(error.issues, withColor);
  const message = withColor ? whiteBright(error.message) : error.message;

  return `${message}\n${display}`;
}

/** Defines the base options for {@link CommerceSdkValidationError}. */
export type CommerceSdkValidationErrorOptions = CommerceSdkErrorOptions<{
  issues: GenericIssue[];
}>;

/**
 * Represents a validation error in the Commerce SDK.
 * This error should be thrown when an input does not conform to the expected schema.
 * It contains a list of issues that describe the validation errors.
 *
 * @example
 * ```ts
 * const error = new CommerceSdkValidationError("Invalid input", {
 *   // `someIssues` is in scope, returned by some `valibot` operation.
 *   issues: someIssues
 * });
 *
 * console.log(error.display());
 * ```
 */
export class CommerceSdkValidationError extends CommerceSdkErrorBase {
  public readonly issues: GenericIssue[];

  /**
   * Constructs a new {@link CommerceSdkValidationError} instance.
   *
   * @param message - A human-friendly description of the validation error.
   * @param options - Options for the validation error, including the issues that caused the error.
   */
  public constructor(
    message: string,
    { issues, ...options }: CommerceSdkValidationErrorOptions,
  ) {
    super(message, options);
    this.issues = issues;
  }

  /**
   * Returns a pretty string (and colored) representation of the validation error.
   * @param withColor Whether to use color in the output.
   */
  public display(withColor = true) {
    return displayValidationError(this, withColor);
  }
}
