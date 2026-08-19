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

import { beforeEach, describe, expect, test, vi } from "vitest";

const {
  fetchMock,
  getAioCliEnvMock,
  getAioProjectContextMock,
  getUserTokenMock,
} = vi.hoisted(() => ({
  fetchMock: vi.fn(),
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
  consola: {
    box: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    start: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("consola/utils", () => ({
  colors: { cyan: (value: string) => value },
}));

import { exec, run } from "#commands/hooks/post-app-deploy";
import { MINIMAL_PROJECT, withTempProject } from "#test/fixtures/project";

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
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ plan: { id: "plan-1" } }), {
        status: 202,
      }),
    );
  });

  test("POSTs authenticated project context to the deployed upgrade endpoint", async () => {
    let capturedRequest: Request | undefined;
    fetchMock.mockImplementation(async (input: Request) => {
      capturedRequest = input.clone();
      return new Response(JSON.stringify({ plan: { id: "plan-1" } }), {
        status: 202,
      });
    });

    await withTempProject(MINIMAL_PROJECT, async () => {
      await expect(run()).resolves.toEqual({ plan: { id: "plan-1" } });
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const request = capturedRequest as Request;
    expect(request.url).toBe(
      "https://runtime-namespace.adobeioruntime.net/api/v1/web/app-management/installation",
    );
    expect(request.method).toBe("POST");
    expect(request.headers.get("authorization")).toBe("Bearer ims-token");
    expect(request.headers.get("x-gw-ims-org-id")).toBe("ims-org-id");
    expect(request.headers.get("content-type")).toBe("application/json");

    expect(await request.json()).toEqual({
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
    });
  });

  test("treats a supported 409 reason as a no-op", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          message: "The app is already on the target version.",
          reason: "already-current",
        }),
        { status: 409 },
      ),
    );

    await withTempProject(MINIMAL_PROJECT, async () => {
      await expect(run()).resolves.toEqual({
        reason: "already-current",
        skipped: true,
      });
    });
  });

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
