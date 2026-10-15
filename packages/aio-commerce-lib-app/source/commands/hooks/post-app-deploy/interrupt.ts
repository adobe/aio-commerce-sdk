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

/** The exit code of a process that stopped because of Ctrl+C. */
const SIGINT_EXIT_CODE = 130;

/**
 * What the user needs to know after Ctrl+C: whether anything still follows the upgrade, and the
 * command that checks it.
 *
 * @param statusCommand - The command that runs `upgrade status` in the package manager of the project.
 * @param runId - The run that was started, if one was.
 * @param hasWatcher - Whether a background watcher follows the run.
 */
function describeInterrupt(
  statusCommand: string,
  runId: string | undefined,
  hasWatcher: boolean,
) {
  if (!runId) {
    return [
      "Stopped waiting before the upgrade was confirmed as started.",
      `If it was started, find the latest run with: ${statusCommand}`,
    ];
  }

  return [
    hasWatcher
      ? `Stopped waiting for the upgrade (run ${runId}). It keeps running in the background.`
      : `Stopped waiting for the upgrade (run ${runId}). Nothing follows it in the background, so its result is recorded only when you check it.`,
    `Check it with: ${statusCommand} ${runId}`,
  ];
}

/** Tells the hook which run the user can follow, and removes the handler when the hook ends. */
export type InterruptNotice = {
  setRunId: (runId: string) => void;

  /** Tells that a background watcher follows the run. */
  setWatcherStarted: () => void;
  dispose: () => void;
};

/**
 * Prints what the user needs to follow the upgrade and exits with code 130 when the user presses Ctrl+C while the hook runs.
 *
 * It listens to SIGINT only. After SIGTERM or SIGHUP the terminal can be gone, and a write to it
 * can block the process forever.
 */
export function noticeInterrupt(statusCommand: string): InterruptNotice {
  let runId: string | undefined;
  let hasWatcher = false;

  const onInterrupt = () => {
    consola.info(
      describeInterrupt(statusCommand, runId, hasWatcher).join("\n"),
    );
    process.exit(SIGINT_EXIT_CODE);
  };

  process.on("SIGINT", onInterrupt);

  return {
    dispose: () => {
      process.off("SIGINT", onInterrupt);
    },
    setRunId: (id) => {
      runId = id;
    },
    setWatcherStarted: () => {
      hasWatcher = true;
    },
  };
}
