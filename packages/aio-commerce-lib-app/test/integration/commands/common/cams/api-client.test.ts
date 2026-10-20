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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import { HttpResponse, http } from "msw";
import { describe, expect, test } from "vitest";

import { createCamsClient } from "#commands/common/cams/api-client";
import {
  CamsClientError,
  CamsConflictError,
} from "#commands/common/cams/errors";
import { apiServer, setupApiTestLifecycle } from "#test/setup/api";

import type { Options } from "ky";

const BASE_URL = "https://service.example.com";
const EXTENSIONS = `${BASE_URL}/v1/extensions`;
const WORKSPACE_EXTENSIONS = `${BASE_URL}/v1/workspaces/:workspaceId/extensions`;
const UPGRADES = `${EXTENSIONS}/ext-1/upgrades`;
const UPGRADE_PREVIEW = `${UPGRADES}/preview`;
const STATUS_URL = `${UPGRADES}/run-1`;

const ORG = { id: "org-id", ims_org_id: "ims-org-id", name: "org-name" };
const RUNNING = { id: "run-1", status: "in-progress" };
const IDS = { extensionId: "ext-1", runId: "run-1" };

setupApiTestLifecycle();

function createClient(fetchOptions?: Options) {
  return createCamsClient({
    auth: { getToken: async () => "user-token", org: ORG },
    config: { baseUrl: BASE_URL },
    fetchOptions,
  });
}

/** The error a call rejects with. */
async function failureOf(call: Promise<unknown>) {
  try {
    await call;
  } catch (error) {
    return error as CamsClientError;
  }

  throw new Error("Expected the call to fail");
}

describe("findExtension", () => {
  const WORKSPACE = { workspaceId: "ws/1" };

  test("looks the workspace up by its id and returns the first extension", async () => {
    let workspaceId: string | readonly string[] | undefined;
    apiServer.use(
      http.get(WORKSPACE_EXTENSIONS, ({ params }) => {
        ({ workspaceId } = params);
        return HttpResponse.json([{ id: "ext-1" }, { id: "ext-2" }]);
      }),
    );

    const extension = await createClient().findExtension(WORKSPACE);

    expect(extension).toMatchObject({ id: "ext-1" });
    expect(workspaceId).toBe("ws/1");
  });

  test("returns null when the workspace has no extension", async () => {
    apiServer.use(http.get(WORKSPACE_EXTENSIONS, () => HttpResponse.json([])));

    await expect(createClient().findExtension(WORKSPACE)).resolves.toBeNull();
  });
});

describe("the Commerce instance", () => {
  const COMMERCE_ID = Buffer.from(
    "https://commerce.example.com/env/paas",
  ).toString("base64url");

  /** Answers the lookup with the extension and records the headers of the plan request. */
  function serve(extension: object) {
    const seen = { headers: new Headers() };
    apiServer.use(
      http.get(WORKSPACE_EXTENSIONS, () => HttpResponse.json([extension])),
      http.post(UPGRADE_PREVIEW, ({ request }) => {
        seen.headers = request.headers;
        return HttpResponse.json({ plan: { id: "p", operation: "upgrade" } });
      }),
    );

    return seen;
  }

  test("is named in the requests that follow the lookup of the extension", async () => {
    const seen = serve({ id: "ext-1", scope: { commerceId: COMMERCE_ID } });
    const client = createClient();

    await client.findExtension({ workspaceId: "ws-1" });
    await client.planUpgrade({ extensionId: "ext-1" });

    expect(seen.headers.get("x-ac-url")).toBe("https://commerce.example.com");
    expect(seen.headers.get("x-ac-env")).toBe("paas");
  });

  test("prefers the decoded Commerce instance fields returned by the service", async () => {
    const seen = serve({
      id: "ext-1",
      scope: {
        commerceBaseUrl: "https://decoded.example.com",
        commerceEnv: "saas",
        commerceId: COMMERCE_ID,
      },
    });
    const client = createClient();

    await client.findExtension({ workspaceId: "ws-1" });
    await client.planUpgrade({ extensionId: "ext-1" });

    expect(seen.headers.get("x-ac-url")).toBe("https://decoded.example.com");
    expect(seen.headers.get("x-ac-env")).toBe("saas");
  });

  test.each([
    ["has no commerce id", { commerceId: undefined }],
    [
      "has a commerce id of another format",
      { commerceId: "bm90LWFuLWluc3RhbmNl" },
    ],
    [
      "has null decoded fields for a legacy id",
      { commerceBaseUrl: null, commerceEnv: null, commerceId: "ci-legacy" },
    ],
  ])("is not named when the extension %s", async (_, scope) => {
    const seen = serve({ id: "ext-1", scope });
    const client = createClient();

    await client.findExtension({ workspaceId: "ws-1" });
    await client.planUpgrade({ extensionId: "ext-1" });

    expect(seen.headers.has("x-ac-url")).toBe(false);
    expect(seen.headers.has("x-ac-env")).toBe(false);
  });
});

describe("planUpgrade", () => {
  const PLAN = { id: "plan-1", operation: "upgrade", summary: "extra" };

  test("posts without a body and returns the whole plan", async () => {
    let body: string | undefined;
    apiServer.use(
      http.post(UPGRADE_PREVIEW, async ({ request }) => {
        body = await request.text();
        return HttpResponse.json({ plan: PLAN, valid: true }, { status: 201 });
      }),
    );

    await expect(
      createClient().planUpgrade({ extensionId: "ext-1" }),
    ).resolves.toEqual(PLAN);
    expect(body).toBe("");
  });

  test.each([
    ["the versions", { sourceVersion: "1.0.0", targetVersion: "2.0.0" }],
    ["no source version", { sourceVersion: null, targetVersion: "2.0.0" }],
    ["no target version", { sourceVersion: "1.0.0", targetVersion: null }],
  ])("keeps %s of the plan", async (_, versions) => {
    const plan = { ...PLAN, domains: [], ...versions };
    apiServer.use(
      http.post(UPGRADE_PREVIEW, () => HttpResponse.json({ plan })),
    );

    await expect(
      createClient().planUpgrade({ extensionId: "ext-1" }),
    ).resolves.toEqual(plan);
  });

  test("rejects a plan with a version that is not text", async () => {
    apiServer.use(
      http.post(UPGRADE_PREVIEW, () =>
        HttpResponse.json({ plan: { ...PLAN, targetVersion: 2 } }),
      ),
    );

    await expect(
      createClient().planUpgrade({ extensionId: "ext-1" }),
    ).rejects.toThrow("unexpected answer");
  });

  test("throws a conflict error that carries the code of a 409 answer", async () => {
    apiServer.use(
      http.post(UPGRADE_PREVIEW, () =>
        HttpResponse.json(
          { code: "in-progress", message: "Refused" },
          { status: 409 },
        ),
      ),
    );

    const error = await failureOf(
      createClient().planUpgrade({ extensionId: "ext-1" }),
    );

    expect(error).toBeInstanceOf(CamsConflictError);
    expect(error).toMatchObject({
      code: "in-progress",
      message: expect.stringContaining("Refused"),
      retryable: false,
    });
  });

  test.each([
    [
      "only the old reason field",
      () => HttpResponse.json({ reason: "in-progress" }, { status: 409 }),
    ],
    ["no JSON", () => new HttpResponse("busy", { status: 409 })],
  ])(
    "throws a conflict error without a code for a 409 answer with %s",
    async (_, answer) => {
      apiServer.use(http.post(UPGRADE_PREVIEW, answer));

      const error = await failureOf(
        createClient().planUpgrade({ extensionId: "ext-1" }),
      );

      expect(error).toBeInstanceOf(CamsConflictError);
      expect((error as CamsConflictError).code).toBeUndefined();
    },
  );
});

describe("startUpgrade", () => {
  test("starts the planned upgrade without a request body", async () => {
    let requestBody: string | undefined;
    let requestPath: string | undefined;
    apiServer.use(
      http.post(`${UPGRADES}:start`, async ({ request }) => {
        requestBody = await request.text();
        requestPath = new URL(request.url).pathname;
        return HttpResponse.json(
          { ...RUNNING, activationId: "act-1", status: "pending" },
          { status: 202 },
        );
      }),
    );

    const attempt = await createClient().startUpgrade({ extensionId: "ext-1" });

    expect(requestPath).toBe("/v1/extensions/ext-1/upgrades:start");
    expect(requestBody).toBe("");
    expect(attempt).toEqual({ id: "run-1", status: "pending" });
  });
});

describe("pollUpgrade", () => {
  test("gets an attempt by its encoded path and ignores fields it does not know", async () => {
    let received: { method: string; path: string } | undefined;
    apiServer.use(
      http.get(`${EXTENSIONS}/:extensionId/upgrades/:runId`, ({ request }) => {
        received = {
          method: request.method,
          path: new URL(request.url).pathname,
        };

        return HttpResponse.json({ ...RUNNING, step: { nested: true } });
      }),
    );

    const attempt = await createClient().pollUpgrade({
      extensionId: "e/1",
      runId: "r/1",
    });

    expect(attempt).toEqual(RUNNING);
    expect(received).toEqual({
      method: "GET",
      path: "/v1/extensions/e%2F1/upgrades/r%2F1",
    });
  });

  const SUCCEEDED = {
    id: "run-1",
    result: { appVersion: "2", snapshotId: "s" },
    status: "succeeded",
  };
  const FAILED = {
    activations: { execution: "a" },
    error: { key: "K" },
    id: "run-1",
    status: "failed",
  };

  test.each([
    ["a null result on a running attempt", { ...RUNNING, result: null }],
    ["the result of a succeeded attempt", SUCCEEDED],
    ["the error of a failed attempt", FAILED],
  ])("accepts %s", async (_, body) => {
    apiServer.use(http.get(STATUS_URL, () => HttpResponse.json(body)));

    await expect(createClient().pollUpgrade(IDS)).resolves.toMatchObject(body);
  });

  test.each([
    ["an unknown status", { id: "run-1", status: "done" }],
    ["an error without a key", { error: {}, id: "run-1", status: "failed" }],
    ["no id", { status: "failed" }],
  ])("rejects an answer with %s as unexpected", async (_, body) => {
    apiServer.use(http.get(STATUS_URL, () => HttpResponse.json(body)));

    const error = await failureOf(createClient().pollUpgrade(IDS));

    expect(error).toMatchObject({
      message: expect.stringContaining("unexpected answer"),
      retryable: false,
    });
  });

  test("rejects an answer that is not JSON", async () => {
    apiServer.use(http.get(STATUS_URL, () => new HttpResponse("<html>")));

    await expect(createClient().pollUpgrade(IDS)).rejects.toThrow("not JSON");
  });

  test.each([400, 401, 403, 404, 500, 502, 503])(
    "marks a %s answer as retryable only when it is a 502 or a 503",
    async (status) => {
      apiServer.use(
        http.get(STATUS_URL, () =>
          HttpResponse.json({ message: "No" }, { status }),
        ),
      );

      const error = await failureOf(createClient().pollUpgrade(IDS));

      expect(error).not.toBeInstanceOf(CamsConflictError);
      expect(error.retryable).toBe(status === 502 || status === 503);
      expect(error.cause).toMatchObject({ response: { status } });
    },
  );

  test("keeps the code and the detail of a problem answer", async () => {
    apiServer.use(
      http.get(STATUS_URL, () =>
        HttpResponse.json(
          { code: "commerce-access-denied", detail: "No access" },
          { status: 403 },
        ),
      ),
    );

    const error = await failureOf(createClient().pollUpgrade(IDS));

    expect(error).toMatchObject({
      code: "commerce-access-denied",
      message: "No access",
      retryable: false,
      status: 403,
    });
  });

  test("keeps the status, the code and the request of an error answer, without the host", async () => {
    apiServer.use(
      http.get(STATUS_URL, () =>
        HttpResponse.json(
          { code: "forbidden", message: "No access" },
          { status: 403 },
        ),
      ),
    );

    const error = await failureOf(createClient().pollUpgrade(IDS));

    expect(error).toMatchObject({
      code: "forbidden",
      message: "No access",
      request: {
        method: "GET",
        path: "/v1/extensions/ext-1/upgrades/run-1",
      },
      status: 403,
    });
  });

  test("leaves the status text out of the message when the answer has none", async () => {
    const client = createClient({
      fetch: async () => new Response(null, { status: 500, statusText: "" }),
    });

    const error = await failureOf(client.pollUpgrade(IDS));

    expect(error.message).toBe(
      "The Commerce App Management Service answered with HTTP 500",
    );
  });

  test.each([
    [
      "JSON without a message",
      () =>
        HttpResponse.json(
          {},
          { status: 503, statusText: "Service Unavailable" },
        ),
      "The Commerce App Management Service answered with HTTP 503 Service Unavailable",
    ],
    [
      "a body that is not JSON",
      () => new HttpResponse("Gateway timed out", { status: 504 }),
      "Gateway timed out",
    ],
  ])("words an answer with %s", async (_, respond, message) => {
    apiServer.use(http.get(STATUS_URL, respond));

    const error = await failureOf(createClient().pollUpgrade(IDS));

    expect(error.message).toBe(message);
  });

  test("cuts a long body that is not JSON", async () => {
    apiServer.use(
      http.get(
        STATUS_URL,
        () => new HttpResponse("x".repeat(1000), { status: 500 }),
      ),
    );

    const error = await failureOf(createClient().pollUpgrade(IDS));

    expect(error.message).toBe("x".repeat(300));
  });

  test("marks a network failure as retryable", async () => {
    apiServer.use(http.get(STATUS_URL, () => HttpResponse.error()));

    const error = await failureOf(createClient().pollUpgrade(IDS));

    expect(error).toBeInstanceOf(CamsClientError);
    expect(error.retryable).toBe(true);
  });

  test("does not retry, even when the client retries GET requests", async () => {
    let requests = 0;
    apiServer.use(
      http.get(STATUS_URL, () => {
        requests += 1;
        return HttpResponse.json({}, { status: 502 });
      }),
    );
    const client = createClient({
      retry: { delay: () => 0, limit: 2, methods: ["get"] },
    });

    await failureOf(client.pollUpgrade(IDS));

    expect(requests).toBe(1);
  });
});

describe("readLatestUpgrade", () => {
  test.each([
    [
      "the first of several attempts",
      [RUNNING, { id: "run-0", status: "failed" }],
      RUNNING,
    ],
    ["a single attempt", RUNNING, RUNNING],
    ["no attempt", [], null],
  ])("returns %s", async (_, body, expected) => {
    let query = "";
    apiServer.use(
      http.get(UPGRADES, ({ request }) => {
        query = new URL(request.url).search;
        return HttpResponse.json(body);
      }),
    );

    const latest = await createClient().readLatestUpgrade({
      extensionId: "ext-1",
    });

    expect(latest).toEqual(expected);
    expect(new URLSearchParams(query).get("limit")).toBe("1");
    expect(new URLSearchParams(query).get("operation")).toBe("upgrade");
  });

  test("returns null when the service responds with 204", async () => {
    apiServer.use(
      http.get(UPGRADES, () => new HttpResponse(null, { status: 204 })),
    );

    await expect(
      createClient().readLatestUpgrade({ extensionId: "ext-1" }),
    ).resolves.toBeNull();
  });
});

describe("parameters", () => {
  const client = createClient();
  const calls = {
    findExtension: () => client.findExtension({ workspaceId: "" }),
    planUpgrade: () => client.planUpgrade({ extensionId: "" }),
    pollUpgrade: () => client.pollUpgrade({ extensionId: "e", runId: "" }),
    readLatestUpgrade: () => client.readLatestUpgrade({ extensionId: "" }),
    startUpgrade: () => client.startUpgrade({ extensionId: "" }),
  };

  test.each(Object.keys(calls) as (keyof typeof calls)[])(
    "%s refuses an empty id without sending a request",
    async (name) => {
      await expect(calls[name]()).rejects.toBeInstanceOf(
        CommerceSdkValidationError,
      );
    },
  );
});

describe("unexpected answers", () => {
  const client = createClient();

  test.each([
    [
      "an extension without an id",
      () => http.get(WORKSPACE_EXTENSIONS, () => HttpResponse.json([{}])),
      () => client.findExtension({ workspaceId: "w" }),
    ],
    [
      "a plan without an id",
      () =>
        http.post(UPGRADE_PREVIEW, () =>
          HttpResponse.json({ plan: { operation: "upgrade" } }),
        ),
      () => client.planUpgrade({ extensionId: "ext-1" }),
    ],
  ])("rejects %s", async (_, handler, call) => {
    apiServer.use(handler());

    await expect(call()).rejects.toThrow("unexpected answer");
  });
});
