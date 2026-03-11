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

import type { AsyncFunctionArguments, ReleaseChannel } from "./types.ts";

/** Runs the given action in a safe way and returns the result. */
export function runGitHubScript<T>(
  core: AsyncFunctionArguments["core"],
  action: () => T,
) {
  try {
    return action();
  } catch (error) {
    core.setFailed(error instanceof Error ? error : String(error));
    throw error;
  }
}

/** Parses the release channel from the given value. */
export function parseReleaseChannel(value: string | undefined): ReleaseChannel {
  if (value === "internal" || value === "public") {
    return value;
  }

  throw new Error(
    `Unsupported channel "${value ?? ""}". Expected "internal" or "public".`,
  );
}
