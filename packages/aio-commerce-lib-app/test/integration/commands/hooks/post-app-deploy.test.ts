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

import { tmpdir } from "node:os";
import { join } from "node:path";

import { consola } from "consola";
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { aio, delayMock, detectPackageManagerMock, spawnDetachedMock } =
  vi.hoisted(() => ({
    aio: {
      getAioCliEnv: vi.fn(),
      getAioProjectContext: vi.fn(),
      getUserToken: vi.fn(),
    },
    delayMock: vi.fn(),
    detectPackageManagerMock: vi.fn(),
    spawnDetachedMock: vi.fn(),
  }));

vi.mock(
  "@aio-commerce-sdk/scripting-utils/process",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@aio-commerce-sdk/scripting-utils/process")
    >()),
    spawnDetached: spawnDetachedMock,
  }),
);

vi.mock(
  "@aio-commerce-sdk/scripting-utils/project",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@aio-commerce-sdk/scripting-utils/project")
    >()),
    detectPackageManager: detectPackageManagerMock,
  }),
);

vi.mock("node:timers/promises", () => ({ setTimeout: delayMock }));
vi.mock("@aio-commerce-sdk/scripting-utils/aio", () => aio);
vi.mock("consola", () => ({
  consola: {
    box: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    log: vi.fn(),
    start: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
  },
}));
vi.mock("consola/utils", () => ({
  colors: { cyan: (value: string) => value },
}));

import { CAMS_URL_ENV_VAR } from "#commands/common/cams/config";
import { CamsConflictError } from "#commands/common/cams/errors";
import { exec, run } from "#commands/hooks/post-app-deploy/main";
import { createMockConfig } from "#test/fixtures/config";
import {
  INVALID_PROJECT,
  MINIMAL_PROJECT,
  makeProjectFiles,
  withTempProject,
} from "#test/fixtures/project";
import { apiServer, setupApiTestLifecycle } from "#test/setup/api";

const MANUAL_PROJECT = makeProjectFiles(
  createMockConfig({ metadata: { upgradeMode: "manual" } }),
);

const FORBIDDEN_STATUS =
  /Forbidden[\s\S]*\nDetails: HTTP 403, GET \/v1\/extensions\/ext-1\/upgrades\/run-1$/;

const STATUS_HINT = /Check (the run|it)|tail -f/;
const LOG_HINT = /tail -f|\.log/;

const SERVICE = "https://service.example.com";
const EXTENSIONS = `${SERVICE}/v1/extensions`;
const WORKSPACE_EXTENSIONS = `${SERVICE}/v1/workspaces/:workspaceId/extensions`;
const UPGRADES = `${EXTENSIONS}/ext-1/upgrades`;
const PLAN = { id: "plan-1", operation: "upgrade" };
const NOT_PLANNED = /The upgrade was not planned: .*Refused/;
const WATCHER_LOG = join(tmpdir(), "aio-commerce-upgrade-run-1.log");

/** The status the service returns for the run. */
function attempt(status: string, extra: object = {}) {
  return { id: "run-1", status, ...extra };
}

/**
 * Answers the calls of an upgrade, then reports the statuses in order. A lookup for another
 * workspace or without the user token and the organization finds nothing, and a start without the
 * plan id is refused, so a wrong call fails.
 */
function serveUpgrade(statuses: object[] = [attempt("succeeded")]) {
  const calls = {
    commerceHeaders: [] as boolean[],
    plan: 0,
    polls: 0,
    start: 0,
  };

  const recordCommerceHeaders = (request: Request) => {
    calls.commerceHeaders.push(
      request.headers.get("x-ac-url") === "https://commerce.example.com" &&
        request.headers.get("x-ac-env") === "saas",
    );
  };

  apiServer.use(
    http.get(WORKSPACE_EXTENSIONS, ({ params, request }) => {
      const found =
        params.workspaceId === "workspace-id" &&
        request.headers.get("authorization") === "Bearer ims-token" &&
        request.headers.get("x-org-id") === "ims-org-id";

      return HttpResponse.json(
        found
          ? [
              {
                id: "ext-1",
                scope: {
                  commerceBaseUrl: "https://commerce.example.com",
                  commerceEnv: "saas",
                },
              },
            ]
          : [],
      );
    }),
    http.post(`${UPGRADES}/preview`, ({ request }) => {
      calls.plan += 1;
      recordCommerceHeaders(request);
      return HttpResponse.json({ plan: PLAN }, { status: 201 });
    }),
    http.post(UPGRADES, async ({ request }) => {
      calls.start += 1;
      recordCommerceHeaders(request);
      const body = await request.text();

      return body === JSON.stringify({ planId: PLAN.id })
        ? HttpResponse.json(attempt("pending"), { status: 202 })
        : HttpResponse.json({}, { status: 400 });
    }),
    http.get(`${UPGRADES}/run-1`, ({ request }) => {
      recordCommerceHeaders(request);
      const status = statuses[Math.min(calls.polls, statuses.length - 1)];
      calls.polls += 1;
      return HttpResponse.json(status);
    }),
  );

  return calls;
}

/** Makes one call of the service answer with the response. */
function answer(method: "get" | "post", url: string, respond: () => Response) {
  apiServer.use(http[method](url, respond));
}

const refusePlan = (code: string) =>
  answer("post", `${UPGRADES}/preview`, () =>
    HttpResponse.json({ code, message: "Refused" }, { status: 409 }),
  );

/** Every message that the hook printed at the default level of consola. */
function printedMessages() {
  return [
    consola.box,
    consola.info,
    consola.log,
    consola.start,
    consola.success,
    consola.warn,
  ].flatMap((mock) =>
    vi.mocked(mock).mock.calls.map(([message]) => String(message)),
  );
}

/** Runs the hook inside a temporary project and returns what it resolved with. */
async function runHook(files = MINIMAL_PROJECT) {
  let result: Awaited<ReturnType<typeof run>> | undefined;
  await withTempProject(files, async () => {
    result = await run();
  });

  return result;
}

setupApiTestLifecycle();

describe("post-app-deploy hook", () => {
  const processExitMock = vi
    .spyOn(process, "exit")
    .mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv(CAMS_URL_ENV_VAR, SERVICE);

    aio.getAioProjectContext.mockReturnValue({
      namespace: "runtime-namespace",
      project: {
        id: "project-id",
        name: "project-name",
        org: { id: "org-id", ims_org_id: "ims-org-id", name: "org-name" },
        title: "Project Title",
        workspace: {
          id: "workspace-id",
          name: "workspace-name",
          title: "Workspace Title",
        },
      },
    });
    aio.getAioCliEnv.mockReturnValue("prod");
    aio.getUserToken.mockResolvedValue("ims-token");
    spawnDetachedMock.mockReturnValue({ child: {} });
    delayMock.mockResolvedValue(undefined);
    detectPackageManagerMock.mockResolvedValue("npm");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("follows an automatic upgrade until it succeeds and shows each status change once", async () => {
    const calls = serveUpgrade([
      attempt("pending"),
      attempt("in-progress"),
      attempt("in-progress"),
      attempt("succeeded", {
        result: { appVersion: "2.0.0", snapshotId: "s" },
      }),
    ]);

    await expect(runHook()).resolves.toEqual({
      kind: "upgraded",
      runId: "run-1",
    });

    expect(calls).toMatchObject({ plan: 1, polls: 4, start: 1 });
    expect(delayMock).toHaveBeenCalledTimes(3);
    expect(delayMock).toHaveBeenCalledWith(2000);
    expect(vi.mocked(consola.start).mock.calls).toEqual([
      ["Checking for app upgrades..."],
      ["App upgrade is pending."],
      ["App upgrade is in-progress."],
    ]);
    expect(consola.success).toHaveBeenLastCalledWith(
      expect.stringContaining("version 2.0.0"),
    );
  });

  test("fails with the outcome when the upgrade fails", async () => {
    serveUpgrade([attempt("failed", { error: { key: "FAILED" } })]);

    await expect(runHook()).rejects.toThrow(
      "App upgrade failed (run run-1): FAILED",
    );
  });

  test("gives up after ten failures in a row", async () => {
    const calls = serveUpgrade();
    answer("get", `${UPGRADES}/run-1`, () => {
      calls.polls += 1;
      return HttpResponse.json({}, { status: 502 });
    });

    await expect(runHook()).rejects.toThrow(
      "the service did not answer 10 times in a row",
    );
    expect(calls.polls).toBe(10);
  });

  test("keeps polling through a 502 and a network failure, and stops on a refusal", async () => {
    const answers = [
      () => HttpResponse.json({}, { status: 502 }),
      () => HttpResponse.error(),
      () => HttpResponse.json({}, { status: 401 }),
    ];
    const calls = serveUpgrade();
    answer("get", `${UPGRADES}/run-1`, () => {
      calls.polls += 1;
      return (answers.shift() as () => Response)();
    });

    await expect(runHook()).rejects.toThrow(
      "Could not read the status of the app upgrade (run run-1)",
    );
    expect(calls.polls).toBe(3);
    expect(consola.warn).toHaveBeenCalledTimes(2);
  });

  describe("without an upgrade to follow", () => {
    test("configures follow-up requests with the Commerce instance from lookup", async () => {
      const calls = serveUpgrade();

      await expect(runHook()).resolves.toMatchObject({ kind: "upgraded" });

      expect(calls.commerceHeaders).toEqual([true, true, true]);
    });

    test("plans a manual upgrade without starting it", async () => {
      const calls = serveUpgrade();

      await expect(runHook(MANUAL_PROJECT)).resolves.toEqual({
        kind: "planned",
        plan: PLAN,
      });

      expect(calls).toMatchObject({ plan: 1, polls: 0, start: 0 });
      expect(spawnDetachedMock).not.toHaveBeenCalled();
    });

    test("skips a workspace without an extension and does not plan", async () => {
      const calls = serveUpgrade();
      answer("get", WORKSPACE_EXTENSIONS, () => HttpResponse.json([]));

      await expect(runHook()).resolves.toEqual({
        code: "not-associated",
        kind: "skipped",
      });

      expect(calls.plan).toBe(0);
      expect(spawnDetachedMock).not.toHaveBeenCalled();
    });

    test.each(["already-current", "not-associated", "not-installed"] as const)(
      "skips when the plan is refused with %s",
      async (code) => {
        serveUpgrade();
        refusePlan(code);

        await expect(runHook()).resolves.toEqual({ code, kind: "skipped" });
        expect(spawnDetachedMock).not.toHaveBeenCalled();
      },
    );

    test.each(["in-progress", "manual-review-required"])(
      "fails when the plan is refused with %s",
      async (code) => {
        serveUpgrade();
        refusePlan(code);

        await expect(runHook()).rejects.toThrow(NOT_PLANNED);
        expect(spawnDetachedMock).not.toHaveBeenCalled();
      },
    );

    test("fails when the upgrade cannot start", async () => {
      serveUpgrade();
      answer("post", UPGRADES, () =>
        HttpResponse.json({ code: "stale-plan" }, { status: 409 }),
      );

      await expect(runHook()).rejects.toThrow("The upgrade was not started");
      expect(spawnDetachedMock).not.toHaveBeenCalled();
    });

    test("fails on a service error while planning", async () => {
      serveUpgrade();
      answer("post", `${UPGRADES}/preview`, () =>
        HttpResponse.json({ message: "Boom" }, { status: 500 }),
      );

      await expect(runHook()).rejects.toThrow("Boom");
    });
  });

  describe("watcher", () => {
    test("starts before the first poll, for the extension and the run", async () => {
      const spawnedBeforeFirstPoll: boolean[] = [];
      serveUpgrade();
      answer("get", `${UPGRADES}/run-1`, () => {
        spawnedBeforeFirstPoll.push(spawnDetachedMock.mock.calls.length === 1);
        return HttpResponse.json(attempt("succeeded"));
      });

      await runHook();

      expect(spawnedBeforeFirstPoll).toEqual([true]);
      expect(spawnDetachedMock).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          args: ["upgrade", "watch", "ext-1", "run-1"],
          logPath: WATCHER_LOG,
          script: process.argv[1],
        }),
      );
    });

    test("prints no hint to check the run and no empty line after the start line", async () => {
      serveUpgrade([attempt("in-progress"), attempt("succeeded")]);

      await runHook();

      expect(printedMessages()).not.toContainEqual(
        expect.stringMatching(STATUS_HINT),
      );
      expect(consola.log).toHaveBeenCalledExactlyOnceWith("");
    });

    test("logs the log path and the arguments of the watcher when it starts", async () => {
      serveUpgrade();

      await runHook();

      expect(consola.debug).toHaveBeenCalledWith("Starting the watcher.", {
        args: ["upgrade", "watch", "ext-1", "run-1"],
        logPath: WATCHER_LOG,
      });
      expect(consola.debug).toHaveBeenCalledWith(`Watcher log: ${WATCHER_LOG}`);
    });

    test("does not print the log path at the default level", async () => {
      serveUpgrade([attempt("in-progress"), attempt("succeeded")]);

      await runHook();

      expect(printedMessages()).not.toContainEqual(
        expect.stringContaining(WATCHER_LOG),
      );
    });

    test("does not fail the hook when it cannot start", async () => {
      serveUpgrade();
      spawnDetachedMock.mockImplementation(({ onError }) => {
        onError(new Error("spawn failed"));
      });

      await expect(runHook()).resolves.toMatchObject({ kind: "upgraded" });

      expect(consola.debug).toHaveBeenCalledWith(
        "The watcher could not start.",
        {
          args: ["upgrade", "watch", "ext-1", "run-1"],
          error: new Error("spawn failed"),
          logPath: WATCHER_LOG,
        },
      );
      expect(consola.debug).not.toHaveBeenCalledWith(
        expect.stringContaining("Watcher log:"),
      );
    });
  });

  describe("Ctrl+C", () => {
    const WITH_WATCHER = (command: string) =>
      `Stopped waiting for the upgrade (run run-1). It keeps running in the background.\nCheck it with: ${command} run-1`;
    const WITHOUT_WATCHER = (command: string) =>
      `Stopped waiting for the upgrade (run run-1). Nothing follows it in the background, so its result is recorded only when you check it.\nCheck it with: ${command} run-1`;
    const NPX = "npx aio-commerce-lib-app upgrade status";
    const PNPM = "pnpm exec aio-commerce-lib-app upgrade status";

    /** Presses Ctrl+C during the first wait between two polls. */
    function interruptWhileWaiting() {
      serveUpgrade([attempt("in-progress"), attempt("succeeded")]);
      delayMock.mockImplementationOnce(async () => {
        process.emit("SIGINT");
      });
    }

    test("tells that the upgrade keeps running in the background and how to check it", async () => {
      interruptWhileWaiting();

      await runHook();

      expect(processExitMock).toHaveBeenCalledWith(130);
      expect(consola.info).toHaveBeenCalledWith(WITH_WATCHER(NPX));
    });

    test("tells that nothing follows the upgrade when the watcher could not start", async () => {
      interruptWhileWaiting();
      spawnDetachedMock.mockReturnValue(undefined);

      await runHook();

      expect(consola.info).toHaveBeenCalledWith(WITHOUT_WATCHER(NPX));
    });

    test("does not name the log of the watcher", async () => {
      interruptWhileWaiting();

      await runHook();

      expect(printedMessages()).not.toContainEqual(
        expect.stringMatching(LOG_HINT),
      );
    });

    test("uses the command of the package manager of the project", async () => {
      detectPackageManagerMock.mockResolvedValue("pnpm");
      interruptWhileWaiting();

      await runHook();

      expect(consola.info).toHaveBeenCalledWith(WITH_WATCHER(PNPM));
      expect(detectPackageManagerMock).toHaveBeenCalledOnce();
    });

    test("detects the package manager in the directory of the project", async () => {
      serveUpgrade();

      let projectDir = "";
      await withTempProject(MINIMAL_PROJECT, async () => {
        projectDir = process.cwd();
        await run();
      });

      expect(detectPackageManagerMock).toHaveBeenCalledExactlyOnceWith(
        projectDir,
      );
    });

    test("uses npx and still runs the hook when the package manager cannot be detected", async () => {
      detectPackageManagerMock.mockRejectedValue(new Error("No access"));
      interruptWhileWaiting();

      await runHook();

      expect(consola.info).toHaveBeenCalledWith(WITH_WATCHER(NPX));
    });

    test.each([
      ["succeeds", attempt("succeeded")],
      ["fails", attempt("failed")],
    ])("removes its handler when the upgrade %s", async (_, status) => {
      const before = process.listenerCount("SIGINT");
      serveUpgrade([status]);

      await Promise.allSettled([runHook()]);

      expect(process.listenerCount("SIGINT")).toBe(before);
    });
  });

  describe("exec", () => {
    test("prints a refusal of the service as one block without a stack", async () => {
      serveUpgrade();
      refusePlan("in-progress");

      await withTempProject(MINIMAL_PROJECT, exec);

      expect(consola.error).toHaveBeenCalledExactlyOnceWith(
        "The upgrade was not planned: Refused\nDetails: HTTP 409, code in-progress, POST /v1/extensions/ext-1/upgrades/preview",
      );
      expect(processExitMock).toHaveBeenCalledExactlyOnceWith(1);
    });

    test("sends the whole chain of a failure of the service to the debug log", async () => {
      serveUpgrade();
      refusePlan("in-progress");

      await withTempProject(MINIMAL_PROJECT, exec);

      const [logged, ...others] = vi
        .mocked(consola.debug)
        .mock.calls.map(([message]) => message)
        .filter((message) => message instanceof Error);

      expect(others).toEqual([]);
      expect(logged.message).toContain("The upgrade was not planned");
      expect(logged.cause).toBeInstanceOf(CamsConflictError);
    });

    test("prints the details of the call that could not read the run", async () => {
      serveUpgrade();
      answer("get", `${UPGRADES}/run-1`, () =>
        HttpResponse.json({ message: "Forbidden" }, { status: 403 }),
      );

      await withTempProject(MINIMAL_PROJECT, exec);

      expect(consola.error).toHaveBeenCalledExactlyOnceWith(
        expect.stringMatching(FORBIDDEN_STATUS),
      );
    });

    test("prints an unexpected failure with its stack", async () => {
      const failure = new Error("Broken");
      aio.getAioProjectContext.mockImplementation(() => {
        throw failure;
      });

      await withTempProject(MINIMAL_PROJECT, exec);

      expect(consola.error).toHaveBeenCalledExactlyOnceWith(failure);
      expect(consola.debug).not.toHaveBeenCalled();
      expect(processExitMock).toHaveBeenCalledExactlyOnceWith(1);
    });

    test("exits with code 1 when the hook fails", async () => {
      serveUpgrade([attempt("failed")]);

      await withTempProject(MINIMAL_PROJECT, exec);

      expect(processExitMock).toHaveBeenCalledExactlyOnceWith(1);
    });

    test("prints a readable message and exits with code 1 for an invalid config", async () => {
      await withTempProject(INVALID_PROJECT, exec);

      expect(consola.error).toHaveBeenCalledExactlyOnceWith(expect.any(String));
      expect(processExitMock).toHaveBeenCalledExactlyOnceWith(1);
    });

    test.each([
      ["succeeds", MINIMAL_PROJECT, () => serveUpgrade()],
      ["is skipped", MINIMAL_PROJECT, () => refusePlan("already-current")],
      ["is planned only", MANUAL_PROJECT, () => serveUpgrade()],
    ])("does not exit when the upgrade %s", async (_, files, serve) => {
      serveUpgrade();
      serve();

      await withTempProject(files, exec);

      expect(processExitMock).not.toHaveBeenCalled();
    });
  });
});
