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

import aioLibIms from "@adobe/aio-lib-ims";
import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  assertImsAuthParams,
  getImsAuthProvider,
} from "~/lib/ims-auth/provider";

import type { ImsAuthEnv, ImsAuthParams } from "~/lib/ims-auth/schema";

const { context, getToken } = aioLibIms;

vi.mock("@adobe/aio-lib-ims", () => ({
  default: {
    context: {
      set: vi.fn(),
    },
    getToken: vi.fn(),
  },
}));

describe("aio-commerce-lib-auth/ims-auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
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
        environment: "prod" as const,
        context: "test-context",
      };

      const imsAuthProvider = getImsAuthProvider(config);
      expect(imsAuthProvider).toBeDefined();

      const retrievedToken = await imsAuthProvider.getAccessToken();
      expect(retrievedToken).toEqual(authToken);

      const headers = await imsAuthProvider.getHeaders();
      expect(headers).toHaveProperty("Authorization", `Bearer ${authToken}`);
      expect(headers).toHaveProperty("x-api-key", config.clientId);
    });

    test("should call context.set with valid context and config", async () => {
      const authToken = "supersecrettoken";
      vi.mocked(getToken).mockResolvedValue(authToken);
      vi.mocked(context.set).mockResolvedValue(undefined);

      const config = {
        clientId: "test-client-id",
        clientSecrets: ["supersecret"],
        technicalAccountId: "test-technical-account-id",
        technicalAccountEmail: "test-email@example.com",
        imsOrgId: "test-org-id",
        scopes: ["scope1", "scope2"],
        environment: "prod" as const,
        context: "test-context",
      };

      const imsAuthProvider = getImsAuthProvider(config);
      await imsAuthProvider.getAccessToken();

      expect(context.set).toHaveBeenCalledWith(
        "test-context",
        expect.objectContaining({
          scopes: ["scope1", "scope2"],
          env: "prod",
          context: "test-context",
          client_id: "test-client-id",
          client_secrets: ["supersecret"],
          technical_account_id: "test-technical-account-id",
          technical_account_email: "test-email@example.com",
          ims_org_id: "test-org-id",
        }),
      );
    });

    test("should use default context when not provided", async () => {
      const authToken = "supersecrettoken";
      vi.mocked(getToken).mockResolvedValue(authToken);
      vi.mocked(context.set).mockResolvedValue(undefined);

      const config: ImsAuthParams = {
        clientId: "test-client-id",
        clientSecrets: ["supersecret"],
        technicalAccountId: "test-technical-account-id",
        technicalAccountEmail: "test-email@example.com",
        imsOrgId: "test-org-id",
        scopes: ["scope1", "scope2"],
        environment: "prod" as const,
      };

      const imsAuthProvider = getImsAuthProvider(config);
      await imsAuthProvider.getAccessToken();

      expect(context.set).toHaveBeenCalledWith(
        "aio-commerce-lib-auth-creds",
        expect.objectContaining({
          scopes: ["scope1", "scope2"],
          env: "prod",
          context: "aio-commerce-lib-auth-creds",
          client_id: "test-client-id",
          client_secrets: ["supersecret"],
          technical_account_id: "test-technical-account-id",
          technical_account_email: "test-email@example.com",
          ims_org_id: "test-org-id",
        }),
      );
    });
  });

  describe("getImsAuthProvider error handling", () => {
    test("should handle when getToken throws an error", async () => {
      const errorMessage = "IMS service unavailable";
      vi.mocked(getToken).mockRejectedValue(new Error(errorMessage));

      const config = {
        clientId: "test-client-id",
        clientSecrets: ["supersecret"],
        technicalAccountId: "test-technical-account-id",
        technicalAccountEmail: "test-email@example.com",
        imsOrgId: "test-org-id",
        scopes: ["scope1", "scope2"],
        environment: "prod" as const,
        context: "test-context",
      };

      const imsAuthProvider = getImsAuthProvider(config);
      await expect(imsAuthProvider.getAccessToken()).rejects.toThrow(
        errorMessage,
      );

      await expect(imsAuthProvider.getHeaders()).rejects.toThrow(errorMessage);
    });
  });

  describe("assertImsAuthParams", () => {
    test("should not throw with valid params", () => {
      expect(() => {
        assertImsAuthParams({
          clientId: "test-client-id",
          clientSecrets: ["supersecret"],
          technicalAccountId: "test-technical-account-id",
          technicalAccountEmail: "test-email@example.com",
          imsOrgId: "test-org-id",
          scopes: ["scope1", "scope2"],
          environment: "prod" as const,
          context: "test-context",
        });
      }).not.toThrow();

      expect(() => {
        assertImsAuthParams({
          clientId: "test-client-id",
          clientSecrets: ["supersecret"],
          technicalAccountId: "test-technical-account-id",
          technicalAccountEmail: "test-email@example.com",
          imsOrgId: "test-org-id",
          scopes: ["scope1", "scope2"],
        });
      }).not.toThrow();
    });

    test("should throw CommerceSdkValidationError when invalid", () => {
      expect(() => {
        assertImsAuthParams({});
      }).toThrow("Invalid ImsAuthProvider configuration");
    });
  });

  describe("assertImsAuthParams edge cases", () => {
    const validConfig = {
      clientId: "test-client-id",
      clientSecrets: ["supersecret"],
      technicalAccountId: "test-technical-account-id",
      technicalAccountEmail: "test-email@example.com",
      imsOrgId: "test-org-id",
      scopes: ["scope1", "scope2"],
      environment: "prod" as const,
      context: "test-context",
    };

    test("should throw with missing clientId", () => {
      const { clientId: _, ...configWithoutClientId } = validConfig;
      expect(() => {
        assertImsAuthParams(configWithoutClientId);
      }).toThrow("Invalid ImsAuthProvider configuration");
    });

    test("should throw with empty clientSecrets array", () => {
      expect(() => {
        assertImsAuthParams({
          ...validConfig,
          clientSecrets: [],
        });
      }).toThrow("Invalid ImsAuthProvider configuration");
    });

    test("should throw with invalid email format", () => {
      expect(() => {
        assertImsAuthParams({
          ...validConfig,
          technicalAccountEmail: "not-an-email",
        });
      }).toThrow("Invalid ImsAuthProvider configuration");
    });

    test("should accept any valid email format", () => {
      expect(() => {
        assertImsAuthParams({
          ...validConfig,
          technicalAccountEmail: "test@example.com",
        });
      }).not.toThrow();

      expect(() => {
        assertImsAuthParams({
          ...validConfig,
          technicalAccountEmail: "user@company.org",
        });
      }).not.toThrow();
    });

    test("should throw with invalid environment value", () => {
      expect(() => {
        assertImsAuthParams({
          ...validConfig,
          environment: "invalid-env" as unknown as ImsAuthEnv,
        });
      }).toThrow("Invalid ImsAuthProvider configuration");
    });

    test("should throw with empty scopes array", () => {
      expect(() => {
        assertImsAuthParams({
          ...validConfig,
          scopes: [],
        });
      }).toThrow("Invalid ImsAuthProvider configuration");
    });

    test("should throw with wrong data types", () => {
      expect(() => {
        assertImsAuthParams({
          ...validConfig,
          clientId: 123,
          clientSecrets: "not-an-array",
          technicalAccountId: true,
        } as unknown as ImsAuthParams);
      }).toThrow("Invalid ImsAuthProvider configuration");
    });

    test("should handle extra unknown properties", () => {
      expect(() => {
        assertImsAuthParams({
          ...validConfig,
          extraProperty: "should-be-ignored",
          anotherExtra: 123,
        });
      }).not.toThrow();
    });

    test("should throw with null values", () => {
      expect(() => {
        assertImsAuthParams({
          ...validConfig,
          clientId: null,
        } as unknown as ImsAuthParams);
      }).toThrow("Invalid ImsAuthProvider configuration");
    });

    test.each([
      ["clientId", { clientId: undefined }],
      ["clientSecrets", { clientSecrets: undefined }],
      ["technicalAccountId", { technicalAccountId: undefined }],
      ["technicalAccountEmail", { technicalAccountEmail: undefined }],
      ["imsOrgId", { imsOrgId: undefined }],
      ["scopes", { scopes: undefined }],
    ])("should throw when %s is missing", (_field, overrides) => {
      expect(() => {
        assertImsAuthParams({
          ...validConfig,
          ...overrides,
        });
      }).toThrow("Invalid ImsAuthProvider configuration");
    });
  });
});
