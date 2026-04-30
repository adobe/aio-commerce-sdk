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

import * as v from "valibot";

// The internal representation of issues array for Valibot.
type Issues = [v.BaseIssue<unknown>, ...v.BaseIssue<unknown>[]];

/**
 * Prefixes the message of a Valibot issue and all of its nested issues with a given prefix.
 * @param issue The issue to prefix.
 * @param prefix The prefix to add to the issue message.
 * @param separator The string used to join the prefix and the original message.
 */
function prefixIssue(
  issue: v.BaseIssue<unknown>,
  prefix: string,
  separator: string,
): v.BaseIssue<unknown> {
  let joiner = "";

  // Catches empty strings as separators
  if (separator) {
    joiner = separator.endsWith(" ") ? separator : `${separator} `;
  }

  return {
    ...issue,
    message: `${prefix}${joiner}${issue.message}`,
    issues: issue.issues
      ? prefixIssueMessages(issue.issues, prefix, separator)
      : undefined,
  };
}

/**
 * Prefixes the messages of an array of Valibot issues with a given prefix.
 * @param issues - The issues to prefix.
 * @param prefix - The prefix to add to the issue messages.
 * @param separator - The string used to join the prefix and the original messages.
 */
function prefixIssueMessages(
  issues: Issues,
  prefix: string,
  separator: string,
): Issues {
  const [firstIssue, ...restIssues] = issues;

  // Issues is typed as an array with at least one value, so firstIssue is guaranteed to exist.
  // We need to do these two separate passes to satisfy TypeScript
  return [
    prefixIssue(firstIssue, prefix, separator),
    ...restIssues.map((issue) => prefixIssue(issue, prefix, separator)),
  ];
}

/**
 * Adds a prefix to the error messages of a given schema.
 * @param schema The schema to wrap with a prefixed message.
 * @param prefix The prefix to add to the error messages.
 * @param separator The string used to join the prefix and the original message.
 */
export function withPrefixedMessage<TSchema extends v.GenericSchema>(
  schema: TSchema,
  prefix: string,
  separator = " →",
): TSchema {
  return {
    ...schema,
    get "~standard"() {
      return v._getStandardProps(this);
    },

    "~run"(dataset, config) {
      const result = schema["~run"](dataset, config);

      if (result.issues) {
        return {
          ...result,
          issues: prefixIssueMessages(result.issues, prefix, separator),
        };
      }

      return result;
    },
  };
}
