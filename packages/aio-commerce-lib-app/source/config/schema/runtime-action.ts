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

import { nonEmptyStringValueSchema } from "@aio-commerce-sdk/common-utils/valibot";
import * as v from "valibot";

// Each segment follows OpenWhisk entity naming: word characters, spaces, `@`, `.` and `-`, no leading or trailing space.
const RUNTIME_ACTION_REFERENCE_REGEX =
  /^\w(?:[\w@ .-]*[\w@.-])?\/\w(?:[\w@ .-]*[\w@.-])?$/u;

/**
 * Schema for a runtime action reference in the format `<package>/<action>`.
 * @param name - The name of the field, used in error messages.
 */
export function runtimeActionReferenceSchema(name: string) {
  return v.pipe(
    nonEmptyStringValueSchema(name),
    v.regex(
      RUNTIME_ACTION_REFERENCE_REGEX,
      'Runtime action must be in the format "<package>/<action>" (e.g., "my-package/my-action")',
    ),
  );
}
