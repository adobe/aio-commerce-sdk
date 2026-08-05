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

import { describe, expect, test, vi } from "vitest";

import { backoffMs, run } from "#commands/hooks/post-deploy";

import type { SelfUpdateResponseCode } from "#commands/hooks/post-deploy";

/** A no-op `sleep` for tests that don't assert on backoff timing. */
async function noopSleep(): Promise<void> {
  // Intentionally empty: tests never actually wait between retries.
}

const makeInvoke = (codes: SelfUpdateResponseCode[]) => {
  const seq = [...codes];
  return vi.fn(async () => {
    const code = seq.shift();
    if (!code) {
      throw new Error("makeInvoke called more times than codes provided");
    }
    return { response: { result: { body: { code } } } };
  });
};

describe("commands/hooks/post-deploy", () => {
  describe("run", () => {
    test("started ends the loop with one invoke, no give-up write", async () => {
      const invoke = makeInvoke(["started"]);
      const writeUpdateStatus = vi.fn();
      const outcome = await run({
        emClient: { writeUpdateStatus },
        getExtensionId: async () => "ext-1",
        invokeAction: invoke,
        sleep: noopSleep,
      });

      expect(outcome.code).toBe("started");
      expect(invoke).toHaveBeenCalledTimes(1);
      expect(writeUpdateStatus).not.toHaveBeenCalled();
    });

    test("retries on busy then succeeds", async () => {
      const invoke = makeInvoke(["busy", "busy", "started"]);
      const outcome = await run({
        emClient: { writeUpdateStatus: vi.fn() },
        getExtensionId: async () => "ext-1",
        invokeAction: invoke,
        maxAttempts: 5,
        sleep: noopSleep,
      });

      expect(outcome.code).toBe("started");
      expect(invoke).toHaveBeenCalledTimes(3);
    });

    test("gives up after maxAttempts busy and writes UPDATE_FAILED", async () => {
      const invoke = makeInvoke(["busy", "busy", "busy"]);
      const writeUpdateStatus = vi.fn();
      const outcome = await run({
        emClient: { writeUpdateStatus },
        getExtensionId: async () => "ext-1",
        invokeAction: invoke,
        maxAttempts: 3,
        sleep: noopSleep,
      });

      expect(outcome.code).toBe("gave-up");
      expect(writeUpdateStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          extensionId: "ext-1",
          status: "UPDATE_FAILED",
        }),
      );
    });

    test("skipped-manual ends immediately with no give-up write", async () => {
      const invoke = makeInvoke(["skipped-manual"]);
      const writeUpdateStatus = vi.fn();
      const outcome = await run({
        emClient: { writeUpdateStatus },
        getExtensionId: async () => "ext-1",
        invokeAction: invoke,
        sleep: noopSleep,
      });

      expect(outcome.code).toBe("skipped-manual");
      expect(writeUpdateStatus).not.toHaveBeenCalled();
    });

    test("give-up skips the EM write when no extensionId is known", async () => {
      const writeUpdateStatus = vi.fn();
      const outcome = await run({
        emClient: { writeUpdateStatus },
        getExtensionId: async () => undefined,
        invokeAction: makeInvoke(["busy"]),
        maxAttempts: 1,
        sleep: noopSleep,
      });

      expect(outcome.code).toBe("gave-up");
      expect(writeUpdateStatus).not.toHaveBeenCalled();
    });

    test.each([
      ["skipped-not-installed"],
      ["review-required"],
      ["unsupported"],
    ] as const)(
      "%s ends the loop with one invoke, no give-up write",
      async (code) => {
        const invoke = makeInvoke([code]);
        const writeUpdateStatus = vi.fn();
        const outcome = await run({
          emClient: { writeUpdateStatus },
          getExtensionId: async () => "ext-1",
          invokeAction: invoke,
          sleep: noopSleep,
        });

        expect(outcome.code).toBe(code);
        expect(invoke).toHaveBeenCalledTimes(1);
        expect(writeUpdateStatus).not.toHaveBeenCalled();
      },
    );

    test("defaults to 5 max attempts when not provided", async () => {
      const invoke = makeInvoke(["busy", "busy", "busy", "busy", "busy"]);
      const outcome = await run({
        emClient: { writeUpdateStatus: vi.fn() },
        getExtensionId: async () => undefined,
        invokeAction: invoke,
        sleep: noopSleep,
      });

      expect(outcome.code).toBe("gave-up");
      expect(invoke).toHaveBeenCalledTimes(5);
    });

    test("backs off between busy retries using the bounded exponential formula", async () => {
      const invoke = makeInvoke(["busy", "busy", "busy", "started"]);
      const sleep = vi.fn(noopSleep);
      await run({
        baseDelayMs: 100,
        emClient: { writeUpdateStatus: vi.fn() },
        getExtensionId: async () => "ext-1",
        invokeAction: invoke,
        maxAttempts: 5,
        maxDelayMs: 350,
        sleep,
      });

      // attempt 0 -> 100, attempt 1 -> 200, attempt 2 -> min(400, 350) = 350
      expect(sleep).toHaveBeenNthCalledWith(1, 100);
      expect(sleep).toHaveBeenNthCalledWith(2, 200);
      expect(sleep).toHaveBeenNthCalledWith(3, 350);
    });

    test("does not sleep after the final attempt gives up", async () => {
      const invoke = makeInvoke(["busy", "busy"]);
      const sleep = vi.fn(noopSleep);
      await run({
        emClient: { writeUpdateStatus: vi.fn() },
        getExtensionId: async () => undefined,
        invokeAction: invoke,
        maxAttempts: 2,
        sleep,
      });

      expect(sleep).toHaveBeenCalledTimes(1);
    });
  });

  describe("backoffMs", () => {
    test("doubles per attempt and caps at maxDelayMs", () => {
      expect(backoffMs(0, 1000, 30_000)).toBe(1000);
      expect(backoffMs(1, 1000, 30_000)).toBe(2000);
      expect(backoffMs(2, 1000, 30_000)).toBe(4000);
      expect(backoffMs(10, 1000, 30_000)).toBe(30_000);
    });
  });
});
