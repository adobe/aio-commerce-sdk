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
  getAioProjectContextMock,
  getServiceTokenMock,
  getAioCliEnvMock,
} = vi.hoisted(() => ({
  fetchMock: vi.fn(),
  getAioCliEnvMock: vi.fn(),
  getAioProjectContextMock: vi.fn(),
  getServiceTokenMock: vi.fn(),
}));

vi.mock("@aio-commerce-sdk/scripting-utils/aio", () => ({
  getAioCliEnv: getAioCliEnvMock,
  getAioProjectContext: getAioProjectContextMock,
  getServiceToken: getServiceTokenMock,
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
    warn: vi.fn(),
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

const AUTO_UPGRADE_PROJECT = makeProjectFiles(
  createMockConfig({ metadata: { upgradeMode: "auto" } }),
);

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

// The service resolves the record server-side and echoes its id in the response.
const NOTIFY_RESPONSE = { extensionId: "extension-1", id: "run-1" };

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
    getServiceTokenMock.mockResolvedValue("service-token");
    getAioCliEnvMock.mockReturnValue("prod");
    fetchMock.mockImplementation(
      async () =>
        new Response(JSON.stringify(NOTIFY_RESPONSE), { status: 202 }),
    );
  });

  test("notifies the service with a service token in a single call", async () => {
    const captured: Request[] = [];
    fetchMock.mockImplementation(async (input: Request) => {
      captured.push(input.clone());
      return new Response(JSON.stringify(NOTIFY_RESPONSE), { status: 202 });
    });

    await withTempProject(AUTO_UPGRADE_PROJECT, async () => {
      await expect(run()).resolves.toEqual({
        extensionId: "extension-1",
        notified: true,
      });
    });

    expect(getServiceTokenMock).toHaveBeenCalledOnce();

    // No record lookup: a single POST that carries the workspace natural key.
    expect(captured.filter((request) => request.method === "GET")).toHaveLength(
      0,
    );

    const notify = captured.find((request) => request.method === "POST");
    expect.assert(notify, "Expected a notify request");
    expect(notify.url).toContain("/v1/extensions:notify-upgrade");
    expect(notify.headers.get("authorization")).toBe("Bearer service-token");
    expect(await notify.json()).toEqual({
      metadataId: "test-app",
      mode: "auto",
      namespace: "runtime-namespace",
      org: { id: "org-id", imsOrgId: "ims-org-id" },
      plan: { to: "1.0.0" },
      workspace: { id: "workspace-id", name: "workspace-name" },
    });
  });

  test("sends the manual mode from the app config", async () => {
    let notifyBody: unknown;
    fetchMock.mockImplementation(async (input: Request) => {
      notifyBody = await input.clone().json();
      return new Response(JSON.stringify(NOTIFY_RESPONSE), { status: 202 });
    });

    await withTempProject(MANUAL_UPGRADE_PROJECT, async () => {
      await expect(run()).resolves.toEqual({
        extensionId: "extension-1",
        notified: true,
      });
    });

    expect(notifyBody).toMatchObject({ mode: "manual" });
  });

  test("soft-skips (does not fail the deploy) when the workspace has no record", async () => {
    // The service returns 404 when no record exists for the workspace.
    fetchMock.mockImplementation(
      async () => new Response(null, { status: 404 }),
    );

    await withTempProject(MINIMAL_PROJECT, async () => {
      await expect(run()).resolves.toEqual({
        notified: false,
        reason: "not-associated",
      });
    });
  });

  test("exits when the notification fails", async () => {
    getServiceTokenMock.mockRejectedValue(new Error("no service credential"));

    await withTempProject(MINIMAL_PROJECT, exec);
    expect(processExitMock).toHaveBeenCalledWith(1);
  });
});
