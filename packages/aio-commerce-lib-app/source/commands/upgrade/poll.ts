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

import { setTimeout as sleep } from "node:timers/promises";

import { stringifyError } from "@adobe/aio-commerce-lib-core/error";
import { colors } from "consola/utils";

import { CamsClientError } from "#commands/common/cams/errors";

import type { AttemptStatus } from "#commands/common/cams/schema";

/** How long to wait between two polls. */
export const POLL_INTERVAL_MS = 2000;

/**
 * How many transient failures in a row end the loop.
 *
 * The service marks an overdue attempt as failed, so a healthy service always ends the loop. This
 * limit is for the other case: without it, a service that stays down means polling forever.
 */
export const MAX_CONSECUTIVE_FAILURES = 10;

/** Options of {@link pollUntilSettled}. */
export type PollOptions = {
  /** Reads the status of the attempt once. */
  poll: () => Promise<AttemptStatus>;

  /** Called with each answer. */
  onStatus?: (status: AttemptStatus) => void;

  /** Called with each failure that the loop keeps polling through. */
  onRetry?: (error: CamsClientError) => void;
  sleep?: (ms: number) => Promise<void>;
};

/** How a poll loop ended. */
export type PollResult =
  | { kind: "finished"; status: AttemptStatus }
  | { kind: "unreachable"; error: CamsClientError }
  | { kind: "failed"; error: unknown };

/** Whether the attempt will not change anymore. */
export function isSettled(status: AttemptStatus) {
  return status.status === "succeeded" || status.status === "failed";
}

/**
 * Polls an attempt every {@link POLL_INTERVAL_MS} until it is settled.
 *
 * The loop keeps going through the failures that can pass, which are network failures and a 502 or
 * 503 from the service, and gives up after {@link MAX_CONSECUTIVE_FAILURES} of them in a row. Any
 * answer resets the count. Any other failure ends the loop at once, because repeating the request
 * cannot fix it, as with a refused token.
 */
export async function pollUntilSettled(
  options: PollOptions,
): Promise<PollResult> {
  const { poll, onStatus, onRetry, sleep: wait = sleep } = options;
  let failures = 0;

  // biome-ignore lint/suspicious/noUnnecessaryConditions: We return directly from the loop.
  while (true) {
    try {
      // biome-ignore lint/performance/noAwaitInLoops: each poll waits for the previous one
      const status = await poll();
      failures = 0;
      onStatus?.(status);

      if (isSettled(status)) {
        return { kind: "finished", status };
      }
    } catch (error) {
      if (!(error instanceof CamsClientError && error.retryable)) {
        return { error, kind: "failed" };
      }

      failures += 1;
      if (failures >= MAX_CONSECUTIVE_FAILURES) {
        return { error, kind: "unreachable" };
      }

      onRetry?.(error);
    }

    await wait(POLL_INTERVAL_MS);
  }
}

/** Wraps a callback so that it runs once per change of an unsettled status, such as `pending` to `in-progress`. */
export function whenStatusChanges(report: (status: AttemptStatus) => void) {
  let previous: AttemptStatus["status"] | undefined;

  return (status: AttemptStatus) => {
    if (!isSettled(status) && status.status !== previous) {
      previous = status.status;
      report(status);
    }
  };
}

/**
 * Describes how polling a run ended.
 *
 * @param result - The result of the poll loop.
 * @param runId - The id of the run, which the user can check later with `upgrade status`.
 */
export function describeOutcome(result: PollResult, runId: string) {
  const check = `Check it later with ${colors.yellow(`upgrade status ${colors.cyan(runId)}`)}.`;

  if (result.kind === "failed") {
    const reason = stringifyError(result.error);
    return {
      message: `Could not read the status of the app upgrade (run ${colors.cyan(runId)}): ${reason}. ${check}`,
      succeeded: false,
    };
  }

  if (result.kind === "unreachable") {
    return {
      message: `Stopped following the app upgrade (run ${colors.cyan(runId)}): the service did not answer ${colors.yellow(MAX_CONSECUTIVE_FAILURES)} times in a row. ${check}`,
      succeeded: false,
    };
  }

  const { status } = result;
  if (status.status === "succeeded") {
    return {
      message: status.result
        ? `App upgrade ${colors.greenBright("completed")}. The app is now at version ${colors.cyan(status.result.appVersion)}.`
        : `App upgrade ${colors.greenBright("completed")}.`,
      succeeded: true,
    };
  }

  const execution = status.activations?.execution;
  const activation = execution
    ? `, execution activation ${colors.cyan(execution)}`
    : "";

  const reason =
    status.error?.message ?? status.error?.key ?? "No reason was given";

  return {
    message: `App upgrade ${colors.redBright("failed")} (run ${colors.cyan(runId)}${activation}): ${reason}`,
    succeeded: false,
  };
}
