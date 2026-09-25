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

import { describe, expect, test, vi } from "vitest";

import { getServiceToken, getUserToken } from "#aio/auth";
import { withAioConfig } from "#test/fixtures/aio-config";

const { getTokenMock } = vi.hoisted(() => ({
  getTokenMock: vi.fn(),
}));

// We mock the external boundary. `getToken` performs a network request.
vi.mock("@adobe/aio-lib-ims", async (importOriginal) => {
  const actual = await importOriginal<{ default: object }>();
  return { default: { ...actual.default, getToken: getTokenMock } };
});

describe("getUserToken", () => {
  test("gets a token for the current IMS context", async () => {
    getTokenMock.mockReset().mockResolvedValue("my-token");

    await withAioConfig(
      { ims: { config: { current: "my-context" } } },
      async () => {
        await expect(getUserToken()).resolves.toBe("my-token");
        expect(getTokenMock).toHaveBeenCalledWith("my-context", {});
      },
    );
  });

  test("falls back to the 'cli' context when there is no current context", async () => {
    getTokenMock.mockReset().mockResolvedValue("my-token");

    await withAioConfig({}, async () => {
      await getUserToken();
      expect(getTokenMock).toHaveBeenCalledWith("cli", {});
    });
  });
});

describe("getServiceToken", () => {
  test("gets a token for the workspace OAuth server-to-server credential", async () => {
    getTokenMock.mockReset().mockResolvedValue("service-token");

    await withAioConfig(
      {
        project: {
          workspace: {
            details: {
              credentials: [
                { integration_type: "apikey", name: "api-key-cred" },
                {
                  integration_type: "oauth_server_to_server",
                  name: "s2s-cred",
                },
              ],
            },
          },
        },
      },
      async () => {
        await expect(getServiceToken()).resolves.toBe("service-token");
        expect(getTokenMock).toHaveBeenCalledWith("s2s-cred", {});
      },
    );
  });

  test("throws when the workspace has no server-to-server credential", async () => {
    getTokenMock.mockReset();

    await withAioConfig(
      {
        project: {
          workspace: {
            details: {
              credentials: [{ integration_type: "apikey", name: "x" }],
            },
          },
        },
      },
      async () => {
        await expect(getServiceToken()).rejects.toThrow(
          "No OAuth server-to-server credential",
        );
        expect(getTokenMock).not.toHaveBeenCalled();
      },
    );
  });
});
