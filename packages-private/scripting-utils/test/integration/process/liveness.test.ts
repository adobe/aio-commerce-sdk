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

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { ChildProcess } from "node:child_process";

const PACKAGE_ROOT = fileURLToPath(new URL("../../..", import.meta.url));
const LIVENESS = join(PACKAGE_ROOT, "source/process/liveness.ts");

/** Starting a process through tsx can take seconds on a busy machine, and the owner check runs every second. */
const REAL_PROCESS_TIMEOUT_MS = 30_000;

/** Longer than one check of the owner pid, so a check happens while the owner is alive. */
const IDLE_WAIT_MS = 1500;

describe("waitForOwnerExit in a real process", {
  timeout: REAL_PROCESS_TIMEOUT_MS,
}, () => {
  const started: ChildProcess[] = [];
  let directory: string;
  let script: string;

  /** Runs the waiter script with the environment and collects its output. */
  function runWaiter(env: NodeJS.ProcessEnv) {
    const waiter = spawn(process.execPath, [script], {
      cwd: PACKAGE_ROOT,
      env: { ...process.env, NODE_OPTIONS: "--import tsx", ...env },
      stdio: ["ignore", "pipe", "pipe"],
    });
    started.push(waiter);

    const output = { text: "" };
    for (const stream of [waiter.stdout, waiter.stderr]) {
      stream?.on("data", (chunk) => {
        output.text += String(chunk);
      });
    }

    return output;
  }

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "liveness-"));
    script = join(directory, "waiter.mts");
    writeFileSync(
      script,
      `import { waitForOwnerExit } from ${JSON.stringify(LIVENESS)};
console.log("waiting");
try {
  console.log("owner gone: " + (await waitForOwnerExit()));
} catch (error) {
  console.log("failed: " + error.message);
}
`,
    );
  });

  afterEach(() => {
    for (const child of started.splice(0)) {
      child.kill();
    }

    rmSync(directory, { force: true, recursive: true });
  });

  test("without the pipe marker, waits on the pid check and resolves with pid when the owner is gone", async () => {
    const owner = spawn(process.execPath, [
      "-e",
      "setInterval(() => undefined, 1000)",
    ]);
    started.push(owner);
    const output = runWaiter({
      __AIO_COMMERCE_SDK_DETACHED_OWNER_PID: String(owner.pid),
    });

    await vi.waitFor(() => expect(output.text).toContain("waiting"), {
      timeout: 10_000,
    });
    await new Promise((resolve) => setTimeout(resolve, IDLE_WAIT_MS));
    expect(output.text).not.toContain("owner gone");

    owner.kill();

    await vi.waitFor(() => expect(output.text).toContain("owner gone: pid"), {
      timeout: 10_000,
    });
  });

  test("with a marker for a file descriptor that is not a pipe, still relies on the pid check", async () => {
    const owner = spawn(process.execPath, ["-e", ""]);
    await new Promise((resolve) => owner.once("exit", resolve));
    const output = runWaiter({
      __AIO_COMMERCE_SDK_DETACHED_LIVENESS_FD: "3",
      __AIO_COMMERCE_SDK_DETACHED_OWNER_PID: String(owner.pid),
    });

    await vi.waitFor(() => expect(output.text).toContain("owner gone: pid"), {
      timeout: 10_000,
    });
  });

  test("reports an owner pid that is not valid instead of crashing", async () => {
    const output = runWaiter({
      __AIO_COMMERCE_SDK_DETACHED_OWNER_PID: "not-a-pid",
    });

    await vi.waitFor(
      () =>
        expect(output.text).toContain(
          "failed: __AIO_COMMERCE_SDK_DETACHED_OWNER_PID must be a positive integer, got not-a-pid",
        ),
      { timeout: 10_000 },
    );
  });
});
