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
 * The lines that tell the user how to follow a run: the status command, and the watcher log when
 * a watcher follows the run. Without a run id, the lines tell how to find the latest run.
 *
 * @param statusCommand - The command that runs `upgrade status` in the package manager of the project.
 */
export function getFollowUpLines(
  statusCommand: string,
  runId?: string,
  watcherLog?: string,
) {
  if (!runId) {
    return [`If it was started, find the latest run with: ${statusCommand}`];
  }

  return [
    `Check the run with: ${statusCommand} ${runId}`,
    ...(watcherLog
      ? [`Follow the watcher log with: tail -f ${watcherLog}`]
      : []),
  ];
}

/** Tells the hook which run the user can follow, and removes the handler when the hook ends. */
export type InterruptNotice = {
  setRunId: (runId: string) => void;

  /** Sets the log of the watcher that follows the run, so the notice can name it. */
  setWatcherLog: (logPath: string) => void;
  dispose: () => void;
};

/**
 * Prints the follow-up lines and exits with code 130 when the user presses Ctrl+C while the hook runs.
 *
 * It listens to SIGINT only. After SIGTERM or SIGHUP the terminal can be gone, and a write to it
 * can block the process forever.
 */
export function noticeInterrupt(statusCommand: string): InterruptNotice {
  let runId: string | undefined;
  let watcherLog: string | undefined;

  const onInterrupt = () => {
    consola.info(
      [
        "Stopped waiting. The upgrade keeps running.",
        ...getFollowUpLines(statusCommand, runId, watcherLog),
      ].join("\n"),
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
    setWatcherLog: (logPath) => {
      watcherLog = logPath;
    },
  };
}
