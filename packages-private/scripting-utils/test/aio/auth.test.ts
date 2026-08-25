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

import { getUserToken } from "#aio/auth";
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
