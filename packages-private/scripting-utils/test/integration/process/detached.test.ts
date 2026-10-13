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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { spawnDetached } from "#process/detached";

import type { Socket } from "node:net";

describe("spawnDetached with a real process", () => {
  let directory: string;
  let logPath: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "detached-"));
    logPath = join(directory, "process.log");
  });

  afterEach(() => {
    rmSync(directory, { force: true, recursive: true });
  });

  test("gives the real child a log and a liveness pipe that ends when this side closes", async () => {
    const script = join(directory, "child.mjs");
    writeFileSync(
      script,
      `import net from "node:net";
console.log(JSON.stringify(process.argv.slice(2)));
const pipe = new net.Socket({ fd: 3, readable: true, writable: false });
pipe.resume();
pipe.on("end", () => { console.log("PIPE-ENDED"); process.exit(0); });
`,
    );

    const started = spawnDetached({ args: ["a", "b"], logPath, script });
    expect.assert(started, "Expected the process to start");

    const read = () => readFileSync(logPath, "utf8");
    await vi.waitFor(() => expect(read()).toContain('["a","b"]'), {
      timeout: 10_000,
    });
    expect(read()).not.toContain("PIPE-ENDED");

    (started.child.stdio[3] as Socket).destroy();

    await vi.waitFor(() => expect(read()).toContain("PIPE-ENDED"), {
      timeout: 10_000,
    });
  });
});
