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

/** A package published as part of a release. */
export type PublishedPackage = {
  name: string;
  version: string;
};

/** A single package's CHANGELOG diff entry, used as LLM input. */
export type ChangelogEntry = {
  package: string;
  version: string;
  /** The newly added CHANGELOG content extracted from the diff. */
  markdown: string;
  prevTag: string;
  newTag: string;
};

/**
 * Minimal exec interface required by input collection.
 * Matches the subset of `@actions/exec` used here, enabling test mocking
 * without a dependency on the Actions runtime.
 */
export interface ExecInterface {
  getExecOutput(
    command: string,
    args?: string[],
    options?: { silent?: boolean; ignoreReturnCode?: boolean },
  ): Promise<{ stdout: string; stderr: string; exitCode: number }>;
}

/** Environment variables required by the LLM model selector. */
export type ReleaseNotesEnvironment = {
  NOTES_MODEL: string;
};
