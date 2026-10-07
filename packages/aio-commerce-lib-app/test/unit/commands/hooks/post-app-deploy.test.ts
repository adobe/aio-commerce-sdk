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
import { beforeEach, describe, expect, test, vi } from "vitest";

const {
  delayMock,
  fetchMock,
  getAioCliEnvMock,
  getAioProjectContextMock,
  getUserTokenMock,
} = vi.hoisted(() => ({
  delayMock: vi.fn(),
  fetchMock: vi.fn(),
  getAioCliEnvMock: vi.fn(),
  getAioProjectContextMock: vi.fn(),
  getUserTokenMock: vi.fn(),
}));

vi.mock("node:timers/promises", () => ({
  setTimeout: delayMock,
}));

vi.mock("@aio-commerce-sdk/scripting-utils/aio", () => ({
  getAioCliEnv: getAioCliEnvMock,
  getAioProjectContext: getAioProjectContextMock,
  getUserToken: getUserTokenMock,
}));

vi.mock("consola", () => ({
  consola: {
    box: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    log: vi.fn(),
    start: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("consola/utils", () => ({
  colors: { cyan: (value: string) => value },
}));

import { exec, run } from "#commands/hooks/post-app-deploy/main";
import { createMockConfig } from "#test/fixtures/config";
import {
  MINIMAL_PROJECT,
  makeProjectFiles,
  withTempProject,
} from "#test/fixtures/project";

const MANUAL_UPGRADE_PROJECT = makeProjectFiles(
  createMockConfig({ metadata: { upgradeMode: "manual" } }),
);

const project = {
  id: "project-id",
  name: "project-name",
  org: { id: "org-id", ims_org_id: "ims-org-id", name: "org-name" },
  title: "Project Title",
  workspace: {
    id: "workspace-id",
    name: "workspace-name",
    title: "Workspace Title",
  },
};

/** The plan preview the action's `POST /plan` returns for an installed app. */
const UPGRADE_PLAN = { id: "plan-1", operation: "upgrade" };

/** A JSON response with the given status. */
function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), { status });
}

/** The status the action returns for an attempt. */
function attemptStatus(status: string, extra: object = {}) {
  return json({ id: "attempt-1", status, ...extra }, 200);
}

describe("post-app-deploy hook", () => {
  const processExitMock = vi
    .spyOn(process, "exit")
    .mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    getAioProjectContextMock.mockReturnValue({
      namespace: "runtime-namespace",
      project,
    });
    getAioCliEnvMock.mockReturnValue("prod");
    getUserTokenMock.mockResolvedValue("ims-token");
    delayMock.mockResolvedValue(undefined);
    fetchMock.mockImplementation(async (input: Request) => {
      if (input.method === "GET") {
        return new Response(null, { status: 204 });
      }

      return input.url.endsWith("/plan")
        ? json({ plan: UPGRADE_PLAN }, 200)
        : json({ id: "attempt-1", status: "pending" }, 202);
    });
  });

  test("plans the upgrade with the project context, then starts it from its plan id", async () => {
    const posted: Request[] = [];
    const respond = fetchMock.getMockImplementation();
    fetchMock.mockImplementation((input: Request) => {
      if (input.method === "POST") {
        posted.push(input.clone());
      }

      return respond?.(input);
    });

    await withTempProject(MINIMAL_PROJECT, async () => {
      await expect(run()).resolves.toEqual({ plan: UPGRADE_PLAN });
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const [planRequest, startRequest] = posted;

    const endpoint =
      "https://runtime-namespace.adobeioruntime.net/api/v1/web/app-management/installation";
    expect(planRequest.url).toBe(`${endpoint}/plan`);
    expect(planRequest.method).toBe("POST");
    expect(planRequest.headers.get("authorization")).toBe("Bearer ims-token");
    expect(
      planRequest.headers.get("x-aio-commerce-installation-invocation-source"),
    ).toBe("post-app-deploy");
    expect(planRequest.headers.get("x-gw-ims-org-id")).toBe("ims-org-id");
    expect(planRequest.headers.get("content-type")).toBe("application/json");

    const context = {
      appData: {
        consumerOrgId: "org-id",
        orgName: "org-name",
        projectId: "project-id",
        projectName: "project-name",
        projectTitle: "Project Title",
        workspaceId: "workspace-id",
        workspaceName: "workspace-name",
        workspaceTitle: "Workspace Title",
      },
      ioEventsEnv: "prod",
      ioEventsUrl: "https://events.adobe.io",
    };

    expect(await planRequest.json()).toEqual(context);
    expect(startRequest.url).toBe(endpoint);
    expect(startRequest.method).toBe("POST");
    expect(await startRequest.json()).toEqual({ ...context, planId: "plan-1" });
  });

  test("polls an automatic upgrade until it succeeds", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ plan: UPGRADE_PLAN }, 200))
      .mockResolvedValueOnce(json({ id: "attempt-1", status: "pending" }, 202))
      .mockResolvedValueOnce(attemptStatus("pending"))
      .mockResolvedValueOnce(attemptStatus("in-progress"))
      .mockResolvedValueOnce(attemptStatus("succeeded"));

    await withTempProject(MINIMAL_PROJECT, async () => {
      await expect(run()).resolves.toEqual({ plan: UPGRADE_PLAN });
    });

    expect(fetchMock).toHaveBeenCalledTimes(5);
    const statusRequest = fetchMock.mock.calls.at(2)?.at(0) as Request;
    expect(statusRequest.method).toBe("GET");
    expect(
      statusRequest.headers.get(
        "x-aio-commerce-installation-invocation-source",
      ),
    ).toBe("post-app-deploy");
    expect(consola.start).toHaveBeenCalledTimes(3);
    expect(consola.start).toHaveBeenNthCalledWith(
      2,
      "App upgrade is in progress...",
    );
    expect(consola.start).toHaveBeenNthCalledWith(
      3,
      "App upgrade is in progress...",
    );
    expect(delayMock).toHaveBeenCalledTimes(2);
    expect(delayMock).toHaveBeenCalledWith(1000);
  });

  test("reports an automatic upgrade failure with its attempt and execution activation", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ plan: UPGRADE_PLAN }, 200))
      .mockResolvedValueOnce(json({ id: "attempt-1", status: "pending" }, 202))
      .mockResolvedValueOnce(
        attemptStatus("failed", {
          activations: { execution: "activation-exec", start: "activation-1" },
          error: {
            key: "WEBHOOK_RECONCILIATION_FAILED",
            message: "Webhook reconciliation failed",
          },
        }),
      );

    await withTempProject(MINIMAL_PROJECT, async () => {
      await expect(run()).rejects.toThrow(
        "App upgrade failed (attempt attempt-1, execution activation activation-exec): Webhook reconciliation failed",
      );
    });
  });

  test("reports an automatic upgrade failure without a known execution activation", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ plan: UPGRADE_PLAN }, 200))
      .mockResolvedValueOnce(json({ id: "attempt-1", status: "pending" }, 202))
      .mockResolvedValueOnce(
        attemptStatus("failed", {
          activations: { start: "activation-1" },
          error: { key: "LIFECYCLE_DISPATCH_FAILED" },
        }),
      );

    await withTempProject(MINIMAL_PROJECT, async () => {
      await expect(run()).rejects.toThrow(
        "App upgrade failed (attempt attempt-1): LIFECYCLE_DISPATCH_FAILED",
      );
    });
  });

  test("reports an upgrade that cannot start", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ plan: UPGRADE_PLAN }, 200))
      .mockResolvedValueOnce(
        json({ message: "Stale", reason: "stale-plan" }, 409),
      );

    await withTempProject(MINIMAL_PROJECT, async () => {
      await expect(run()).rejects.toThrow(
        "Failed to start the app upgrade (HTTP 409)",
      );
    });
  });

  test("plans a manual upgrade without starting it", async () => {
    await withTempProject(MANUAL_UPGRADE_PROJECT, async () => {
      await expect(run()).resolves.toEqual({ plan: UPGRADE_PLAN });
    });

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  test("skips an app that is not installed without starting the install the action plans", async () => {
    fetchMock.mockResolvedValueOnce(
      json({ plan: { id: "plan-1", operation: "install" } }, 200),
    );

    await withTempProject(MINIMAL_PROJECT, async () => {
      await expect(run()).resolves.toEqual({
        reason: "not-installed",
        skipped: true,
      });
    });

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  test("ignores an unavailable upgrade status endpoint", async () => {
    fetchMock
      .mockResolvedValueOnce(json({ plan: UPGRADE_PLAN }, 200))
      .mockResolvedValueOnce(json({ id: "attempt-1", status: "pending" }, 202))
      .mockRejectedValueOnce(new Error("Status endpoint is unavailable"));

    await withTempProject(MINIMAL_PROJECT, async () => {
      await expect(run()).resolves.toEqual({ plan: UPGRADE_PLAN });
    });
  });

  test.each(["already-current", "not-associated", "not-installed"] as const)(
    "treats %s as a no-op",
    async (reason) => {
      fetchMock.mockResolvedValue(
        new Response(
          JSON.stringify({
            message: "The upgrade is not actionable.",
            reason,
          }),
          { status: 409 },
        ),
      );

      await withTempProject(MINIMAL_PROJECT, async () => {
        await expect(run()).resolves.toEqual({
          reason,
          skipped: true,
        });
      });
    },
  );

  test("rejects unrecognized 409 reasons", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "The upgrade requires another action.",
          reason: "manual-review-required",
        }),
        { status: 409 },
      ),
    );

    await withTempProject(MINIMAL_PROJECT, async () => {
      await expect(run()).rejects.toThrow();
    });
  });

  test("exits when the upgrade endpoint fails", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Upgrade planning is blocked" }), {
        status: 409,
      }),
    );

    await withTempProject(MINIMAL_PROJECT, exec);
    expect(processExitMock).toHaveBeenCalledWith(1);
  });
});
