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

import { unwrap, unwrapErr } from "@adobe/aio-commerce-lib-core/result";
import { getToken } from "@adobe/aio-lib-ims";

import type { InferInput } from "valibot";
import { describe, expect, test, vi } from "vitest";

import {
  getImsAuthProvider,
  tryGetImsAuthProvider,
} from "~/lib/ims-auth/provider";

import { IMS_AUTH_ENV, type ImsAuthParamsSchema } from "~/lib/ims-auth/schema";

vi.mock("@adobe/aio-lib-ims", async () => ({
  context: (await vi.importActual("@adobe/aio-lib-ims")).context,
  getToken: vi.fn(),
}));

describe("IMS Authentication", () => {
  describe("getImsAuthProvider", () => {
    test("should export token", async () => {
      const authToken = "supersecrettoken";
      vi.mocked(getToken).mockResolvedValue(authToken);

      const config = {
        clientId: "test-client-id",
        clientSecrets: ["supersecret"],
        technicalAccountId: "test-technical-account-id",
        technicalAccountEmail: "test-email@example.com",
        imsOrgId: "test-org-id",
        scopes: ["scope1", "scope2"],
        environment: IMS_AUTH_ENV.PROD,
        context: "test-context",
      };

      const imsAuthProvider = getImsAuthProvider(config);
      expect(imsAuthProvider).toBeDefined();

      const retrievedToken = await imsAuthProvider.getAccessToken();
      expect(unwrap(retrievedToken)).toEqual(authToken);

      const headers = unwrap(await imsAuthProvider.getHeaders());
      expect(headers).toHaveProperty("Authorization", `Bearer ${authToken}`);
      expect(headers).toHaveProperty("x-api-key", config.clientId);
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
    } satisfies InferInput<typeof ImsAuthParamsSchema>;

    test("should export token when all required params are provided", async () => {
      const authToken = "supersecrettoken";
      vi.mocked(getToken).mockResolvedValue(authToken);

      const imsAuthProvider = unwrap(tryGetImsAuthProvider(params));
      const retrievedToken = unwrap(await imsAuthProvider.getAccessToken());
      expect(retrievedToken).toEqual(authToken);

      const headers = unwrap(await imsAuthProvider.getHeaders());
      expect(headers).toHaveProperty("Authorization", `Bearer ${authToken}`);
      expect(headers).toHaveProperty(
        "x-api-key",
        params.AIO_COMMERCE_IMS_CLIENT_ID,
      );
    });

    test("should err with invalid params", () => {
      const result = unwrapErr(
        tryGetImsAuthProvider(
          {} as unknown as InferInput<typeof ImsAuthParamsSchema>,
        ),
      );

      expect(result).toHaveProperty("_tag", "ImsAuthValidationError");
      expect(result).toHaveProperty("issues", expect.any(Array));
    });

    test.each([
      "AIO_COMMERCE_IMS_CLIENT_ID",
      "AIO_COMMERCE_IMS_CLIENT_SECRETS",
      "AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_ID",
      "AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_EMAIL",
      "AIO_COMMERCE_IMS_IMS_ORG_ID",
      "AIO_COMMERCE_IMS_SCOPES",
    ])("should throw error when %s is missing", (param) => {
      const result = tryGetImsAuthProvider({
        ...params,
        [param]: undefined,
      } satisfies InferInput<typeof ImsAuthParamsSchema>);

      expect(() => unwrap(result)).toThrow();

      const error = unwrapErr(result);
      expect(error._tag).toEqual("ImsAuthValidationError");
      expect(error.message).toEqual(
        "Failed to validate the provided IMS parameters",
      );

      expect(error.issues).toHaveLength(1);
      expect(error.issues[0].message).toEqual(
        `Expected a string value for the IMS auth parameter ${param}`,
      );
    });

    test.each([
      ["[test, foo]", "AIO_COMMERCE_IMS_SCOPES"],
      ['[{test: "foo"}]', "AIO_COMMERCE_IMS_SCOPES"],
      ['["test"', "AIO_COMMERCE_IMS_SCOPES"],
      ["[test, foo]", "AIO_COMMERCE_IMS_CLIENT_SECRETS"],
      ['[{test: "foo"}]', "AIO_COMMERCE_IMS_CLIENT_SECRETS"],
      ['["test"', "AIO_COMMERCE_IMS_CLIENT_SECRETS"],
    ])(`should throw error when given %s as %s input"`, (param, key) => {
      const result = tryGetImsAuthProvider({
        ...params,
        [key]: param,
      } satisfies InferInput<typeof ImsAuthParamsSchema>);

      expect(() => unwrap(result)).toThrow();

      const error = unwrapErr(result);
      expect(error._tag).toEqual("ImsAuthValidationError");
      expect(error.issues).toHaveLength(1);
      expect(error.issues[0].message).toEqual(
        `An error ocurred while parsing the JSON string array parameter ${key}`,
      );
    });
  });
});
