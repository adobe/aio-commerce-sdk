/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import { cyanBright, dim, whiteBright, yellowBright } from "ansis";
import type {
  BaseIssue,
  BaseSchema,
  BaseSchemaAsync,
  InferIssue,
} from "valibot";
import { getDotPath } from "valibot";
import type { ErrorType } from "~/lib/result";

const LAST_RETURN_CHAR = "└── ";
const RETURN_CHAR = "├── ";

type IssueKind = "schema" | "validation" | "transformation";

const mapToText = {
  schema: "Schema validation error",
  validation: "Input error",
  transformation: "Transformation error",
};

function issueToDisplay<TInput>(issues: BaseIssue<TInput>[]): string {
  const total = issues.length;
  const lines: string[] = [];
  let index = 0;
  for (const issue of issues) {
    index++;
    const returnChar = cyanBright(
      index === total ? LAST_RETURN_CHAR : RETURN_CHAR,
    );

    // Inline composeIssue logic
    const kindText = yellowBright(
      mapToText[issue.kind as IssueKind] || "Unmapped issue kind",
    );
    const dotPath = getDotPath(issue);
    const path = dotPath ? cyanBright(dotPath) + whiteBright(dim(" →")) : "";
    const issueLine = `${kindText} ${whiteBright("at")} ${path} ${whiteBright(issue.message)}`;

    lines.push(`${returnChar} ${issueLine}`);
  }
  return lines.join("\n");
}

/**
 * Summarizes the validation result by formatting the issues into a readable string.
 * @param error
 */
export function summarize<
  TSchema extends
    | BaseSchema<unknown, unknown, BaseIssue<unknown>>
    | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
>(error: ValidationError<TSchema>): string {
  return `${whiteBright(error.message)}\n${issueToDisplay(error.issues)}`;
}

/**
 * A Validation error with useful information.
 */
export class ValidationError<
  TSchema extends
    | BaseSchema<unknown, unknown, BaseIssue<unknown>>
    | BaseSchemaAsync<unknown, unknown, BaseIssue<unknown>>,
> extends Error {
  /**
   * The error issues.
   */
  readonly issues: [InferIssue<TSchema>, ...InferIssue<TSchema>[]];

  /**
   * Creates a Valibot error with useful information.
   *
   * @param message
   * @param issues The error issues.
   */
  // @__NO_SIDE_EFFECTS__
  constructor(
    message: string,
    issues: [InferIssue<TSchema>, ...InferIssue<TSchema>[]],
  ) {
    super(message);
    this.name = "ValidationError";
    this.issues = issues;
  }

  toString(): string {
    return summarize(this);
  }
}

export type ValidationErrorType<TIssue> = ErrorType & {
  _tag: "ValidationError";
  message: string;
  issues: [BaseIssue<TIssue>, ...BaseIssue<TIssue>[]];
};
