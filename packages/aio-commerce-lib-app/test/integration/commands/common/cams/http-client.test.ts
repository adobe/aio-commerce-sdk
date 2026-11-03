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
import { describe, expect, test, vi } from "vitest";

import { CamsHttpClient } from "#commands/common/cams/http-client";
import { apiServer, setupApiTestLifecycle } from "#test/setup/api";

const BASE_URL = "https://service.example.com";
const ORG = { id: "org-id", ims_org_id: "ims-org-id", name: "org-name" };

setupApiTestLifecycle();

describe("CamsHttpClient", () => {
  test("sends a fresh user token, the IMS organization id and the fetch options with every request", async () => {
    const received: Request[] = [];
    apiServer.use(
      http.get(`${BASE_URL}/ping`, ({ request }) => {
        received.push(request);
        return HttpResponse.json({});
      }),
    );
    const getToken = vi
      .fn()
      .mockResolvedValueOnce("first")
      .mockResolvedValueOnce("second");

    const client = new CamsHttpClient({
      auth: { getToken, org: ORG },
      config: { baseUrl: BASE_URL },
      fetchOptions: { headers: { "x-extra": "1" } },
    });
    await client.get("ping");
    await client.get("ping");

    expect(received.map((r) => r.headers.get("authorization"))).toEqual([
      "Bearer first",
      "Bearer second",
    ]);
    expect(received[0].headers.get("x-org-id")).toBe("ims-org-id");
    expect(received[0].headers.get("x-extra")).toBe("1");
    expect(received[0].headers.has("x-ac-url")).toBe(false);
    expect(received[0].headers.has("x-ac-env")).toBe(false);
  });

  test("sends configured instance headers alongside request headers", async () => {
    const received: Request[] = [];
    apiServer.use(
      http.get(`${BASE_URL}/ping`, ({ request }) => {
        received.push(request);
        return HttpResponse.json({});
      }),
    );
    const client = new CamsHttpClient({
      auth: { getToken: async () => "token", org: ORG },
      config: {
        baseUrl: BASE_URL,
        commerceInstance: {
          baseUrl: "https://commerce.example.com",
          env: "saas",
        },
      },
    });

    await client.get("ping", { headers: { "x-extra": "preserved" } });

    expect(received.at(0)?.headers.get("x-ac-url")).toBe(
      "https://commerce.example.com",
    );
    expect(received.at(0)?.headers.get("x-ac-env")).toBe("saas");
    expect(received.at(0)?.headers.get("x-extra")).toBe("preserved");
  });

  test("fails without sending the request when the token cannot be read", async () => {
    const requests = vi.fn();
    apiServer.events.on("request:start", requests);
    const cause = new Error("The token was refused");
    const getToken = vi.fn().mockRejectedValue(cause);

    const client = new CamsHttpClient({
      auth: { getToken, org: ORG },
      config: { baseUrl: BASE_URL },
    });

    await expect(client.get("ping")).rejects.toMatchObject({
      cause,
      message: "The token was refused",
      retryable: false,
    });
    expect(requests).not.toHaveBeenCalled();
    expect(getToken).toHaveBeenCalledTimes(1);
    apiServer.events.removeAllListeners();
  });
});
