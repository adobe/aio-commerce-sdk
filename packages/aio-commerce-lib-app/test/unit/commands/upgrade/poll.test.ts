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

import { stripVTControlCharacters } from "node:util";

import { describe, expect, test, vi } from "vitest";

import { CamsClientError } from "#commands/common/cams/errors";
import {
  describeOutcome,
  MAX_CONSECUTIVE_FAILURES,
  pollUntilSettled,
  whenStatusChanges,
} from "#commands/upgrade/poll";

import type { AttemptStatus } from "#commands/common/cams/schema";
import type { PollResult } from "#commands/upgrade/poll";

/** A sleep that does not wait and records the intervals it was asked for. */
function createSleep() {
  const intervals: number[] = [];
  const sleep = async (ms: number) => {
    intervals.push(ms);
  };

  return { intervals, sleep };
}

function status(
  value: AttemptStatus["status"],
  extra: Partial<AttemptStatus> = {},
): AttemptStatus {
  return { id: "run-1", status: value, ...extra };
}

const unreachable = () => new CamsClientError("down", { retryable: true });

/** A poll that fails with a transient error `count` times and then gives the answers. */
function pollAfterFailures(count: number, ...answers: AttemptStatus[]) {
  const poll = vi.fn();
  for (let index = 0; index < count; index += 1) {
    poll.mockRejectedValueOnce(unreachable());
  }

  for (const answer of answers) {
    poll.mockResolvedValueOnce(answer);
  }

  return poll;
}

describe("pollUntilSettled", () => {
  test.each(["succeeded", "failed"] as const)(
    "reports every answer, waits 2 seconds between polls and finishes on %s",
    async (value) => {
      const { intervals, sleep } = createSleep();
      const onStatus = vi.fn();
      const poll = pollAfterFailures(
        0,
        status("pending"),
        status("in-progress"),
        status(value),
      );

      const result = await pollUntilSettled({ onStatus, poll, sleep });

      expect(result).toEqual({ kind: "finished", status: status(value) });
      expect(intervals).toEqual([2000, 2000]);
      expect(onStatus.mock.calls.map(([answer]) => answer.status)).toEqual([
        "pending",
        "in-progress",
        value,
      ]);
    },
  );

  test.each([
    ["a refused request", new CamsClientError("401")],
    ["an error that is not from the service", new Error("Token refused")],
  ])("stops at once on %s", async (_, error) => {
    const { intervals, sleep } = createSleep();
    const poll = vi.fn().mockRejectedValue(error);

    const result = await pollUntilSettled({ poll, sleep });

    expect(result).toEqual({ error, kind: "failed" });
    expect(poll).toHaveBeenCalledOnce();
    expect(intervals).toEqual([]);
  });

  describe("the limit of consecutive failures", () => {
    test("ends the loop at the tenth failure in a row", async () => {
      const { intervals, sleep } = createSleep();
      const onRetry = vi.fn();
      const poll = pollAfterFailures(MAX_CONSECUTIVE_FAILURES + 5);

      const result = await pollUntilSettled({ onRetry, poll, sleep });

      expect(result).toMatchObject({ kind: "unreachable" });
      expect(poll).toHaveBeenCalledTimes(10);
      expect(onRetry).toHaveBeenCalledTimes(9);
      expect(intervals).toHaveLength(9);
    });

    test("keeps going after nine failures in a row", async () => {
      const { sleep } = createSleep();
      const poll = pollAfterFailures(9, status("succeeded"));

      const result = await pollUntilSettled({ poll, sleep });

      expect(result.kind).toBe("finished");
    });

    test("starts again from zero after every answer", async () => {
      const { sleep } = createSleep();
      const poll = vi.fn();
      for (let round = 0; round < 2; round += 1) {
        for (let index = 0; index < 9; index += 1) {
          poll.mockRejectedValueOnce(unreachable());
        }
        poll.mockResolvedValueOnce(status("in-progress"));
      }
      poll.mockResolvedValueOnce(status("succeeded"));

      const result = await pollUntilSettled({ poll, sleep });

      expect(result.kind).toBe("finished");
    });
  });
});

describe("whenStatusChanges", () => {
  test("reports an unsettled status once, until it changes, and never a settled one", () => {
    const report = vi.fn();
    const onStatus = whenStatusChanges(report);

    for (const value of [
      "pending",
      "pending",
      "in-progress",
      "in-progress",
      "succeeded",
      "failed",
    ] as const) {
      onStatus(status(value));
    }

    expect(report.mock.calls.map(([answer]) => answer.status)).toEqual([
      "pending",
      "in-progress",
    ]);
  });
});

describe("describeOutcome", () => {
  const CHECK = "Check it later with upgrade status run-1.";
  const finished = (
    value: AttemptStatus["status"],
    extra?: Partial<AttemptStatus>,
  ): PollResult => ({ kind: "finished", status: status(value, extra) });

  test.each([
    [
      "a failed read",
      { error: new Error("Token refused"), kind: "failed" },
      `Could not read the status of the app upgrade (run run-1): Token refused. ${CHECK}`,
      false,
    ],
    [
      "an unreachable service",
      { error: unreachable(), kind: "unreachable" },
      `Stopped following the app upgrade (run run-1): the service did not answer 10 times in a row. ${CHECK}`,
      false,
    ],
    [
      "a success with its version",
      finished("succeeded", {
        result: { appVersion: "2.0.0", snapshotId: "s" },
      }),
      "App upgrade completed. The app is now at version 2.0.0.",
      true,
    ],
    [
      "a success without a result",
      finished("succeeded", { result: null }),
      "App upgrade completed.",
      true,
    ],
    [
      "a failure with a message and an execution activation",
      finished("failed", {
        activations: { execution: "act-1" },
        error: { key: "K", message: "No" },
      }),
      "App upgrade failed (run run-1, execution activation act-1): No",
      false,
    ],
    [
      "a failure with only a key",
      finished("failed", { error: { key: "LIFECYCLE_ATTEMPT_EXPIRED" } }),
      "App upgrade failed (run run-1): LIFECYCLE_ATTEMPT_EXPIRED",
      false,
    ],
    [
      "a failure without a reason",
      finished("failed"),
      "App upgrade failed (run run-1): No reason was given",
      false,
    ],
  ] as [string, PollResult, string, boolean][])(
    "describes %s",
    (_, result, message, succeeded) => {
      const outcome = describeOutcome(result, "run-1");

      expect({
        ...outcome,
        message: stripVTControlCharacters(outcome.message),
      }).toEqual({ message, succeeded });
    },
  );
});
