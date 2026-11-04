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
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { noticeInterrupt } from "#commands/hooks/post-app-deploy/interrupt";

vi.mock("consola", () => ({ consola: { info: vi.fn() } }));

const STATUS_COMMAND = "pnpm exec aio-commerce-lib-app upgrade status";

describe("noticeInterrupt", () => {
  const exitMock = vi
    .spyOn(process, "exit")
    .mockImplementation(() => undefined as never);

  let notice: ReturnType<typeof noticeInterrupt>;

  beforeEach(() => {
    vi.clearAllMocks();
    notice = noticeInterrupt(STATUS_COMMAND);
  });

  afterEach(() => {
    notice.dispose();
  });

  test.each([
    [
      "no run was started",
      undefined,
      false,
      `Stopped waiting before the upgrade was confirmed as started.\nIf it was started, find the latest run with: ${STATUS_COMMAND}`,
    ],
    [
      "no run was started, even with a watcher",
      undefined,
      true,
      `Stopped waiting before the upgrade was confirmed as started.\nIf it was started, find the latest run with: ${STATUS_COMMAND}`,
    ],
    [
      "a watcher follows the run",
      "run-1",
      true,
      `Stopped waiting for the upgrade (run run-1). It keeps running in the background.\nCheck it with: ${STATUS_COMMAND} run-1`,
    ],
    [
      "no watcher follows the run",
      "run-1",
      false,
      `Stopped waiting for the upgrade (run run-1). Nothing follows it in the background, so its result is recorded only when you check it.\nCheck it with: ${STATUS_COMMAND} run-1`,
    ],
  ])(
    "on SIGINT when %s, prints one notice and exits with code 130",
    (_, runId, hasWatcher, message) => {
      if (runId) {
        notice.setRunId(runId);
      }

      if (hasWatcher) {
        notice.setWatcherStarted();
      }

      process.emit("SIGINT");

      expect(consola.info).toHaveBeenCalledExactlyOnceWith(message);
      expect(exitMock).toHaveBeenCalledExactlyOnceWith(130);
    },
  );

  test.each(["SIGTERM", "SIGHUP"] as const)(
    "does nothing on %s, because the terminal can be gone",
    (signal) => {
      process.emit(signal);

      expect(consola.info).not.toHaveBeenCalled();
      expect(exitMock).not.toHaveBeenCalled();
    },
  );

  test("does nothing on SIGINT after dispose", () => {
    notice.dispose();

    process.emit("SIGINT");

    expect(consola.info).not.toHaveBeenCalled();
    expect(exitMock).not.toHaveBeenCalled();
  });
});
