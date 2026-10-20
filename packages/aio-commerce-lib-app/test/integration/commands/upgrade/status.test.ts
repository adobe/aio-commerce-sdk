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
import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { getAioCliEnvMock, getAioProjectContextMock, getUserTokenMock } =
  vi.hoisted(() => ({
    getAioCliEnvMock: vi.fn(),
    getAioProjectContextMock: vi.fn(),
    getUserTokenMock: vi.fn(),
  }));

vi.mock("@aio-commerce-sdk/scripting-utils/aio", () => ({
  getAioCliEnv: getAioCliEnvMock,
  getAioProjectContext: getAioProjectContextMock,
  getUserToken: getUserTokenMock,
}));

vi.mock("consola", () => ({
  consola: { debug: vi.fn(), error: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

import { CAMS_URL_ENV_VAR } from "#commands/common/cams/config";
import { exec, run } from "#commands/upgrade/status/main";
import { apiServer, setupApiTestLifecycle } from "#test/setup/api";

const SERVICE = "https://service.example.com";
const EXTENSIONS = `${SERVICE}/v1/extensions`;
const UPGRADES = `${EXTENSIONS}/ext-1/upgrades`;

const PROJECT = {
  id: "project-id",
  name: "project-name",
  org: { id: "org-id", ims_org_id: "ims-org-id", name: "org-name" },
  title: "Project Title",
  workspace: { id: "workspace-id", name: "workspace-name", title: "Title" },
};

const IN_PROGRESS = { id: "run-1", status: "in-progress" };
const SUCCEEDED = {
  id: "run-1",
  result: { appVersion: "2.0.0", snapshotId: "s" },
  status: "succeeded",
};
const FAILED = {
  error: { key: "FAILED", message: "The webhooks step failed" },
  id: "run-1",
  status: "failed",
};

/** Answers the lookup, the read of the latest run and the poll of run-1, and counts the last two. */
function serve(poll: () => Response, latest: object | null = IN_PROGRESS) {
  const calls = { latest: 0, polls: 0 };
  apiServer.use(
    http.get(EXTENSIONS, () => HttpResponse.json([{ id: "ext-1" }])),
    http.get(UPGRADES, () => {
      calls.latest += 1;
      return latest === null
        ? new HttpResponse(null, { status: 204 })
        : HttpResponse.json(latest);
    }),
    http.post(`${UPGRADES}/run-1/sync`, () => {
      calls.polls += 1;
      return poll();
    }),
  );

  return calls;
}

setupApiTestLifecycle();

describe("upgrade status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv(CAMS_URL_ENV_VAR, SERVICE);
    getAioProjectContextMock.mockReturnValue({
      namespace: "ns",
      project: PROJECT,
    });
    getAioCliEnvMock.mockReturnValue("prod");
    getUserTokenMock.mockResolvedValue("ims-token");
  });

  afterEach(() => {
    process.exitCode = undefined;
    vi.unstubAllEnvs();
  });

  test.each([
    ["a running", IN_PROGRESS, 0, "info", "run-1) is in-progress"],
    ["a succeeded", SUCCEEDED, 0, "success", "version 2.0.0"],
    ["a failed", FAILED, 1, "error", "The webhooks step failed"],
  ] as const)(
    "checks %s run once without reading the latest run",
    async (_, body, code, log, text) => {
      const calls = serve(() => HttpResponse.json(body));

      await expect(run({ runId: "run-1" })).resolves.toBe(code);

      expect(calls).toEqual({ latest: 0, polls: 1 });
      expect(consola[log]).toHaveBeenCalledWith(expect.stringContaining(text));
    },
  );

  test.each([403, 502])(
    "exits with 1 on a %i answer without checking again",
    async (status) => {
      const calls = serve(() => HttpResponse.json({}, { status }));

      await expect(run({ runId: "run-1" })).resolves.toBe(1);

      expect(calls.polls).toBe(1);
      expect(consola.error).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining(
          `\nDetails: HTTP ${status}, POST /v1/extensions/ext-1/upgrades/run-1/sync`,
        ),
      );
    },
  );

  test("without a run id, reads the latest run and checks that one", async () => {
    const calls = serve(() => HttpResponse.json(SUCCEEDED));

    await expect(run({})).resolves.toBe(0);

    expect(calls).toEqual({ latest: 1, polls: 1 });
  });

  test("without a run id and without runs, says so and checks nothing", async () => {
    const calls = serve(() => HttpResponse.json(SUCCEEDED), null);

    await expect(run({})).resolves.toBe(0);

    expect(calls.polls).toBe(0);
    expect(consola.info).toHaveBeenCalledWith(
      "The app has no upgrade run yet.",
    );
  });

  test("exits with 1 when the workspace has no extension", async () => {
    apiServer.use(http.get(EXTENSIONS, () => HttpResponse.json([])));

    await expect(run({ runId: "run-1" })).resolves.toBe(1);
    expect(consola.error).toHaveBeenCalledWith(
      "This workspace is not associated with an app extension.",
    );
  });

  describe("exec", () => {
    test("sets the exit code of the process from the run", async () => {
      serve(() => HttpResponse.json(FAILED));

      await exec("run-1");

      expect(process.exitCode).toBe(1);
    });

    test("sets the exit code 1 for an unknown option, without a request", async () => {
      const calls = serve(() => HttpResponse.json(SUCCEEDED));

      await exec("--watch");

      expect(process.exitCode).toBe(1);
      expect(calls.polls).toBe(0);
      expect(consola.error).toHaveBeenCalledWith("Unknown option: --watch");
    });

    test("sets the exit code 1 when the project is not configured", async () => {
      getAioProjectContextMock.mockImplementation(() => {
        throw new Error("The current App Builder project is required");
      });

      await exec("run-1");

      expect(process.exitCode).toBe(1);
      expect(consola.error).toHaveBeenCalledWith(
        "The current App Builder project is required",
      );
    });
  });
});
