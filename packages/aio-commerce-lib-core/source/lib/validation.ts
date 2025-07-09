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

import type { ErrorType } from "./result";

const LAST_RETURN_CHAR = "└── ";
const RETURN_CHAR = "├── ";

type IssueKind = "schema" | "validation" | "transformation";
const ISSUE_KIND_TO_ERROR_TITLE: Record<IssueKind, string> = {
  schema: "Schema validation error",
  validation: "Input error",
  transformation: "Transformation error",
};

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
 * Summarizes a validation error by displaying the error message and the issues.
 * @param error The validation error to summarize.
 * @returns A pretty-printed string containing the summary of the validation error.
 */
export function summarizeValidationError(error: ValidationError) {
  return `${whiteBright(error.message)}\n${issueToDisplay(error.issues)}`;
}

/**
 * Creates a validation error.
 * @param message The validation error message.
 * @param issues The issues that occurred during validation.
 * @returns A validation error.
 */
export function makeValidationError(
  message: string,
  issues: [GenericIssue, ...GenericIssue[]],
) {
  return {
    _tag: "ValidationError",
    message,
    issues,
  } satisfies ValidationError;
}

/**
 * Defines a validation error.
 * @param message The validation error message.
 * @param issues The issues that occurred during validation.
 */
export type ValidationError = ErrorType<
  "ValidationError",
  {
    message: string;
    issues: [GenericIssue, ...GenericIssue[]];
  }
>;
