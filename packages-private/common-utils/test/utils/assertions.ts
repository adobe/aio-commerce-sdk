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
import { expect } from "vitest";

/**
 * Asserts that execution fails with a Valibot issue whose first message matches the expected value.
 *
 * @param execute The sync or async operation expected to fail.
 * @param matcher The exact string or regular expression expected for the first issue message.
 */
export async function expectValiIssueMessage(
  execute: () => unknown | Promise<unknown>,
  matcher: RegExp | string,
) {
  try {
    await execute();
  } catch (error) {
    expect.assert(v.isValiError(error));
    const message = error.issues[0]?.message;

    if (typeof matcher === "string") {
      expect(message).toBe(matcher);
      return;
    }

    expect(message).toMatch(matcher);
    return;
  }

  throw new Error("Expected validation to fail");
}
