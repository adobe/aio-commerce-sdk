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

import { getUserToken } from "@aio-commerce-sdk/scripting-utils/aio";
import { waitForOwnerExit } from "@aio-commerce-sdk/scripting-utils/process";

import { createCamsContext } from "#commands/common/cams/context";
import { describeOutcome, pollUntilSettled } from "#commands/lifecycle/poll";

import type { CamsContext } from "#commands/common/cams/context";

/** How long the watcher waits for a token before it gives up. */
const TOKEN_TIMEOUT_MS = 30_000;

/** What the hook tells the watcher it follows. */
export type WatcherArgs = {
  extensionId: string;
  runId: string;
};

/** Everything the watcher uses from outside, so tests can replace it. */
export type WatcherDependencies = {
  log: (message: string) => void;
  createContext: () => CamsContext;
  sleep?: (ms: number) => Promise<void>;
};

/**
 * Reads the user token, and fails if it takes too long.
 *
 * The IMS library starts an interactive login when the stored token is expired and cannot be
 * refreshed. A detached process has no terminal to answer it, so the wait would never end.
 */
async function getTokenWithTimeout() {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(
            "No valid Adobe IMS token is available. Run aio login, then check the run with upgrade status",
          ),
        ),
      TOKEN_TIMEOUT_MS,
    );
  });

  try {
    return await Promise.race([getUserToken(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Reads the arguments the hook passes to the watcher.
 * @returns The arguments, or `undefined` when they are incomplete.
 */
export function parseWatcherArgs(argv: string[]): WatcherArgs | undefined {
  const [extensionId, runId] = argv;
  if (!(extensionId && runId)) {
    return;
  }

  return { extensionId, runId };
}

/**
 * Follows a run after the hook that started it is gone.
 *
 * The watcher stays idle while the hook lives. It makes no request and writes no log line. When
 * the hook is gone, it polls the run like the hook did, until the run settles. It reads a fresh
 * user token on every poll. When the token is refused, the service answers with an error that
 * repeating cannot fix, or the service stays unreachable, it logs the failure and stops. A run can
 * be checked later with the status command.
 *
 * @returns The exit code: 0 when the run succeeded, 1 otherwise.
 */
export async function runWatcher(
  args: WatcherArgs,
  dependencies: WatcherDependencies,
): Promise<number> {
  const { log, createContext, sleep } = dependencies;

  const signal = await waitForOwnerExit();

  log(`The hook is gone (${signal}). Following the run ${args.runId}.`);

  const { client } = createContext();
  const result = await pollUntilSettled({
    onRetry: (error) => log(`${error.message}. Trying again.`),
    onStatus: (status) => log(`Status ${status.status}.`),
    poll: () =>
      client.pollUpgrade({
        extensionId: args.extensionId,
        runId: args.runId,
      }),
    sleep,
  });

  const outcome = describeOutcome(result, args.runId);
  log(outcome.message);
  return outcome.succeeded ? 0 : 1;
}

/**
 * The command that runs the watcher. The hook starts it, and users do not run it.
 *
 * Ends the process when done, because a login that the IMS library left waiting would otherwise
 * keep it alive.
 */
export async function exec(...argv: string[]) {
  const args = parseWatcherArgs(argv);
  // The watcher is detached and its stdout is the log file, so it writes plain timestamped lines
  // without the formatting and colors of consola.
  const log = (message: string) =>
    process.stdout.write(`${new Date().toISOString()} ${message}\n`);

  if (!args) {
    log("The watcher needs the extension id and the run id.");
    process.exit(1);
  }

  try {
    process.exitCode = await runWatcher(args, {
      createContext: () => createCamsContext(getTokenWithTimeout),
      log,
    });
  } catch (error) {
    log(
      `The watcher stopped: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exitCode = 1;
  }

  process.exit();
}
