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

import { HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  createCamsInstanceClient,
  createCamsWorkspaceClient,
} from "#commands/common/cams/api-client";
import { CAMS_URL_ENV_VAR } from "#commands/common/cams/config";
import {
  createCamsContext,
  findWorkspaceExtension,
  requireCommerceInstance,
} from "#commands/common/cams/context";
import { CamsClientError } from "#commands/common/cams/errors";
import { apiServer, setupApiTestLifecycle } from "#test/setup/api";

const aio = vi.hoisted(() => ({
  getAioCliEnv: vi.fn(),
  getAioProjectContext: vi.fn(),
  getUserToken: vi.fn(),
}));

vi.mock("@aio-commerce-sdk/scripting-utils/aio", () => aio);
vi.mock("#commands/common/cams/api-client", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("#commands/common/cams/api-client")>();
  return {
    ...original,
    createCamsInstanceClient: vi.fn(original.createCamsInstanceClient),
    createCamsWorkspaceClient: vi.fn(original.createCamsWorkspaceClient),
  };
});

const SERVICE = "https://service.example.com";
const LOOKUP_URL = `${SERVICE}/v1/workspaces/workspace-id/extensions`;
const PROJECT = {
  id: "project-id",
  name: "project-name",
  org: { id: "org-id", ims_org_id: "ims-org-id", name: "org-name" },
  title: "Project",
  workspace: { id: "workspace-id", name: "workspace-name", title: "Workspace" },
};
const COMMERCE_INSTANCE = {
  baseUrl: "https://commerce.example.com",
  env: "saas",
} as const;

setupApiTestLifecycle();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv(CAMS_URL_ENV_VAR, SERVICE);
  aio.getAioCliEnv.mockReturnValue("prod");
  aio.getAioProjectContext.mockReturnValue({ project: PROJECT });
  aio.getUserToken.mockResolvedValue("token");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createCamsContext", () => {
  test("creates neither client until its supplier is called", () => {
    const context = createCamsContext();

    expect(createCamsWorkspaceClient).not.toHaveBeenCalled();
    expect(createCamsInstanceClient).not.toHaveBeenCalled();

    expect(context.createWorkspaceClient()).toHaveProperty("findExtension");
    expect(createCamsWorkspaceClient).toHaveBeenCalledExactlyOnceWith({
      auth: { getToken: aio.getUserToken, org: PROJECT.org },
      config: { baseUrl: SERVICE },
    });
    expect(createCamsInstanceClient).not.toHaveBeenCalled();

    expect(context.createInstanceClient(COMMERCE_INSTANCE)).toHaveProperty(
      "planUpgrade",
    );
    expect(createCamsInstanceClient).toHaveBeenCalledExactlyOnceWith(
      {
        auth: { getToken: aio.getUserToken, org: PROJECT.org },
        config: { baseUrl: SERVICE },
      },
      COMMERCE_INSTANCE,
    );
    expect(aio.getUserToken).not.toHaveBeenCalled();
  });

  test("preserves a custom token supplier for both clients", () => {
    const getToken = vi.fn(async () => "custom-token");
    const context = createCamsContext(getToken);

    context.createWorkspaceClient();
    context.createInstanceClient(COMMERCE_INSTANCE);

    const params = {
      auth: { getToken, org: PROJECT.org },
      config: { baseUrl: SERVICE },
    };
    expect(createCamsWorkspaceClient).toHaveBeenCalledWith(params);
    expect(createCamsInstanceClient).toHaveBeenCalledWith(
      params,
      COMMERCE_INSTANCE,
    );
    expect(getToken).not.toHaveBeenCalled();
  });
});

describe("findWorkspaceExtension", () => {
  test("returns the extension without mutating the context or creating an instance client", async () => {
    const extension = {
      id: "ext-1",
      scope: {
        commerceBaseUrl: COMMERCE_INSTANCE.baseUrl,
        commerceEnv: COMMERCE_INSTANCE.env,
      },
    };
    const requests: Request[] = [];
    apiServer.use(
      http.get(LOOKUP_URL, ({ request }) => {
        requests.push(request);
        return HttpResponse.json([extension]);
      }),
    );
    const context = Object.freeze(createCamsContext());
    const before = { ...context };

    await expect(
      findWorkspaceExtension(context, { headers: { "x-extra": "preserved" } }),
    ).resolves.toEqual(extension);

    expect(context).toEqual(before);
    expect(createCamsInstanceClient).not.toHaveBeenCalled();
    expect(requests).toHaveLength(1);
    expect(requests.at(0)?.headers.get("x-extra")).toBe("preserved");
    expect(requests.at(0)?.headers.get("x-org-id")).toBe("ims-org-id");
    expect(requests.at(0)?.headers.has("x-ac-url")).toBe(false);
    expect(requests.at(0)?.headers.has("x-ac-env")).toBe(false);
  });

  test("returns null when the workspace has no extension", async () => {
    apiServer.use(http.get(LOOKUP_URL, () => HttpResponse.json([])));

    await expect(
      findWorkspaceExtension(createCamsContext()),
    ).resolves.toBeNull();
    expect(createCamsInstanceClient).not.toHaveBeenCalled();
  });
});

describe("requireCommerceInstance", () => {
  test("reads the explicit instance fields", () => {
    expect(
      requireCommerceInstance({
        id: "ext-1",
        scope: {
          commerceBaseUrl: COMMERCE_INSTANCE.baseUrl,
          commerceEnv: COMMERCE_INSTANCE.env,
        },
      }),
    ).toEqual(COMMERCE_INSTANCE);
  });

  test.each([
    ["no extension", null],
    ["no scope", { id: "ext-1" }],
    ["no URL", { id: "ext-1", scope: { commerceEnv: "saas" } }],
    ["no environment", { id: "ext-1", scope: { commerceBaseUrl: SERVICE } }],
    [
      "an empty URL",
      { id: "ext-1", scope: { commerceBaseUrl: "", commerceEnv: "saas" } },
    ],
    [
      "null fields",
      { id: "ext-1", scope: { commerceBaseUrl: null, commerceEnv: null } },
    ],
    [
      "only a legacy Commerce id",
      {
        id: "ext-1",
        scope: {
          commerceId: Buffer.from(
            "https://commerce.example.com/env/saas",
          ).toString("base64url"),
        },
      },
    ],
  ] as const)("rejects %s", (_, extension) => {
    expect(() => requireCommerceInstance(extension)).toThrow(CamsClientError);
  });
});
