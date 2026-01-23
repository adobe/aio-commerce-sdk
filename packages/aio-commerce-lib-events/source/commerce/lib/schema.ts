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

import { stringValueSchema } from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

/** The schema of the workspace configuration in the Developer Console. */
export function workspaceConfigurationSchema(propertyName: string) {
  return v.union([
    // Input Format (Empty String, JSON String or Object)
    v.pipe(stringValueSchema(propertyName), v.empty()),
    v.pipe(
      stringValueSchema(propertyName),
      v.parseJson(
        undefined,
        `Expected valid JSON string for property '${propertyName}'`,
      ),

      v.record(v.string(), v.unknown()),
      v.stringifyJson(),
    ),

    v.pipe(
      v.record(v.string(), v.unknown()),
      v.stringifyJson(
        undefined,
        `Expected valid JSON data for property '${propertyName}'`,
      ),
    ),
  ]);
}
