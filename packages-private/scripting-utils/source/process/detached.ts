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
import { closeSync, openSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { ChildProcess } from "node:child_process";
import type { Socket } from "node:net";

/**
 * The path of a log file in the temp folder, for {@link SpawnDetachedOptions.logPath}.
 *
 * @param name - The name of the log. Characters that a file name should not hold become `_`.
 * @param directory - The folder of the file. Defaults to the temp folder of the system.
 */
export function getTempLogPath(name: string, directory = tmpdir()) {
  return join(directory, `${name.replaceAll(/[^\w-]/g, "_")}.log`);
}

/** Options of {@link spawnDetached}. */
export type SpawnDetachedOptions = {
  /** The Node.js script to run. */
  script: string;

  /** The arguments of the script. */
  args?: string[];

  /** The file that receives the standard output and the standard error of the process. */
  logPath: string;
  env?: NodeJS.ProcessEnv;
  cwd?: string;

  /** Called with the reason when the process cannot start, including a failure after the start. */
  onError?: (error: unknown) => void;
  spawnProcess?: typeof spawn;
};

/** A process that was started by {@link spawnDetached}. */
export type DetachedProcess = {
  child: ChildProcess;
};

/** Keeps the parent end of every liveness pipe referenced until its child exits. */
const livenessPipes: Socket[] = [];

/**
 * Starts a Node.js script as a detached process that outlives this one.
 *
 * The process runs in its own session without a terminal, so Ctrl-C, a closed terminal and a kill
 * of this process do not reach it. Its standard input is closed, and its output goes to a log
 * file. A pipe on file descriptor 3 lets the process see this one die, see
 * {@link waitForOwnerExit}.
 *
 * Failures after the spawn, such as a missing node binary, arrive only through `onError`. A script
 * that does not exist shows up only in the log file.
 *
 * @returns The process, or `undefined` when it could not start.
 */
export function spawnDetached(
  options: SpawnDetachedOptions,
): DetachedProcess | undefined {
  const {
    script,
    args = [],
    logPath,
    env,
    cwd,
    onError,
    spawnProcess = spawn,
  } = options;

  let logFd: number | undefined;

  try {
    logFd = openSync(logPath, "a");
    const child = spawnProcess(process.execPath, [script, ...args], {
      cwd,
      // A new session, so signals sent to this process group do not reach the child.
      detached: true,
      env,
      // Never "inherit": a reader of this process pipes, such as a CI log capture, would wait for it.
      stdio: ["ignore", logFd, logFd, "pipe"],
      windowsHide: true,
    });

    // A failed start shows up as an event, which would otherwise crash this process.
    child.once("error", (error) => onError?.(error));

    const pipe = child.stdio[3] as Socket | null | undefined;
    if (pipe) {
      // The child sees this process die when this end closes, so it is kept open and unref'd to not
      // keep this process alive. A failed pipe must not crash it.
      pipe.on("error", () => undefined);
      pipe.unref();
      livenessPipes.push(pipe);
      child.once("exit", () => {
        pipe.destroy();
        livenessPipes.splice(livenessPipes.indexOf(pipe), 1);
      });
    }

    child.unref();

    return { child };
  } catch (error) {
    onError?.(error);
  } finally {
    if (logFd !== undefined) {
      closeSync(logFd);
    }
  }
}
