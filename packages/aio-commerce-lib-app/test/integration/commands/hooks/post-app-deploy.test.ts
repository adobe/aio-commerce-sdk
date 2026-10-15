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

const { aio, delayMock, spawnDetachedMock } = vi.hoisted(() => ({
  aio: {
    getAioCliEnv: vi.fn(),
    getAioProjectContext: vi.fn(),
    getUserToken: vi.fn(),
  },
  delayMock: vi.fn(),
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

const SERVICE = "https://service.example.com";
const EXTENSIONS = `${SERVICE}/v1/extensions`;
const UPGRADES = `${EXTENSIONS}/ext-1/upgrades`;
const PLAN = { id: "plan-1", operation: "upgrade" };
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
  const calls = { plan: 0, polls: 0, start: 0 };

  apiServer.use(
    http.get(EXTENSIONS, ({ request }) => {
      const query = new URL(request.url).searchParams;
      const found =
        query.get("workspaceId") === "workspace-id" &&
        query.get("workspaceName") === "workspace-name" &&
        request.headers.get("authorization") === "Bearer ims-token" &&
        request.headers.get("x-org-id") === "ims-org-id";

      return HttpResponse.json(found ? [{ id: "ext-1" }] : []);
    }),
    http.post(`${UPGRADES}/plan`, () => {
      calls.plan += 1;
      return HttpResponse.json({ plan: PLAN }, { status: 201 });
    }),
    http.post(UPGRADES, async ({ request }) => {
      calls.start += 1;
      const body = (await request.json()) as { planId?: string };

      return body.planId === "plan-1"
        ? HttpResponse.json(attempt("pending"), { status: 202 })
        : HttpResponse.json({}, { status: 400 });
    }),
    http.post(`${UPGRADES}/run-1/status`, () => {
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
  answer("post", `${UPGRADES}/plan`, () =>
    HttpResponse.json({ code }, { status: 409 }),
  );

/** What the hook tells the user for each code that it knows. */
const CODE_MESSAGES = {
  "already-current": "The app is already on the target version.",
  "baseline-missing":
    "The lifecycle state names a baseline snapshot that no longer exists. Nothing was planned.",
  "in-progress":
    "Another lifecycle operation is already in progress. Wait for it to finish, then try again.",
  "installed-without-config":
    "The existing installation does not include its original config and cannot be upgraded safely. Uninstall and reinstall the app.",
  "not-associated": "The app is not associated with a Commerce instance.",
  "not-installed": "The app is not installed, so there is nothing to upgrade.",
  "stale-plan":
    "The plan is no longer the pending plan. Deploy the app again to plan the upgrade again.",
  "unreadable-state":
    "The stored lifecycle state cannot be read. Nothing was planned.",
} as const;

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

    expect(calls).toEqual({ plan: 1, polls: 4, start: 1 });
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
    answer("post", `${UPGRADES}/run-1/status`, () => {
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
    answer("post", `${UPGRADES}/run-1/status`, () => {
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
    test("plans a manual upgrade without starting it", async () => {
      const calls = serveUpgrade();

      await expect(runHook(MANUAL_PROJECT)).resolves.toEqual({
        kind: "planned",
        plan: PLAN,
      });

      expect(calls).toEqual({ plan: 1, polls: 0, start: 0 });
      expect(spawnDetachedMock).not.toHaveBeenCalled();
    });

    test("skips a workspace without an extension and does not plan", async () => {
      const calls = serveUpgrade();
      answer("get", EXTENSIONS, () => HttpResponse.json([]));

      await expect(runHook()).resolves.toEqual({
        code: "not-associated",
        kind: "skipped",
      });

      expect(calls.plan).toBe(0);
      expect(spawnDetachedMock).not.toHaveBeenCalled();
      expect(consola.info).toHaveBeenCalledWith(
        `No upgrade was run: ${CODE_MESSAGES["not-associated"]}\n`,
      );
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

    test.each(["already-current", "not-associated", "not-installed"] as const)(
      "tells in plain words why %s was skipped",
      async (code) => {
        serveUpgrade();
        refusePlan(code);

        await runHook();

        expect(consola.info).toHaveBeenCalledWith(
          `No upgrade was run: ${CODE_MESSAGES[code]}\n`,
        );
      },
    );

    test.each([
      "in-progress",
      "stale-plan",
      "unreadable-state",
      "baseline-missing",
      "installed-without-config",
    ] as const)("fails with the plain words for the code %s", async (code) => {
      serveUpgrade();
      refusePlan(code);

      await expect(runHook()).rejects.toThrow(
        `The upgrade was not planned: ${CODE_MESSAGES[code]}`,
      );
      expect(spawnDetachedMock).not.toHaveBeenCalled();
    });

    test("fails with a generic message that names a code it does not know", async () => {
      serveUpgrade();
      refusePlan("manual-review-required");

      await expect(runHook()).rejects.toThrow(
        'The upgrade was not planned: The service refused the request with the code "manual-review-required".',
      );
      expect(spawnDetachedMock).not.toHaveBeenCalled();
    });

    test("fails with the message of the service when the refusal has no code", async () => {
      serveUpgrade();
      answer("post", `${UPGRADES}/plan`, () =>
        HttpResponse.json({ message: "Refused" }, { status: 409 }),
      );

      await expect(runHook()).rejects.toThrow("The upgrade was not planned");
      await expect(runHook()).rejects.toThrow("Refused");
    });

    test("does not decide from a reason text, only from the code", async () => {
      serveUpgrade();
      answer("post", `${UPGRADES}/plan`, () =>
        HttpResponse.json(
          { reason: "The app is already on the target version." },
          { status: 409 },
        ),
      );

      await expect(runHook()).rejects.toThrow("The upgrade was not planned");
      expect(spawnDetachedMock).not.toHaveBeenCalled();
    });

    test("fails when the upgrade cannot start", async () => {
      serveUpgrade();
      answer("post", UPGRADES, () =>
        HttpResponse.json({ code: "stale-plan" }, { status: 409 }),
      );

      await expect(runHook()).rejects.toThrow(
        `The upgrade was not started: ${CODE_MESSAGES["stale-plan"]}`,
      );
      expect(spawnDetachedMock).not.toHaveBeenCalled();
    });

    test("fails on a service error while planning", async () => {
      serveUpgrade();
      answer("post", `${UPGRADES}/plan`, () =>
        HttpResponse.json({ message: "Boom" }, { status: 500 }),
      );

      await expect(runHook()).rejects.toThrow("HTTP 500");
    });
  });

  describe("watcher", () => {
    test("starts before the first poll, for the extension and the run, and tells how to check it", async () => {
      const spawnedBeforeFirstPoll: boolean[] = [];
      serveUpgrade();
      answer("post", `${UPGRADES}/run-1/status`, () => {
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
      expect(consola.info).toHaveBeenCalledWith(
        "Check the run with: npx aio-commerce-lib-app upgrade status run-1",
      );
      expect(consola.info).toHaveBeenCalledWith(
        `Follow the watcher log with: tail -f ${WATCHER_LOG}`,
      );
    });

    test("prints one empty line after the follow-up lines and before the status of the run", async () => {
      serveUpgrade([attempt("in-progress"), attempt("succeeded")]);

      await runHook();

      const orderOf = (mock: typeof consola.info, index: number) =>
        vi.mocked(mock).mock.invocationCallOrder[index];
      const lastFollowUp = vi
        .mocked(consola.info)
        .mock.calls.findLastIndex(([message]) =>
          String(message).startsWith("Follow the watcher log with"),
        );
      const firstStatus = vi
        .mocked(consola.start)
        .mock.calls.findIndex(([message]) =>
          String(message).startsWith("App upgrade is"),
        );
      const started = vi
        .mocked(consola.info)
        .mock.calls.findIndex(([message]) =>
          String(message).startsWith("App upgrade started"),
        );
      const blanksAfterStart = vi
        .mocked(consola.log)
        .mock.invocationCallOrder.filter(
          (order, index) =>
            vi.mocked(consola.log).mock.calls[index][0] === "" &&
            order > orderOf(consola.info, started),
        );

      expect(blanksAfterStart).toHaveLength(1);
      expect(blanksAfterStart[0]).toBeGreaterThan(
        orderOf(consola.info, lastFollowUp),
      );
      expect(blanksAfterStart[0]).toBeLessThan(
        orderOf(consola.start, firstStatus),
      );
    });

    test("logs the log path and the arguments of the watcher when it starts", async () => {
      serveUpgrade();

      await runHook();

      expect(consola.debug).toHaveBeenCalledWith("Starting the watcher.", {
        args: ["upgrade", "watch", "ext-1", "run-1"],
        logPath: WATCHER_LOG,
      });
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
      expect(consola.info).toHaveBeenCalledWith(
        "Check the run with: npx aio-commerce-lib-app upgrade status run-1",
      );
      expect(consola.info).not.toHaveBeenCalledWith(
        expect.stringContaining("watcher log"),
      );
    });
  });

  describe("Ctrl+C", () => {
    test("names the run and the log of the watcher in the notice", async () => {
      serveUpgrade([attempt("in-progress"), attempt("succeeded")]);
      delayMock.mockImplementationOnce(async () => {
        process.emit("SIGINT");
      });

      await runHook();

      expect(processExitMock).toHaveBeenCalledWith(130);
      expect(consola.info).toHaveBeenCalledWith(
        `Stopped waiting. The upgrade keeps running.\nCheck the run with: npx aio-commerce-lib-app upgrade status run-1\nFollow the watcher log with: tail -f ${WATCHER_LOG}`,
      );
    });

    test("names only the run when the watcher could not start", async () => {
      serveUpgrade([attempt("in-progress"), attempt("succeeded")]);
      spawnDetachedMock.mockReturnValue(undefined);
      delayMock.mockImplementationOnce(async () => {
        process.emit("SIGINT");
      });

      await runHook();

      expect(consola.info).toHaveBeenCalledWith(
        "Stopped waiting. The upgrade keeps running.\nCheck the run with: npx aio-commerce-lib-app upgrade status run-1",
      );
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
