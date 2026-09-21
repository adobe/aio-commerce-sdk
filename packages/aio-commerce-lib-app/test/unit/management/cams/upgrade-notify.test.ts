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
import { describe, expect, test } from "vitest";

import {
  CamsRecordNotFoundError,
  CamsUnavailableError,
} from "#management/cams/errors";
import { createUpgradeNotifyClient } from "#management/cams/upgrade-notify";
import { apiServer, setupApiTestLifecycle } from "#test/setup/api";

import type { NotifyUpgradeRequest } from "#management/cams/upgrade-notify";

const BASE_URL = "https://cams.test";
const LIST_URL = `${BASE_URL}/v1/extensions`;

const IDENTITY = {
  extId: "ext-1",
  workspaceId: "workspace-1",
  workspaceName: "workspace-name",
};

const REQUEST: NotifyUpgradeRequest = {
  metadataId: "ext-1",
  mode: "auto",
  namespace: "runtime-namespace",
  org: { id: "org-1", imsOrgId: "ims-org-1" },
  plan: { to: "2.0.0" },
  workspace: { id: "workspace-1", name: "workspace-name" },
};

setupApiTestLifecycle();

function createClient() {
  return createUpgradeNotifyClient({
    baseUrl: BASE_URL,
    identity: IDENTITY,
    token: "service-token",
  });
}

describe("createUpgradeNotifyClient", () => {
  test("resolves the record id and posts the notification with the service token", async () => {
    let capturedAuth: string | null = null;
    let capturedBody: unknown;
    let capturedListAuth: string | null = null;

    apiServer.use(
      http.get(LIST_URL, ({ request }) => {
        capturedListAuth = request.headers.get("Authorization");
        return HttpResponse.json([
          { extId: "other-app", id: "record-other" },
          { extId: "ext-1", id: "record-1" },
        ]);
      }),
      http.post(
        `${BASE_URL}/v1/extensions/record-1/upgrades:notify`,
        async ({ request }) => {
          capturedAuth = request.headers.get("Authorization");
          capturedBody = await request.json();
          return new HttpResponse(null, { status: 202 });
        },
      ),
    );

    const client = createClient();
    const result = await client.notify(REQUEST);

    expect(result).toEqual({ extensionId: "record-1" });
    expect(capturedListAuth).toBe("Bearer service-token");
    expect(capturedAuth).toBe("Bearer service-token");
    expect(capturedBody).toEqual(REQUEST);
  });

  test("throws CamsRecordNotFoundError when no record matches the app", async () => {
    apiServer.use(
      http.get(LIST_URL, () =>
        HttpResponse.json([{ extId: "other-app", id: "record-other" }]),
      ),
    );

    await expect(createClient().notify(REQUEST)).rejects.toBeInstanceOf(
      CamsRecordNotFoundError,
    );
  });

  test("throws CamsUnavailableError when the lookup fails", async () => {
    apiServer.use(
      http.get(LIST_URL, () => new HttpResponse(null, { status: 500 })),
    );

    await expect(createClient().notify(REQUEST)).rejects.toBeInstanceOf(
      CamsUnavailableError,
    );
  });

  test("throws CamsUnavailableError when the notification is rejected", async () => {
    apiServer.use(
      http.get(LIST_URL, () =>
        HttpResponse.json([{ extId: "ext-1", id: "record-1" }]),
      ),
      http.post(
        `${BASE_URL}/v1/extensions/record-1/upgrades:notify`,
        () => new HttpResponse(null, { status: 409 }),
      ),
    );

    await expect(createClient().notify(REQUEST)).rejects.toBeInstanceOf(
      CamsUnavailableError,
    );
  });
});
