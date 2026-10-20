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

import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { aio, owner } = vi.hoisted(() => ({
  aio: {
    getAioCliEnv: vi.fn(),
    getAioProjectContext: vi.fn(),
    getUserToken: vi.fn(),
  },
  owner: { waitForOwnerExit: vi.fn() },
}));

vi.mock("@aio-commerce-sdk/scripting-utils/aio", () => aio);
vi.mock("@aio-commerce-sdk/scripting-utils/process", () => owner);

import { createCamsClient } from "#commands/common/cams/api-client";
import { CAMS_URL_ENV_VAR } from "#commands/common/cams/config";
import { exec, runWatcher } from "#commands/upgrade/watcher/main";
import { apiServer, setupApiTestLifecycle } from "#test/setup/api";

import type { CamsContext } from "#commands/common/cams/context";

const SERVICE = "https://service.example.com";
const TOKEN_TIMEOUT_MS = 30_000;
const STATUS_URL = `${SERVICE}/v1/extensions/ext-1/upgrades/run-1/sync`;

const BAD_GATEWAY_RETRY = /HTTP 502.*Trying again\.$/;
const ARGS = { extensionId: "ext-1", runId: "run-1" };
const RUNNING = { id: "run-1", status: "in-progress" };
const SUCCEEDED = {
  id: "run-1",
  result: { appVersion: "2.0.0", snapshotId: "s" },
  status: "succeeded",
};

setupApiTestLifecycle();

/** Answers the polls with the responses in order, and the last one after that. */
function serveAnswers(answers: (() => Response)[]) {
  const polls = { count: 0 };
  apiServer.use(
    http.post(STATUS_URL, () => {
      const answer = answers[Math.min(polls.count, answers.length - 1)];
      polls.count += 1;
      return answer();
    }),
  );

  return polls;
}

const json =
  (body: object, status = 200) =>
  () =>
    HttpResponse.json(body, { status });

describe("runWatcher", () => {
  const log = vi.fn();
  const sleep = vi.fn(async () => undefined);
  const createContext = vi.fn(
    (): CamsContext => ({
      baseUrl: SERVICE,
      client: createCamsClient({
        auth: {
          getToken: async () => "token",
          org: { id: "o", ims_org_id: "i", name: "n" },
        },
        config: { baseUrl: SERVICE },
      }),
      project: {} as CamsContext["project"],
    }),
  );

  /** Runs the watcher. The owner exit settles with `signal` at once, or never when it is `undefined`. */
  function watch(signal?: "pipe" | "pid") {
    owner.waitForOwnerExit.mockReturnValue(
      signal ? Promise.resolve(signal) : new Promise(() => undefined),
    );

    return runWatcher(ARGS, { createContext, log, sleep });
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("stays idle while the hook is alive, and then follows the run", async () => {
    const polls = serveAnswers([json(SUCCEEDED)]);
    let release: (signal: "pipe") => void = () => undefined;
    owner.waitForOwnerExit.mockReturnValue(
      new Promise((resolve) => {
        release = resolve;
      }),
    );
    const outcome: { code?: number } = {};
    const watching = runWatcher(ARGS, { createContext, log, sleep });
    watching.then((code) => {
      outcome.code = code;
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(owner.waitForOwnerExit).toHaveBeenCalledOnce();
    expect(outcome.code).toBeUndefined();
    expect(polls.count).toBe(0);
    expect(createContext).not.toHaveBeenCalled();
    expect(log).not.toHaveBeenCalled();

    release("pipe");
    await expect(watching).resolves.toBe(0);
  });

  test("logs every step of a run it follows after the hook is gone, through a 502", async () => {
    const polls = serveAnswers([json({}, 502), json(RUNNING), json(SUCCEEDED)]);

    await expect(watch("pipe")).resolves.toBe(0);

    expect(polls.count).toBe(3);
    expect(
      log.mock.calls.map(([line]) => stripVTControlCharacters(line)),
    ).toEqual([
      "The hook is gone (pipe). Following the run run-1.",
      expect.stringMatching(BAD_GATEWAY_RETRY),
      "Status in-progress.",
      "Status succeeded.",
      "App upgrade completed. The app is now at version 2.0.0.",
    ]);
    expect(sleep.mock.calls).toEqual([[2000], [2000]]);
  });

  test("logs the signal that showed that the hook is gone", async () => {
    serveAnswers([json(SUCCEEDED)]);

    await expect(watch("pid")).resolves.toBe(0);

    expect(log).toHaveBeenCalledWith(expect.stringContaining("is gone (pid)"));
  });

  test("logs the details of the call that failed when the run cannot be read", async () => {
    serveAnswers([json({ message: "Forbidden" }, 403)]);

    await expect(watch("pipe")).resolves.toBe(1);
    expect(log).toHaveBeenLastCalledWith(
      "Details: HTTP 403, POST /v1/extensions/ext-1/upgrades/run-1/sync",
    );
  });

  test("exits with 1 and logs the reason when the run failed", async () => {
    serveAnswers([
      json({
        error: { key: "FAILED", message: "The webhooks step failed" },
        id: "run-1",
        status: "failed",
      }),
    ]);

    await expect(watch("pipe")).resolves.toBe(1);
    expect(log).toHaveBeenLastCalledWith(
      expect.stringContaining("The webhooks step failed"),
    );
  });
});

describe("exec", () => {
  const written: string[] = [];

  beforeEach(() => {
    written.length = 0;
    owner.waitForOwnerExit.mockReset().mockResolvedValue("pipe");
    vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
      written.push(String(chunk));
      return true;
    });
    vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
      if (code) {
        throw new Error(`exit ${code}`);
      }
    }) as never);

    aio.getAioCliEnv.mockReturnValue("prod");
    aio.getAioProjectContext.mockReturnValue({
      namespace: "runtime-namespace",
      project: {
        id: "project-id",
        name: "project-name",
        org: { id: "org-id", ims_org_id: "ims-org-id", name: "org-name" },
        title: "Project Title",
        workspace: { id: "workspace-id", name: "w", title: "W" },
      },
    });
    vi.stubEnv(CAMS_URL_ENV_VAR, SERVICE);
  });

  afterEach(() => {
    process.exitCode = undefined;
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  /** Starts the watcher of a hook that is gone. */
  async function watchAfterHookExit() {
    const watching = exec("ext-1", "run-1");
    await vi.advanceTimersByTimeAsync(TOKEN_TIMEOUT_MS + 1000);
    await watching;
  }

  test("logs and exits with 1 when the arguments are incomplete", async () => {
    await expect(exec("ext-1")).rejects.toThrow("exit 1");

    expect(written.join("")).toContain(
      "The watcher needs the extension id and the run id.",
    );
  });

  test("logs why it stopped and exits with 1 when the hook cannot be watched", async () => {
    owner.waitForOwnerExit.mockRejectedValue(
      new RangeError(
        "__AIO_COMMERCE_SDK_DETACHED_OWNER_PID must be a positive integer",
      ),
    );

    await exec("ext-1", "run-1");

    expect(written.join("")).toContain(
      "The watcher stopped: __AIO_COMMERCE_SDK_DETACHED_OWNER_PID must be a positive integer",
    );
    expect(process.exitCode).toBe(1);
  });

  test("logs why it stopped, exits with 1 and ends the process when the project is missing", async () => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"],
    });
    aio.getAioProjectContext.mockImplementation(() => {
      throw new Error("The current App Builder project is required");
    });

    await watchAfterHookExit();

    expect(written.join("")).toContain(
      "The watcher stopped: The current App Builder project is required",
    );
    expect(process.exitCode).toBe(1);
    expect(process.exit).toHaveBeenCalledOnce();
  });

  describe("the wait for the user token", () => {
    beforeEach(() => {
      vi.useFakeTimers({
        toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"],
      });
    });

    test("fails with a message that tells how to recover when no token arrives", async () => {
      aio.getUserToken.mockReturnValue(new Promise(() => undefined));

      await watchAfterHookExit();

      expect(written.join("")).toContain("Run aio login");
      expect(process.exitCode).toBe(1);
    });

    test("uses a token that arrives just before the timeout", async () => {
      aio.getUserToken.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve("late token"), TOKEN_TIMEOUT_MS - 1);
          }),
      );
      serveAnswers([json(SUCCEEDED)]);

      await watchAfterHookExit();

      expect(stripVTControlCharacters(written.join(""))).toContain(
        "App upgrade completed",
      );
      expect(process.exitCode).toBe(0);
    });
  });
});
