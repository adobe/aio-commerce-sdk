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

import { PassThrough } from "node:stream";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  LIVENESS_FD_ENV,
  OWNER_PID_ENV,
  waitForOwnerExit,
} from "#process/liveness";

const { openSocket } = vi.hoisted(() => ({ openSocket: vi.fn() }));

vi.mock("node:net", () => ({
  default: {
    Socket: class {
      public constructor(options: unknown) {
        // biome-ignore lint/correctness/noConstructorReturn: returns the pipe the test provides
        return openSocket(options);
      }
    },
  },
}));

const OWNER_PID = 200;
const CHECK_INTERVAL_MS = 1000;

describe("waitForOwnerExit", () => {
  const state = { alive: true, errorCode: "ESRCH" };
  let kill: ReturnType<typeof vi.spyOn>;

  /** Starts waiting and returns what the wait has settled with. */
  function startWaiting() {
    const outcome: { signal?: string } = {};
    const waiting = waitForOwnerExit().then((signal) => {
      outcome.signal = signal;
    });

    return { outcome, waiting };
  }

  /** Makes the opening of the liveness pipe return the pipe, and fail from the second time on. */
  function provideLivenessPipe() {
    const pipe = Object.assign(new PassThrough(), { unref: vi.fn() });
    let opened = 0;
    openSocket.mockReset().mockImplementation(() => {
      opened += 1;
      if (opened > 1) {
        throw new Error("EEXIST");
      }

      return pipe;
    });

    return pipe;
  }

  /** Lets the given number of checks of the owner pid go by. */
  const checks = (count: number) =>
    vi.advanceTimersByTimeAsync(count * CHECK_INTERVAL_MS);

  beforeEach(() => {
    vi.useFakeTimers();
    state.alive = true;
    state.errorCode = "ESRCH";
    vi.stubEnv(OWNER_PID_ENV, String(OWNER_PID));
    vi.stubEnv(LIVENESS_FD_ENV, "3");
    openSocket.mockReset().mockImplementation(() => {
      throw new Error("fd 3 is not a pipe");
    });
    kill = vi.spyOn(process, "kill").mockImplementation(((pid: number) => {
      if (pid === OWNER_PID && state.alive) {
        return true;
      }

      throw Object.assign(new Error(state.errorCode), {
        code: state.errorCode,
      });
    }) as typeof process.kill);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    kill.mockRestore();
  });

  test.each(["", "0", "-1", "abc", "1.5"])(
    "rejects with a RangeError when the owner pid is %j",
    async (value) => {
      vi.stubEnv(OWNER_PID_ENV, value);

      await expect(waitForOwnerExit()).rejects.toThrow(RangeError);
      expect(openSocket).not.toHaveBeenCalled();
    },
  );

  test("rejects with a RangeError when there is no owner pid", async () => {
    vi.stubEnv(OWNER_PID_ENV, undefined);

    await expect(waitForOwnerExit()).rejects.toThrow(RangeError);
  });

  describe("without the liveness pipe marker", () => {
    test.each([undefined, "", "0", "abc"])(
      "never opens a file descriptor for the marker %j, and relies on the pid check",
      async (value) => {
        vi.stubEnv(LIVENESS_FD_ENV, value);
        const { outcome } = startWaiting();

        await checks(5);
        expect(outcome.signal).toBeUndefined();

        state.alive = false;
        await checks(1);

        expect(outcome.signal).toBe("pid");
        expect(openSocket).not.toHaveBeenCalled();
      },
    );
  });

  describe("with the liveness pipe marker", () => {
    test("opens the file descriptor of the marker and resolves with pipe when it ends", async () => {
      const pipe = provideLivenessPipe();
      vi.stubEnv(LIVENESS_FD_ENV, "7");
      const { outcome, waiting } = startWaiting();

      pipe.end();
      await waiting;

      expect(openSocket).toHaveBeenCalledExactlyOnceWith({
        fd: 7,
        readable: true,
        writable: false,
      });
      expect(outcome.signal).toBe("pipe");
    });

    test("falls back to the pid check when the file descriptor is not a pipe", async () => {
      const { outcome } = startWaiting();

      await checks(5);
      expect(outcome.signal).toBeUndefined();

      state.alive = false;
      await checks(1);
      expect(outcome.signal).toBe("pid");
    });

    test("stays idle while the owner is alive, whatever the pipe carries", async () => {
      const pipe = provideLivenessPipe();
      const { outcome } = startWaiting();

      pipe.write("ignored");
      await checks(60);

      expect(outcome.signal).toBeUndefined();
    });

    test("does not take an error of the pipe for the end of the owner, and the pid check decides", async () => {
      const pipe = provideLivenessPipe();
      const { outcome } = startWaiting();

      pipe.emit("error", new Error("EPIPE"));
      pipe.emit("error", new Error("EPIPE again"));
      expect(pipe.destroyed).toBe(true);
      await checks(5);
      expect(outcome.signal).toBeUndefined();

      state.alive = false;
      await checks(1);
      expect(outcome.signal).toBe("pid");
    });

    test("does not take a pipe that failed and closed for the end of the owner", async () => {
      const pipe = provideLivenessPipe();
      const { outcome } = startWaiting();

      pipe.destroy(new Error("broken pipe"));
      await checks(5);
      expect(outcome.signal).toBeUndefined();
    });

    test("is safe to call twice, the second call relies on the pid check", async () => {
      const pipe = provideLivenessPipe();
      const first = startWaiting();
      const second = startWaiting();

      pipe.end();
      await first.waiting;
      expect([first.outcome.signal, second.outcome.signal]).toEqual([
        "pipe",
        undefined,
      ]);

      state.alive = false;
      await checks(1);
      expect(second.outcome.signal).toBe("pid");
    });
  });

  describe("the check of the owner pid", () => {
    test("only checks that the pid exists, without sending a signal", async () => {
      startWaiting();

      await checks(1);

      expect(kill).toHaveBeenCalledWith(OWNER_PID, 0);
    });

    test("counts a process that may not be signaled as alive", async () => {
      state.alive = false;
      state.errorCode = "EPERM";
      const { outcome } = startWaiting();

      await checks(5);

      expect(outcome.signal).toBeUndefined();
    });

    test("stops checking after it resolved", async () => {
      const pipe = provideLivenessPipe();
      const { waiting } = startWaiting();

      pipe.end();
      await waiting;
      kill.mockClear();
      await checks(5);

      expect(kill).not.toHaveBeenCalled();
    });
  });
});
