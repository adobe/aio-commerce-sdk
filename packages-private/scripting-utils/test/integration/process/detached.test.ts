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

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { spawnDetached } from "#process/detached";

import type { Socket } from "node:net";

const PACKAGE_ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const LIVENESS = join(PACKAGE_ROOT, "source/process/liveness.ts");

/** Starting a process through tsx can take seconds on a busy machine. */
const REAL_PROCESS_TIMEOUT_MS = 30_000;

describe("spawnDetached with a real process", {
  timeout: REAL_PROCESS_TIMEOUT_MS,
}, () => {
  let directory: string;
  let logPath: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "detached-"));
    logPath = join(directory, "process.log");
  });

  afterEach(() => {
    rmSync(directory, { force: true, recursive: true });
  });

  test("gives the child a log and a pipe that tells it when this process is gone", async () => {
    const script = join(directory, "child.mts");
    writeFileSync(
      script,
      `import { waitForOwnerExit } from ${JSON.stringify(LIVENESS)};
console.log(JSON.stringify([process.argv.slice(2), process.env.__AIO_COMMERCE_SDK_DETACHED_OWNER_PID, process.env.__AIO_COMMERCE_SDK_DETACHED_LIVENESS_FD]));
const first = waitForOwnerExit();
void waitForOwnerExit();
console.log("owner gone: " + (await first));
process.exit(0);
`,
    );

    const started = spawnDetached({
      args: ["a"],
      cwd: PACKAGE_ROOT,
      env: { ...process.env, NODE_OPTIONS: "--import tsx" },
      logPath,
      script,
    });
    expect.assert(started, "Expected the process to start");

    const read = () => readFileSync(logPath, "utf8");
    await vi.waitFor(
      () => expect(read()).toContain(`[["a"],"${process.pid}","3"]`),
      {
        timeout: 10_000,
      },
    );
    expect(read()).not.toContain("owner gone");

    (started.child.stdio[3] as Socket).destroy();

    await vi.waitFor(() => expect(read()).toContain("owner gone: pipe"), {
      timeout: 10_000,
    });
  });
});
