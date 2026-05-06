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

import { describe, expect, it, vi } from "vitest";

import { AdminUiSdkPermissionDeniedError } from "#lib/commerce/admin-ui-sdk-permissions/errors";
import { withAdminUiSdkPermission } from "#lib/commerce/admin-ui-sdk-permissions/with-permission";

import type { AdminUiSdkPermissionClient } from "#lib/commerce/admin-ui-sdk-permissions/types";

function makeClient(allowed: boolean): AdminUiSdkPermissionClient {
  return {
    check: vi.fn().mockResolvedValue(allowed),
    require: vi.fn().mockImplementation((resource: string) => {
      if (!allowed) {
        throw new AdminUiSdkPermissionDeniedError(resource);
      }
    }),
    invalidate: vi.fn(),
  };
}

describe("withAdminUiSdkPermission", () => {
  it("calls the handler with original params when allowed", async () => {
    const handler = vi.fn().mockResolvedValue({ statusCode: 200 });
    const wrapped = withAdminUiSdkPermission(
      "Acme_Promotions::dashboard",
      makeClient(true),
      handler,
    );
    const params = { foo: "bar" };
    const result = await wrapped(params);

    expect(handler).toHaveBeenCalledWith(params);
    expect(result).toEqual({ statusCode: 200 });
  });

  it("returns 403 without calling handler when denied", async () => {
    const handler = vi.fn();
    const wrapped = withAdminUiSdkPermission(
      "Acme_Promotions::dashboard",
      makeClient(false),
      handler,
    );
    const result = await wrapped({ foo: "bar" });

    expect(handler).not.toHaveBeenCalled();
    expect(result).toMatchObject({ statusCode: 403 });
  });

  it("re-throws errors that are not AdminUiSdkPermissionDeniedError", async () => {
    const authError = new Error("network error");
    const errClient: AdminUiSdkPermissionClient = {
      check: vi.fn().mockResolvedValue(false),
      require: vi.fn().mockRejectedValue(authError),
      invalidate: vi.fn(),
    };
    const wrapped = withAdminUiSdkPermission(
      "Acme_Promotions::dashboard",
      errClient,
      vi.fn(),
    );

    await expect(wrapped({})).rejects.toThrow(authError);
  });
});
