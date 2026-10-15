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
const UPGRADES = `${EXTENSIONS}/ext-1/upgrades`;
const STATUS_URL = `${UPGRADES}/run-1/status`;

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
  const WORKSPACE = { workspaceId: "ws-1", workspaceName: "A B&C" };

  test("looks the workspace up by id and name and returns the first extension", async () => {
    let query: URLSearchParams | undefined;
    apiServer.use(
      http.get(EXTENSIONS, ({ request }) => {
        query = new URL(request.url).searchParams;
        return HttpResponse.json([{ id: "ext-1" }, { id: "ext-2" }]);
      }),
    );

    const extension = await createClient().findExtension(WORKSPACE);

    expect(extension).toMatchObject({ id: "ext-1" });
    expect(Object.fromEntries(query ?? [])).toEqual({
      workspaceId: "ws-1",
      workspaceName: "A B&C",
    });
  });

  test.each([
    ["has no extension", []],
    [
      "belongs to another workspace",
      [{ id: "e", scope: { workspaceId: "x" } }],
    ],
  ])("returns null when the workspace %s", async (_, body) => {
    apiServer.use(http.get(EXTENSIONS, () => HttpResponse.json(body)));

    await expect(createClient().findExtension(WORKSPACE)).resolves.toBeNull();
  });
});

describe("planUpgrade", () => {
  const PLAN = { id: "plan-1", operation: "upgrade", summary: "extra" };

  test("posts without a body and returns the whole plan", async () => {
    let body: string | undefined;
    apiServer.use(
      http.post(`${UPGRADES}/plan`, async ({ request }) => {
        body = await request.text();
        return HttpResponse.json({ plan: PLAN, valid: true }, { status: 201 });
      }),
    );

    await expect(
      createClient().planUpgrade({ extensionId: "ext-1" }),
    ).resolves.toEqual(PLAN);
    expect(body).toBe("");
  });

  test("throws a conflict error that carries the code of a 409 answer", async () => {
    apiServer.use(
      http.post(`${UPGRADES}/plan`, () =>
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
    [
      "a code that is not text",
      () => HttpResponse.json({ code: 409 }, { status: 409 }),
    ],
    ["no JSON", () => new HttpResponse("busy", { status: 409 })],
  ])(
    "throws a conflict error without a code for a 409 answer with %s",
    async (_, answer) => {
      apiServer.use(http.post(`${UPGRADES}/plan`, answer));

      const error = await failureOf(
        createClient().planUpgrade({ extensionId: "ext-1" }),
      );

      expect(error).toBeInstanceOf(CamsConflictError);
      expect((error as CamsConflictError).code).toBeUndefined();
    },
  );
});

describe("startUpgrade", () => {
  test("posts the plan id and returns the new attempt", async () => {
    let body: unknown;
    apiServer.use(
      http.post(UPGRADES, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          { ...RUNNING, activationId: "act-1", status: "pending" },
          { status: 202 },
        );
      }),
    );

    const attempt = await createClient().startUpgrade({
      extensionId: "ext-1",
      planId: "plan-1",
    });

    expect(body).toEqual({ planId: "plan-1" });
    expect(attempt).toEqual({ id: "run-1", status: "pending" });
  });
});

describe("pollUpgrade", () => {
  test("posts without a body to the encoded path and ignores fields it does not know", async () => {
    let received: { body: string; path: string } | undefined;
    apiServer.use(
      http.post(
        `${EXTENSIONS}/:extensionId/upgrades/:runId/status`,
        async ({ request }) => {
          received = {
            body: await request.text(),
            path: new URL(request.url).pathname,
          };

          return HttpResponse.json({ ...RUNNING, step: { nested: true } });
        },
      ),
    );

    const attempt = await createClient().pollUpgrade({
      extensionId: "e/1",
      runId: "r/1",
    });

    expect(attempt).toEqual(RUNNING);
    expect(received).toEqual({
      body: "",
      path: "/v1/extensions/e%2F1/upgrades/r%2F1/status",
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
    apiServer.use(http.post(STATUS_URL, () => HttpResponse.json(body)));

    await expect(createClient().pollUpgrade(IDS)).resolves.toMatchObject(body);
  });

  test.each([
    ["an unknown status", { id: "run-1", status: "done" }],
    ["an error without a key", { error: {}, id: "run-1", status: "failed" }],
    ["no id", { status: "failed" }],
  ])("rejects an answer with %s as unexpected", async (_, body) => {
    apiServer.use(http.post(STATUS_URL, () => HttpResponse.json(body)));

    const error = await failureOf(createClient().pollUpgrade(IDS));

    expect(error).toMatchObject({
      message: expect.stringContaining("unexpected answer"),
      retryable: false,
    });
  });

  test("rejects an answer that is not JSON", async () => {
    apiServer.use(http.post(STATUS_URL, () => new HttpResponse("<html>")));

    await expect(createClient().pollUpgrade(IDS)).rejects.toThrow("not JSON");
  });

  test.each([400, 401, 403, 404, 500, 502, 503])(
    "marks a %s answer as retryable only when it is a 502",
    async (status) => {
      apiServer.use(
        http.post(STATUS_URL, () =>
          HttpResponse.json({ message: "No" }, { status }),
        ),
      );

      const error = await failureOf(createClient().pollUpgrade(IDS));

      expect(error).not.toBeInstanceOf(CamsConflictError);
      expect(error.retryable).toBe(status === 502);
      expect(error.cause).toMatchObject({ response: { status } });
    },
  );

  test("marks a network failure as retryable", async () => {
    apiServer.use(http.post(STATUS_URL, () => HttpResponse.error()));

    const error = await failureOf(createClient().pollUpgrade(IDS));

    expect(error).toBeInstanceOf(CamsClientError);
    expect(error.retryable).toBe(true);
  });

  test("does not retry, even when the client retries POST requests", async () => {
    let requests = 0;
    apiServer.use(
      http.post(STATUS_URL, () => {
        requests += 1;
        return HttpResponse.json({}, { status: 502 });
      }),
    );
    const client = createClient({
      retry: { delay: () => 0, limit: 2, methods: ["post"] },
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
    let limit: string | null = null;
    apiServer.use(
      http.get(UPGRADES, ({ request }) => {
        limit = new URL(request.url).searchParams.get("limit");
        return HttpResponse.json(body);
      }),
    );

    const latest = await createClient().readLatestUpgrade({
      extensionId: "ext-1",
    });

    expect(latest).toEqual(expected);
    expect(limit).toBe("1");
  });
});

describe("parameters", () => {
  const client = createClient();
  const calls = {
    findExtension: () =>
      client.findExtension({ workspaceId: "", workspaceName: "w" }),
    planUpgrade: () => client.planUpgrade({ extensionId: "" }),
    pollUpgrade: () => client.pollUpgrade({ extensionId: "e", runId: "" }),
    readLatestUpgrade: () => client.readLatestUpgrade({ extensionId: "" }),
    startUpgrade: () => client.startUpgrade({ extensionId: "e", planId: "" }),
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
      () => http.get(EXTENSIONS, () => HttpResponse.json([{}])),
      () => client.findExtension({ workspaceId: "w", workspaceName: "n" }),
    ],
    [
      "a plan without an id",
      () =>
        http.post(`${UPGRADES}/plan`, () =>
          HttpResponse.json({ plan: { operation: "upgrade" } }),
        ),
      () => client.planUpgrade({ extensionId: "ext-1" }),
    ],
  ])("rejects %s", async (_, handler, call) => {
    apiServer.use(handler());

    await expect(call()).rejects.toThrow("unexpected answer");
  });
});
