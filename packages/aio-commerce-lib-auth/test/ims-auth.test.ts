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

import { getImsAuthProviderWithParams } from "~/lib/ims-auth";
import type { ImsAuthParamsInput } from "~/lib/ims-auth/ims-auth-types";
import { getData, getError, isSuccess } from "~/lib/result";

vi.mock("@adobe/aio-lib-ims", async () => ({
  context: (await vi.importActual("@adobe/aio-lib-ims")).context,
  getToken: vi.fn(),
}));

describe("getImsAuthProviderWithParams", () => {
  const params = {
    AIO_COMMERCE_IMS_CLIENT_ID: "test-client-id",
    AIO_COMMERCE_IMS_CLIENT_SECRETS: JSON.stringify(["supersecret"]),
    AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
    AIO_COMMERCE_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
    AIO_COMMERCE_IMS_IMS_ORG_ID: "test-org-id",
    AIO_COMMERCE_IMS_SCOPES: JSON.stringify(["scope1", "scope2"]),
  } as ImsAuthParamsInput;

  test("should export token when all required params are provided", async () => {
    const authToken = "supersecrettoken";
    vi.mocked(getToken).mockResolvedValue(authToken);

    const result = await getImsAuthProviderWithParams(params);
    expect(isSuccess(result)).toBeTruthy();
    expect(getData(result)).toBeDefined();
    expect(() => getError(result)).toThrow("Cannot get error from a Success");

    const retrievedToken = await result.value.getAccessToken();
    expect(retrievedToken).toEqual(authToken);

    const headers = await result.value.getHeaders();
    expect(headers).toHaveProperty("Authorization", `Bearer ${authToken}`);
    expect(headers).toHaveProperty(
      "x-api-key",
      params.AIO_COMMERCE_IMS_CLIENT_ID,
    );
  });

  test("should return a ValidationError", async () => {
    const result = await getImsAuthProviderWithParams(
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
    const result = await getImsAuthProviderWithParams({
      ...params,
      [param]: undefined,
    } as ImsAuthParamsInput);

    expect(() => getData(result)).toThrow("Cannot get data from a Failure");
    expect(getError(result)._tag).toEqual("ValidationError");
    expect(getError(result).message).toEqual(
      "Failed to validate the provided IMS parameters. See the console for more details.",
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
    const result = await getImsAuthProviderWithParams({
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
