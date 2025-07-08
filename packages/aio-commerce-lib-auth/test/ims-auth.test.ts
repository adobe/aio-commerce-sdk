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

import { getData, getError } from "@adobe/aio-commerce-lib-core";
import { getToken } from "@adobe/aio-lib-ims";
import { describe, expect, test, vi } from "vitest";
import { getImsAuthProvider, tryGetImsAuthProvider } from "~/lib/ims-auth";
import {
  IMS_AUTH_ENV,
  type ImsAuthParamsInput,
} from "~/lib/ims-auth/ims-auth-types";

vi.mock("@adobe/aio-lib-ims", async () => ({
  context: (await vi.importActual("@adobe/aio-lib-ims")).context,
  getToken: vi.fn(),
}));

describe("ims auth", () => {
  describe("getImsAuthProvider", () => {
    test("should export token", async () => {
      const authToken = "supersecrettoken";
      vi.mocked(getToken).mockResolvedValue(authToken);

      const config = {
        client_id: "test-client-id",
        client_secrets: ["supersecret"],
        technical_account_id: "test-technical-account-id",
        technical_account_email: "test-email@example.com",
        ims_org_id: "test-org-id",
        scopes: ["scope1", "scope2"],
        environment: IMS_AUTH_ENV.PROD,
        context: "test-context",
      };
      const imsAuthProvider = await getImsAuthProvider(config);

      expect(imsAuthProvider).toBeDefined();

      const retrievedToken = await imsAuthProvider.getAccessToken();
      expect(getData(retrievedToken)).toEqual(authToken);

      const headers = getData(await imsAuthProvider.getHeaders());
      expect(headers).toHaveProperty("Authorization", `Bearer ${authToken}`);
      expect(headers).toHaveProperty("x-api-key", config.client_id);
    });
  });

  describe("tryGetImsAuthProvider", () => {
    const params = {
      AIO_COMMERCE_IMS_CLIENT_ID: "test-client-id",
      AIO_COMMERCE_IMS_CLIENT_SECRETS: JSON.stringify(["supersecret"]),
      AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
      AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
      AIO_COMMERCE_IMS_IMS_ORG_ID: "test-org-id",
      AIO_COMMERCE_IMS_SCOPES: JSON.stringify(["scope1", "scope2"]),
    } satisfies ImsAuthParamsInput;

    test("should export token when all required params are provided", async () => {
      const authToken = "supersecrettoken";
      vi.mocked(getToken).mockResolvedValue(authToken);

      const imsAuthProvider = getData(await tryGetImsAuthProvider(params));
      const retrievedToken = getData(await imsAuthProvider.getAccessToken());
      expect(retrievedToken).toEqual(authToken);

      const headers = getData(await imsAuthProvider.getHeaders());
      expect(headers).toHaveProperty("Authorization", `Bearer ${authToken}`);
      expect(headers).toHaveProperty(
        "x-api-key",
        params.AIO_COMMERCE_IMS_CLIENT_ID,
      );
    });

    test("should return a ValidationError", async () => {
      const result = await tryGetImsAuthProvider(
        {} as unknown as ImsAuthParamsInput,
      );
      expect(() => getData(result)).toThrow("Cannot get data from a Failure");
      expect(getError(result)).toBeDefined();
      expect(getError(result)._tag).toEqual("ValidationError");
    });

    test.each([
      "AIO_COMMERCE_IMS_CLIENT_ID",
      "AIO_COMMERCE_IMS_CLIENT_SECRETS",
      "AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_ID",
      "AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_EMAIL",
      "AIO_COMMERCE_IMS_IMS_ORG_ID",
      "AIO_COMMERCE_IMS_SCOPES",
    ])("should throw error when %s is missing", async (param) => {
      const result = await tryGetImsAuthProvider({
        ...params,
        [param]: undefined,
      } satisfies ImsAuthParamsInput);

      expect(() => getData(result)).toThrow("Cannot get data from a Failure");
      expect(getError(result)._tag).toEqual("ValidationError");
      expect(getError(result).message).toEqual(
        "Failed to validate the provided IMS parameters. See the console for more details.",
      );
      expect(getError(result)).toHaveProperty(
        "issues.[0].message",
        "Missing or invalid ims auth parameter string",
      );
    });

    test.each([
      ["[test, foo]", "AIO_COMMERCE_IMS_SCOPES"],
      ['[{test: "foo"}]', "AIO_COMMERCE_IMS_SCOPES"],
      ['["test"', "AIO_COMMERCE_IMS_SCOPES"],
      ["[test, foo]", "AIO_COMMERCE_IMS_CLIENT_SECRETS"],
      ['[{test: "foo"}]', "AIO_COMMERCE_IMS_CLIENT_SECRETS"],
      ['["test"', "AIO_COMMERCE_IMS_CLIENT_SECRETS"],
    ])(`should throw error when given %s as %s input"`, async (param, key) => {
      const result = await tryGetImsAuthProvider({
        ...params,
        [key]: param,
      } as ImsAuthParamsInput);

      expect(() => getData(result)).toThrow("Cannot get data from a Failure");
      expect(getError(result)._tag).toEqual("ValidationError");
      expect(getError(result).message).toEqual(
        "Failed to validate the provided IMS parameters. See the console for more details.",
      );
    });
  });
});
