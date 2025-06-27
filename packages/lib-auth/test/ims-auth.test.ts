/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { getToken } from "@adobe/aio-lib-ims";
import { describe, expect, test, vi } from "vitest";

import { getImsAuthProvider, type ImsAuthParams } from "~/lib/ims-auth";

vi.mock("@adobe/aio-lib-ims", async () => ({
  context: (await vi.importActual("@adobe/aio-lib-ims")).context,
  getToken: vi.fn(),
}));

describe("getImsAuthProvider", () => {
  const params: ImsAuthParams = {
    AIO_COMMERCE_IMS_CLIENT_ID: "test-client-id",
    AIO_COMMERCE_IMS_CLIENT_SECRETS: JSON.stringify(["supersecret"]),
    AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
    AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
    AIO_COMMERCE_IMS_IMS_ORG_ID: "test-org-id",
    AIO_COMMERCE_IMS_SCOPES: JSON.stringify(["scope1", "scope2"]),
  };

  test("should export token when all required params are provided", async () => {
    const authToken = "supersecrettoken";
    vi.mocked(getToken).mockResolvedValue(authToken);

    const imsProvider = await getImsAuthProvider(params);
    expect(imsProvider).toBeDefined();

    const retrievedToken = await imsProvider?.getAccessToken();
    expect(retrievedToken).toEqual(authToken);

    const headers = await imsProvider?.getHeaders();
    expect(headers).toHaveProperty("Authorization", `Bearer ${authToken}`);
    expect(headers).toHaveProperty(
      "x-api-key",
      params.AIO_COMMERCE_IMS_CLIENT_ID,
    );
  });

<<<<<<< HEAD:packages/lib-auth/test/ims-auth.ts
  [
    "AIO_COMMERCE_IMS_CLIENT_ID",
    "AIO_COMMERCE_IMS_CLIENT_SECRETS",
    "AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_ID",
    "AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_EMAIL",
    "AIO_COMMERCE_IMS_IMS_ORG_ID",
    "AIO_COMMERCE_IMS_SCOPES",
  ].forEach((param) => {
=======
  for (const param of [
    "OAUTH_CLIENT_ID",
    "OAUTH_CLIENT_SECRETS",
    "OAUTH_TECHNICAL_ACCOUNT_ID",
    "OAUTH_TECHNICAL_ACCOUNT_EMAIL",
    "OAUTH_IMS_ORG_ID",
    "OAUTH_SCOPES",
  ]) {
>>>>>>> 87c1283 (test(lib-auth): refactor for vitest):packages/lib-auth/test/ims-auth.test.ts
    test(`should return undefined when ${param} is missing`, async () => {
      const incompleteParams = {
        ...params,
        [param]: undefined,
      };

      const imsProvider = await getImsAuthProvider(incompleteParams);
      expect(imsProvider).toBeUndefined();
    });
  }
});
