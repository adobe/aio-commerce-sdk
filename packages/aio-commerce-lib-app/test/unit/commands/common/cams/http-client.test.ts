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

import ky from "ky";
import { describe, expect, test, vi } from "vitest";

import {
  CAMS_REQUEST_TIMEOUT_MS,
  PROD_CAMS_URL,
} from "#commands/common/cams/config";
import { CamsHttpClient } from "#commands/common/cams/http-client";

vi.mock("ky", async (importOriginal) => {
  const original = await importOriginal<typeof import("ky")>();
  return {
    ...original,
    default: Object.assign(
      vi.fn((...args: unknown[]) =>
        Reflect.apply(original.default, undefined, args),
      ),
      original.default,
      { create: vi.fn(original.default.create) },
    ),
  };
});

const ORG = { id: "org-id", ims_org_id: "ims-org-id", name: "org-name" };

describe("CamsHttpClient", () => {
  test("uses the production host when the config has no base URL", () => {
    const client = new CamsHttpClient({
      auth: { getToken: async () => "token", org: ORG },
    });

    expect(client.config.baseUrl).toBe(PROD_CAMS_URL);
  });

  test("creates the HTTP client with a 60 second timeout", () => {
    const client = new CamsHttpClient({
      auth: { getToken: async () => "token", org: ORG },
    });

    expect(client).toBeDefined();
    expect(CAMS_REQUEST_TIMEOUT_MS).toBe(60_000);
    expect(ky.create).toHaveBeenCalledWith(
      expect.objectContaining({ timeout: 60_000 }),
    );
  });
});
