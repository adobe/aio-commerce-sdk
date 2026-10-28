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

import { CommerceSdkValidationError } from "./validation-error";

/**
 * Converts any thrown value to a human-friendly string.
 *
 * Validation errors use their formatted `display()` output, other errors use their message, and any other value goes through `String()`.
 *
 * @param error - The thrown value to convert.
 * @example
 * ```typescript
 * try {
 *   await doSomething();
 * } catch (error) {
 *   console.error(stringifyError(error));
 * }
 * ```
 */
export function stringifyError(error: unknown): string {
  if (error instanceof CommerceSdkValidationError) {
    return error.display();
  }

  return error instanceof Error ? error.message : String(error);
}
