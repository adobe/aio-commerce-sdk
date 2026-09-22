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
const NOTIFY_URL = `${BASE_URL}/v1/extensions:notify-upgrade`;

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
    token: "service-token",
  });
}

describe("createUpgradeNotifyClient", () => {
  test("posts the notification with the service token and returns the record id", async () => {
    let capturedAuth: string | null = null;
    let capturedBody: unknown;

    apiServer.use(
      http.post(NOTIFY_URL, async ({ request }) => {
        capturedAuth = request.headers.get("Authorization");
        capturedBody = await request.json();
        return HttpResponse.json(
          { extensionId: "record-1", id: "run-1" },
          { status: 202 },
        );
      }),
    );

    const result = await createClient().notify(REQUEST);

    expect(result).toEqual({ extensionId: "record-1" });
    expect(capturedAuth).toBe("Bearer service-token");
    expect(capturedBody).toEqual(REQUEST);
  });

  test("throws CamsRecordNotFoundError when the workspace has no record (404)", async () => {
    apiServer.use(
      http.post(NOTIFY_URL, () => new HttpResponse(null, { status: 404 })),
    );

    await expect(createClient().notify(REQUEST)).rejects.toBeInstanceOf(
      CamsRecordNotFoundError,
    );
  });

  test("throws CamsUnavailableError when the service errors (5xx)", async () => {
    apiServer.use(
      http.post(NOTIFY_URL, () => new HttpResponse(null, { status: 500 })),
    );

    await expect(createClient().notify(REQUEST)).rejects.toBeInstanceOf(
      CamsUnavailableError,
    );
  });

  test("throws CamsUnavailableError when the notification is rejected (409)", async () => {
    apiServer.use(
      http.post(NOTIFY_URL, () => new HttpResponse(null, { status: 409 })),
    );

    await expect(createClient().notify(REQUEST)).rejects.toBeInstanceOf(
      CamsUnavailableError,
    );
  });
});
