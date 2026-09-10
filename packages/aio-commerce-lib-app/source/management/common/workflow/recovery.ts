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

import { unwrapHttpError } from "@adobe/aio-commerce-lib-api/utils";

/** Failure key set when an upgrade replacement fails and recovery cannot fully restore the baseline. */
export const UPGRADE_RECOVERY_FAILED = "UPGRADE_RECOVERY_FAILED";

/** Payload recorded on a {@link UPGRADE_RECOVERY_FAILED} failure. */
export type UpgradeRecoveryFailedPayload = {
  recovery: "failed";

  /** The target rejection that triggered recovery, message-unwrapped. */
  originalError: string;

  /** The error(s) raised while trying to restore the baseline, message-unwrapped. */
  recoveryError: string;

  /** Always `true`: the target may no longer match the stored baseline. */
  targetMayDivergeFromBaseline: true;
};

/** An `Error` that carries a machine-readable `key` and optional structured `payload` alongside its message. */
export class WorkflowStepError<TPayload = unknown> extends Error {
  public readonly key: string;
  public readonly payload?: TPayload;

  public constructor(
    message: string,
    options: { key: string; payload?: TPayload; cause?: unknown },
  ) {
    super(message, { cause: options.cause });
    this.name = "WorkflowStepError";
    this.key = options.key;
    this.payload = options.payload;
  }
}

/** A compensating action that reverses one already-applied change back toward the baseline. */
export type Compensation = () => Promise<void>;

type RecoveryLogger = {
  error: (message: string) => void;
};

/**
 * Tracks compensating actions for changes already applied to a target system, and replays them in
 * reverse (last-applied first), best-effort, to roll the target back to baseline when a later
 * change fails:
 *
 * - if every compensation succeeds, the original error is rethrown as-is;
 * - if any compensation fails, throws a {@link WorkflowStepError} keyed {@link UPGRADE_RECOVERY_FAILED},
 *   carrying both the original and recovery errors and a flag that the target may no longer match
 *   the baseline.
 */
export class RecoveryScope {
  private readonly compensations: Compensation[] = [];
  private readonly logger: RecoveryLogger;

  public constructor(logger: RecoveryLogger) {
    this.logger = logger;
  }

  /** Registers a compensation to run if the apply later fails. Recorded in apply order, run reversed. */
  public onFailure(compensation: Compensation): void {
    this.compensations.push(compensation);
  }

  /** Rolls the target back to baseline, then throws. Never returns normally. */
  public async recover(originalError: unknown): Promise<never> {
    const recoveryErrors: unknown[] = [];

    for (const compensation of [...this.compensations].reverse()) {
      try {
        // biome-ignore lint/performance/noAwaitInLoops: compensations must run sequentially in reverse order to converge on the baseline
        await compensation();
      } catch (error) {
        recoveryErrors.push(error);
        this.logger.error(
          `Recovery step failed: ${await unwrapHttpError(error)}`,
        );
      }
    }

    if (recoveryErrors.length === 0) {
      throw originalError;
    }

    // A nested scope already reported an unrecoverable failure (its own compensations failed and it
    // threw a keyed WorkflowStepError). Its payload already flags the baseline divergence, so pass
    // it through unchanged rather than flatten it into this scope's message — this scope's own
    // recovery errors are surfaced through the logger above.
    if (originalError instanceof WorkflowStepError) {
      throw originalError;
    }

    const originalMessage = await unwrapHttpError(originalError);
    const recoveryMessage = (
      await Promise.all(recoveryErrors.map((error) => unwrapHttpError(error)))
    ).join("; ");

    throw new WorkflowStepError<UpgradeRecoveryFailedPayload>(
      `Upgrade replacement failed and recovery could not restore the baseline: ${originalMessage}`,
      {
        cause: originalError,
        key: UPGRADE_RECOVERY_FAILED,
        payload: {
          originalError: originalMessage,
          recovery: "failed",
          recoveryError: recoveryMessage,
          targetMayDivergeFromBaseline: true,
        },
      },
    );
  }
}
