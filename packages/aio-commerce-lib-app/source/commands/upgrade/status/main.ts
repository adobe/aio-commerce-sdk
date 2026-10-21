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

import { consola } from "consola";

import {
  createCamsContext,
  findWorkspaceExtension,
} from "#commands/common/cams/context";
import { reportFailure } from "#commands/common/cams/report";
import { describeOutcome, isSettled } from "#commands/upgrade/poll";

import type { CamsContext } from "#commands/common/cams/context";
import type { AttemptStatus } from "#commands/common/cams/schema";

/** The command line of `upgrade status`. */
export type StatusOptions = {
  /** The run to check. Without it, the latest upgrade run is checked. */
  runId?: string;
};

/**
 * Reads the arguments of `upgrade status`.
 * @returns The options, or a message that tells what is wrong with the arguments.
 */
export function parseStatusArgs(
  argv: string[],
): { options: StatusOptions } | { error: string } {
  let runId: string | undefined;
  for (const arg of argv) {
    if (arg.startsWith("-")) {
      return { error: `Unknown option: ${arg}` };
    }
    if (runId === undefined) {
      runId = arg;
    } else {
      return { error: `Unexpected argument: ${arg}` };
    }
  }

  return { options: { runId } };
}

/**
 * Finds the run to check: the given one, or the latest upgrade run of the app.
 * @returns The run id, or `undefined` when the app has no run.
 */
async function resolveRun(
  context: CamsContext,
  extensionId: string,
  runId: string | undefined,
) {
  if (runId) {
    return runId;
  }

  const latest = await context.client.readLatestUpgrade(
    { extensionId },
    { commerceInstance: context.commerceInstance },
  );
  return latest?.id;
}

/** Prints how a run stands now. */
function printStatus(status: AttemptStatus) {
  if (!isSettled(status)) {
    consola.info(`The app upgrade (run ${status.id}) is ${status.status}.`);

    return;
  }

  const outcome = describeOutcome({ kind: "finished", status }, status.id);
  if (outcome.succeeded) {
    consola.success(outcome.message);
  } else {
    consola.error(outcome.message);
  }
}

/**
 * Checks an upgrade run once. Every check also updates the extension in the service, so a run that
 * nobody followed anymore gets its final status.
 *
 * @returns The exit code: 0 when the run succeeded or is still running, and 1 when it failed or
 * could not be read.
 */
export async function run(options: StatusOptions): Promise<number> {
  const initialContext = createCamsContext();
  consola.debug(`Service: ${initialContext.baseUrl}`);

  const { extensionId, commerceInstance } =
    await findWorkspaceExtension(initialContext);
  const context = { ...initialContext, commerceInstance };
  if (!extensionId) {
    consola.error("This workspace is not associated with an app extension.");
    return 1;
  }

  const targetRunId = await resolveRun(context, extensionId, options.runId);
  if (!targetRunId) {
    consola.info("The app has no upgrade run yet.");
    return 0;
  }

  try {
    const status = await context.client.pollUpgrade(
      {
        extensionId,
        runId: targetRunId,
      },
      { commerceInstance },
    );

    printStatus(status);
    return status.status === "failed" ? 1 : 0;
  } catch (error) {
    reportFailure(
      error,
      describeOutcome({ error, kind: "failed" }, targetRunId).message,
    );

    return 1;
  }
}

/** The `upgrade status` command. Sets the exit code of the process. */
export async function exec(...argv: string[]) {
  const parsed = parseStatusArgs(argv);

  if ("error" in parsed) {
    consola.error(parsed.error);
    consola.info("Usage: upgrade status [run-id]");

    process.exitCode = 1;
    return;
  }

  try {
    process.exitCode = await run(parsed.options);
  } catch (error) {
    reportFailure(
      error,
      error instanceof Error ? error.message : String(error),
    );
    process.exitCode = 1;
  }
}
