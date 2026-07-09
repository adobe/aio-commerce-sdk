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

import { parseOrThrow } from "@aio-commerce-sdk/common-utils/valibot";

import { MassActionSelectionSchema } from "./schema";

import type { MassActionSelection } from "./types";

/**
 * Parses the `selection` query parameter Commerce appends to the iframe URL of
 * a view mass action.
 *
 * Commerce serializes the selection as a JSON string:
 * `?selection={"ids":["000000001","000000002"],"gridType":"customer"}`
 *
 * Throws a `CommerceSdkValidationError` if the input is missing, not valid
 * JSON, or does not match the expected shape.
 *
 * @param rawSelection - The raw string value of the `selection` query parameter.
 *
 * @example
 * ```ts
 * import { parseMassActionSelection } from "@adobe/aio-commerce-lib-admin-ui/mass-actions";
 *
 * // In your SPA route handler:
 * const raw = new URLSearchParams(window.location.search).get("selection");
 * const { ids, gridType } = parseMassActionSelection(raw);
 * ```
 */
export function parseMassActionSelection(
  rawSelection: unknown,
): MassActionSelection {
  if (rawSelection === null || rawSelection === undefined) {
    throw new Error(
      "Invalid mass action selection: the selection query parameter is missing.",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(String(rawSelection));
  } catch (error) {
    throw new Error(
      `Invalid mass action selection: expected a JSON string, got: ${String(rawSelection)}`,
      { cause: error },
    );
  }

  return parseOrThrow(
    MassActionSelectionSchema,
    parsed,
    "Invalid mass action selection",
  );
}
