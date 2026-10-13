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

import { EventEmitter } from "node:events";
import { closeSync, openSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { beforeEach, describe, expect, test, vi } from "vitest";

import { getTempLogPath, spawnDetached } from "#process/detached";

vi.mock("node:fs", () => ({ closeSync: vi.fn(), openSync: vi.fn() }));

const LOG_FD = 42;
const LOG_PATH = "/logs/process.log";

describe("spawnDetached", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(openSync).mockReturnValue(LOG_FD);
  });

  /** A stand-in for the child process that records the calls on it. */
  function createFakeChild() {
    const pipe = Object.assign(new EventEmitter(), {
      destroy: vi.fn(),
      unref: vi.fn(),
    });
    const child = Object.assign(new EventEmitter(), {
      stdio: [null, null, null, pipe],
      unref: vi.fn(),
    });

    return { child, pipe, spawnProcess: vi.fn().mockReturnValue(child) };
  }

  test("starts the script detached with a log, no input and a liveness pipe", () => {
    const { child, pipe, spawnProcess } = createFakeChild();

    const started = spawnDetached({
      args: ["one", "two"],
      cwd: "/work",
      env: { KEY: "value" },
      logPath: LOG_PATH,
      script: "/path/to/script.mjs",
      spawnProcess,
    });

    expect(started?.child).toBe(child);
    expect(openSync).toHaveBeenCalledWith(LOG_PATH, "a");
    expect(spawnProcess).toHaveBeenCalledExactlyOnceWith(
      process.execPath,
      ["/path/to/script.mjs", "one", "two"],
      {
        cwd: "/work",
        detached: true,
        env: { KEY: "value" },
        stdio: ["ignore", LOG_FD, LOG_FD, "pipe"],
        windowsHide: true,
      },
    );
    expect(child.unref).toHaveBeenCalledOnce();
    expect(pipe.unref).toHaveBeenCalledOnce();
    expect(closeSync).toHaveBeenCalledWith(LOG_FD);
  });

  test("ignores a pipe error and destroys the pipe when the child exits", () => {
    const { child, pipe, spawnProcess } = createFakeChild();

    spawnDetached({ logPath: LOG_PATH, script: "s.mjs", spawnProcess });
    pipe.emit("error", new Error("EPIPE"));
    child.emit("exit");

    expect(pipe.destroy).toHaveBeenCalledOnce();
  });

  test("runs the script without arguments by default", () => {
    const { spawnProcess } = createFakeChild();

    spawnDetached({ logPath: LOG_PATH, script: "script.mjs", spawnProcess });

    expect(spawnProcess.mock.calls[0][1]).toEqual(["script.mjs"]);
  });

  test("reports a failure that arrives after the start", () => {
    const { child, spawnProcess } = createFakeChild();
    const onError = vi.fn();
    const failure = new Error("ENOENT");

    spawnDetached({
      logPath: LOG_PATH,
      onError,
      script: "s.mjs",
      spawnProcess,
    });
    child.emit("error", failure);

    expect(onError).toHaveBeenCalledWith(failure);
  });

  test("returns nothing, reports the reason and closes the log when the process cannot start", () => {
    const failure = new Error("spawn failed");
    const onError = vi.fn();
    const spawnProcess = vi.fn().mockImplementation(() => {
      throw failure;
    });

    const started = spawnDetached({
      logPath: LOG_PATH,
      onError,
      script: "script.mjs",
      spawnProcess,
    });

    expect(started).toBeUndefined();
    expect(onError).toHaveBeenCalledWith(failure);
    expect(closeSync).toHaveBeenCalledWith(LOG_FD);
  });

  test("returns nothing and starts nothing when the log cannot be opened", () => {
    const failure = new Error("ENOENT");
    vi.mocked(openSync).mockImplementation(() => {
      throw failure;
    });
    const onError = vi.fn();
    const { spawnProcess } = createFakeChild();

    const started = spawnDetached({
      logPath: LOG_PATH,
      onError,
      script: "script.mjs",
      spawnProcess,
    });

    expect(started).toBeUndefined();
    expect(onError).toHaveBeenCalledWith(failure);
    expect(spawnProcess).not.toHaveBeenCalled();
    expect(closeSync).not.toHaveBeenCalled();
  });
});

describe("getTempLogPath", () => {
  test.each([
    ["job-1", "/logs", "/logs/job-1.log"],
    ["a/b c", "/logs", "/logs/a_b_c.log"],
    ["job-1", undefined, join(tmpdir(), "job-1.log")],
  ])("turns the name %s in %s into %s", (name, directory, expected) => {
    expect(getTempLogPath(name, directory)).toBe(expected);
  });
});
