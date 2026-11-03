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

import { describe, expect, test } from "vitest";

import {
  buildWebhookIdPrefix,
  resolveDeveloperConsoleOAuthCredentials,
} from "#management/domains/webhooks/utils";
import { createMockInstallationParams } from "#test/fixtures/installation";

const BASE_IMS_PARAMS = createMockInstallationParams({
  AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "client-id",
  AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: "client-secret",
  AIO_COMMERCE_AUTH_IMS_ORG_ID: "org-id",
  AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "tech-account-id",
});
describe("resolveDeveloperConsoleOAuthCredentials", () => {
  test("returns credentials object when all values are present (string secret)", () => {
    const result = resolveDeveloperConsoleOAuthCredentials(BASE_IMS_PARAMS);

    expect(result).toEqual({
      client_id: "client-id",
      client_secret: "client-secret",
      environment: "production",
      org_id: "org-id",
    });
  });

  test("returns credentials object using first element when secrets is a real array", () => {
    const result = resolveDeveloperConsoleOAuthCredentials({
      ...BASE_IMS_PARAMS,
      AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: [
        "primary-secret",
        "secondary-secret",
      ],
    });

    expect(result).toEqual({
      client_id: "client-id",
      client_secret: "primary-secret",
      environment: "production",
      org_id: "org-id",
    });
  });

  test("returns credentials using first element when secrets is a JSON-stringified array", () => {
    const result = resolveDeveloperConsoleOAuthCredentials({
      ...BASE_IMS_PARAMS,
      AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS:
        '["primary-secret","secondary-secret"]',
    });

    expect(result).toEqual({
      client_id: "client-id",
      client_secret: "primary-secret",
      environment: "production",
      org_id: "org-id",
    });
  });

  test("sets environment to production when AIO_COMMERCE_AUTH_IMS_ENVIRONMENT starts with prod", () => {
    const result = resolveDeveloperConsoleOAuthCredentials({
      ...BASE_IMS_PARAMS,
      AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: "prod",
    });

    expect(result.environment).toBe("production");
  });

  test("sets environment to production when AIO_COMMERCE_AUTH_IMS_ENVIRONMENT is production", () => {
    const result = resolveDeveloperConsoleOAuthCredentials({
      ...BASE_IMS_PARAMS,
      AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: "production",
    });

    expect(result.environment).toBe("production");
  });

  test("sets environment to staging when AIO_COMMERCE_AUTH_IMS_ENVIRONMENT does not start with prod", () => {
    const result = resolveDeveloperConsoleOAuthCredentials({
      ...BASE_IMS_PARAMS,
      AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: "stage",
    });

    expect(result.environment).toBe("staging");
  });

  test("defaults environment to production when AIO_COMMERCE_AUTH_IMS_ENVIRONMENT is absent", () => {
    const result = resolveDeveloperConsoleOAuthCredentials(BASE_IMS_PARAMS);

    expect(result.environment).toBe("production");
  });

  test("defaults environment to production when AIO_COMMERCE_AUTH_IMS_ENVIRONMENT is empty", () => {
    const result = resolveDeveloperConsoleOAuthCredentials({
      ...BASE_IMS_PARAMS,
      AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: "",
    });

    expect(result.environment).toBe("production");
  });

  test("throws when one of the IMS credential fields is empty", () => {
    expect(() =>
      resolveDeveloperConsoleOAuthCredentials({
        ...BASE_IMS_PARAMS,
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "",
      }),
    ).toThrow(Error);
  });
});

describe("buildWebhookIdPrefix", () => {
  test.each([
    [
      "should append a trailing underscore to a clean lowercase id",
      "my-app",
      "my_app_",
    ],
    ["should lowercase an uppercase id", "MyApp", "myapp_"],
    ["should lowercase a mixed-case id", "MyMixedApp", "mymixedapp_"],
    [
      "should replace non-identifier characters with underscores",
      "my--app.v2",
      "my_app_v2_",
    ],
    [
      "should lowercase and replace non-identifier characters",
      "My--App.V2",
      "my_app_v2_",
    ],
    [
      "should preserve a trailing underscore without doubling it",
      "my-app-",
      "my_app_",
    ],
  ] as const)("%s", (_desc, appId, expected) => {
    expect(buildWebhookIdPrefix(appId)).toBe(expected);
  });
});
