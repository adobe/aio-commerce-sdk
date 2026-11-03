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

import net from "node:net";

import type { Readable } from "node:stream";

/** Whether a process with the pid exists. A process we may not signal still exists. */
function isProcessAlive(pid: number) {
  try {
    // Signal 0 only checks that the pid exists, and sends nothing.
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

/** The environment variable that holds the pid of the process that started a detached process. */
export const OWNER_PID_ENV = "__AIO_COMMERCE_SDK_DETACHED_OWNER_PID";

/**
 * The environment variable that holds the file descriptor of the liveness pipe of a detached
 * process. It is only set when that descriptor is such a pipe.
 */
export const LIVENESS_FD_ENV = "__AIO_COMMERCE_SDK_DETACHED_LIVENESS_FD";

/** How often the owner pid is checked. */
const LIVENESS_CHECK_INTERVAL_MS = 1000;

/** The signal that showed that the owner process is gone. */
export type OwnerExitSignal = "pipe" | "pid";

/** Opens the read end of the liveness pipe, or returns `undefined` when there is none. */
function openLivenessPipe(): Readable | undefined {
  const fd = Number(process.env[LIVENESS_FD_ENV]);
  if (!Number.isInteger(fd) || fd <= 0) {
    return undefined;
  }

  try {
    const pipe = new net.Socket({ fd, readable: true, writable: false });

    // A failed pipe must not crash the process, and the pid timer still decides.
    pipe.on("error", () => pipe.destroy());
    pipe.unref();
    return pipe;
  } catch {
    return undefined;
  }
}

/**
 * Resolves when the process that started this one is gone. Does nothing else until then.
 *
 * It only works in a process that {@link spawnDetached} started, which tells it the pid of the
 * owner and the file descriptor of the liveness pipe through the environment variables
 * {@link OWNER_PID_ENV} and {@link LIVENESS_FD_ENV}. Without the pipe it relies on the pid check
 * alone.
 *
 * @throws A `RangeError` if {@link OWNER_PID_ENV} is not set to a positive integer.
 *
 * Two signals:
 * 1. The pipe closes, which follows the end of the pipe. The kernel closes the owner's end when
 *    the owner dies, so this is immediate and an owner that died but was not reaped yet still
 *    counts as dead.
 * 2. The owner pid no longer exists, checked on a timer. It covers a missing or failed pipe, and
 *    it is the weaker signal, because an owner that died but was not reaped still answers as alive.
 */
export async function waitForOwnerExit(): Promise<OwnerExitSignal> {
  const ownerPid = Number(process.env[OWNER_PID_ENV]);
  if (!Number.isInteger(ownerPid) || ownerPid <= 0) {
    throw new RangeError(
      `${OWNER_PID_ENV} must be a positive integer, got ${process.env[OWNER_PID_ENV]}`,
    );
  }

  const pipe = openLivenessPipe();

  return await new Promise((resolve) => {
    const finish = (signal: OwnerExitSignal) => {
      clearInterval(timer);
      resolve(signal);
    };

    const timer = setInterval(() => {
      if (!isProcessAlive(ownerPid)) {
        finish("pid");
      }
    }, LIVENESS_CHECK_INTERVAL_MS);

    let pipeFailed = false;
    pipe?.resume();
    pipe?.once("error", () => {
      pipeFailed = true;
    });
    pipe?.once("close", () => {
      // A pipe that failed says nothing about the owner, so the timer decides.
      if (!pipeFailed) {
        finish("pipe");
      }
    });
  });
}
