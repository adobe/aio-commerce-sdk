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

import { vi } from "vitest";

import type * as ChildProcess from "node:child_process";

/** Matches any package-install invocation across the supported package managers. */
export const INSTALL_COMMAND_RE = /^(npm install|pnpm add|yarn add|bun add)\b/;

/**
 * Builds a `vi.fn` spy that stubs package-install invocations
 * (`npm install`, `pnpm add`, `yarn add`, `bun add`) so they don't hit the
 * registry, and forwards everything else (e.g. `npm pkg set`) to the real
 * `execSync`.
 */
export async function stubInstallCommands() {
  const { execSync: real } =
    await vi.importActual<typeof ChildProcess>("node:child_process");

  return vi.fn((command: string, options?: ChildProcess.ExecSyncOptions) => {
    if (INSTALL_COMMAND_RE.test(command)) {
      return Buffer.from("");
    }

    return real(command, options);
  });
}
