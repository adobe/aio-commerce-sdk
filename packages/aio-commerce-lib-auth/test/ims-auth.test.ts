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

import { CommerceSdkValidationError } from "@adobe/aio-commerce-lib-core/error";
import aioLibIms from "@adobe/aio-lib-ims";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { getForwardedImsAuthProvider } from "#lib/ims-auth/forwarding";
import {
  forwardImsAuthProviderFromParams,
  getImsAuthProvider,
  isImsAuthProvider,
} from "#lib/ims-auth/provider";
import { assertImsAuthParams, resolveImsAuthParams } from "#lib/ims-auth/utils";

import type { ImsAuthEnv, ImsAuthParams } from "#lib/ims-auth/schema";

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

    test("should use default environment when not provided", async () => {
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
        context: "test-context",
      };

      const imsAuthProvider = getImsAuthProvider(config);
      await imsAuthProvider.getAccessToken();

      expect(context.set).toHaveBeenCalledWith(
        "test-context",
        expect.objectContaining({
          scopes: ["scope1", "scope2"],
          env: "prod", // Should default to "prod" when environment is undefined
          context: "test-context",
          client_id: "test-client-id",
          client_secrets: ["supersecret"],
          technical_account_id: "test-technical-account-id",
          technical_account_email: "test-email@example.com",
          ims_org_id: "test-org-id",
        }),
      );
    });

    test("should use default environment and context when both are not provided", async () => {
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
      };

      const imsAuthProvider = getImsAuthProvider(config);
      await imsAuthProvider.getAccessToken();

      expect(context.set).toHaveBeenCalledWith(
        "aio-commerce-lib-auth-creds",
        expect.objectContaining({
          scopes: ["scope1", "scope2"],
          env: "prod", // Should default to "prod" when environment is undefined
          context: "aio-commerce-lib-auth-creds",
          client_id: "test-client-id",
          client_secrets: ["supersecret"],
          technical_account_id: "test-technical-account-id",
          technical_account_email: "test-email@example.com",
          ims_org_id: "test-org-id",
        }),
      );
    });

    test("should use stage environment when provided", async () => {
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
        environment: "stage" as const,
        context: "test-context",
      };

      const imsAuthProvider = getImsAuthProvider(config);
      await imsAuthProvider.getAccessToken();

      expect(context.set).toHaveBeenCalledWith(
        "test-context",
        expect.objectContaining({
          scopes: ["scope1", "scope2"],
          env: "stage",
          context: "test-context",
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

    test("should throw with JSON string array for clientSecrets (only arrays accepted)", () => {
      expect(() => {
        assertImsAuthParams({
          ...validConfig,
          clientSecrets: '["secret1","secret2"]',
        });
      }).toThrow("Invalid ImsAuthProvider configuration");
    });

    test("should throw with single string for clientSecrets (only arrays accepted)", () => {
      expect(() => {
        assertImsAuthParams({
          ...validConfig,
          clientSecrets: "single-secret",
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

    test("should throw with JSON string array for scopes (only arrays accepted)", () => {
      expect(() => {
        assertImsAuthParams({
          ...validConfig,
          scopes: '["scope1","scope2"]',
        });
      }).toThrow("Invalid ImsAuthProvider configuration");
    });

    test("should throw with single string for scopes (only arrays accepted)", () => {
      expect(() => {
        assertImsAuthParams({
          ...validConfig,
          scopes: "single-scope",
        });
      }).toThrow("Invalid ImsAuthProvider configuration");
    });

    test("should throw with array containing non-string items for scopes", () => {
      expect(() => {
        const nonStringItem = 123;
        assertImsAuthParams({
          ...validConfig,
          scopes: [nonStringItem, "scope"],
        } as unknown as ImsAuthParams);
      }).toThrow("Invalid ImsAuthProvider configuration");
    });

    test("should throw with null or undefined scopes", () => {
      expect(() => {
        assertImsAuthParams({
          ...validConfig,
          scopes: null,
        } as unknown as ImsAuthParams);
      }).toThrow("Invalid ImsAuthProvider configuration");

      expect(() => {
        assertImsAuthParams({
          ...validConfig,
          scopes: undefined,
        } as unknown as ImsAuthParams);
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

    test("should throw with array containing non-string items for clientSecrets", () => {
      expect(() => {
        const nonStringItem = 123;
        assertImsAuthParams({
          ...validConfig,
          clientSecrets: [nonStringItem, "secret"],
        } as unknown as ImsAuthParams);
      }).toThrow("Invalid ImsAuthProvider configuration");
    });

    test("should throw with null or undefined clientSecrets", () => {
      expect(() => {
        assertImsAuthParams({
          ...validConfig,
          clientSecrets: null,
        } as unknown as ImsAuthParams);
      }).toThrow("Invalid ImsAuthProvider configuration");

      expect(() => {
        assertImsAuthParams({
          ...validConfig,
          clientSecrets: undefined,
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

  describe("resolveImsAuthParams", () => {
    test("should resolve IMS auth params from App Builder action inputs with all fields", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
        AIO_COMMERCE_AUTH_IMS_ENVIRONMENT: "prod" as const,
        AIO_COMMERCE_AUTH_IMS_CONTEXT: "test-context",
      };

      const resolved = resolveImsAuthParams(params);

      expect(resolved).toEqual({
        clientId: "test-client-id",
        clientSecrets: ["supersecret"],
        technicalAccountId: "test-technical-account-id",
        technicalAccountEmail: "test-email@example.com",
        imsOrgId: "test-org-id",
        scopes: ["scope1", "scope2"],
        environment: "prod",
        context: "test-context",
      });
    });

    test("should resolve IMS auth params with only required fields", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
      };

      const resolved = resolveImsAuthParams(params);

      expect(resolved).toEqual({
        clientId: "test-client-id",
        clientSecrets: ["supersecret"],
        technicalAccountId: "test-technical-account-id",
        technicalAccountEmail: "test-email@example.com",
        imsOrgId: "test-org-id",
        scopes: ["scope1", "scope2"],
        environment: undefined,
        context: undefined,
      });
    });

    test("should resolve IMS auth params with JSON string array for clientSecrets", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: '["secret1","secret2"]',
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
      };

      const resolved = resolveImsAuthParams(params);
      expect(resolved.clientSecrets).toEqual(["secret1", "secret2"]);
    });

    test("should resolve IMS auth params with single string for clientSecrets", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: "single-secret",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
      };

      const resolved = resolveImsAuthParams(params);
      expect(resolved.clientSecrets).toEqual(["single-secret"]);
    });

    test("should throw CommerceSdkValidationError when required params are missing (validation via assert)", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        // Missing other required fields
      };

      expect(() => {
        resolveImsAuthParams(params);
      }).toThrow("Invalid ImsAuthProvider configuration");
    });

    test("should throw CommerceSdkValidationError with invalid data (validation via assert)", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: [], // Empty array - invalid
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
      };

      expect(() => {
        resolveImsAuthParams(params);
      }).toThrow("Invalid ImsAuthProvider configuration");
    });

    test("should resolve IMS auth params with JSON string array for scopes", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: '["scope1","scope2"]',
      };

      const resolved = resolveImsAuthParams(params);
      expect(resolved.scopes).toEqual(["scope1", "scope2"]);
    });

    test("should resolve IMS auth params with single string for scopes", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: "single-scope",
      };

      const resolved = resolveImsAuthParams(params);
      expect(resolved.scopes).toEqual(["single-scope"]);
    });

    test("should throw CommerceSdkValidationError when scopes is empty array", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: [], // Empty array - invalid
      };

      expect(() => {
        resolveImsAuthParams(params);
      }).toThrow("Invalid ImsAuthProvider configuration");
    });

    test("should throw with invalid JSON string for clientSecrets", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: '["test", invalid]', // Invalid JSON syntax
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
      };

      expect(() => {
        resolveImsAuthParams(params);
      }).toThrow("Invalid ImsAuthProvider configuration");
    });

    test("should throw with invalid JSON string for scopes", () => {
      const params = {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: '["test", invalid]', // Invalid JSON syntax
      };

      expect(() => {
        resolveImsAuthParams(params);
      }).toThrow("Invalid ImsAuthProvider configuration");
    });

    test("should throw when JSON.parse returns non-array for clientSecrets", () => {
      const parseSpy = vi
        .spyOn(JSON, "parse")
        .mockReturnValueOnce({ not: "an array" });

      const params = {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: '["test"]', // Looks like array but mocked to return object
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: ["scope1", "scope2"],
      };

      expect(() => {
        resolveImsAuthParams(params);
      }).toThrow("Invalid ImsAuthProvider configuration");

      parseSpy.mockRestore();
    });

    test("should throw when JSON.parse returns non-array for scopes", () => {
      const parseSpy = vi
        .spyOn(JSON, "parse")
        .mockReturnValueOnce({ not: "an array" });

      const params = {
        AIO_COMMERCE_AUTH_IMS_CLIENT_ID: "test-client-id",
        AIO_COMMERCE_AUTH_IMS_CLIENT_SECRETS: ["supersecret"],
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_ID: "test-technical-account-id",
        AIO_COMMERCE_AUTH_IMS_TECHNICAL_ACCOUNT_EMAIL: "test-email@example.com",
        AIO_COMMERCE_AUTH_IMS_ORG_ID: "test-org-id",
        AIO_COMMERCE_AUTH_IMS_SCOPES: '["test"]', // Looks like array but mocked to return object
      };

      expect(() => {
        resolveImsAuthParams(params);
      }).toThrow("Invalid ImsAuthProvider configuration");

      parseSpy.mockRestore();
    });
  });

  describe("isImsAuthProvider", () => {
    test("should return true for IMS auth provider", () => {
      const provider = getImsAuthProvider({
        clientId: "test-client-id",
        clientSecrets: ["supersecret"],
        technicalAccountId: "test-technical-account-id",
        technicalAccountEmail: "test-email@example.com",
        imsOrgId: "test-org-id",
        scopes: ["scope1", "scope2"],
      });

      expect(isImsAuthProvider(provider)).toBe(true);
    });

    test("should return false for plain IMS auth params", () => {
      const params = {
        clientId: "test-client-id",
        clientSecrets: ["supersecret"],
        technicalAccountId: "test-technical-account-id",
        technicalAccountEmail: "test-email@example.com",
        imsOrgId: "test-org-id",
        scopes: ["scope1", "scope2"],
      };

      expect(isImsAuthProvider(params)).toBe(false);
    });

    test("should return false for null", () => {
      expect(isImsAuthProvider(null)).toBe(false);
    });

    test("should return false for undefined", () => {
      expect(isImsAuthProvider(undefined)).toBe(false);
    });

    test("should return false for non-object types", () => {
      expect(isImsAuthProvider("string")).toBe(false);
      expect(isImsAuthProvider(true)).toBe(false);
    });

    test("should return false for objects without required properties", () => {
      expect(isImsAuthProvider({})).toBe(false);
      expect(isImsAuthProvider({ getAccessToken: "anything" })).toBe(false);
      expect(isImsAuthProvider({ getHeaders: "anything" })).toBe(false);
    });

    test("should return false for objects with non-function properties", () => {
      expect(
        isImsAuthProvider({
          getAccessToken: "anything",
          getHeaders: "anything",
        }),
      ).toBe(false);
      expect(
        isImsAuthProvider({
          getAccessToken: () => Promise.resolve("token"),
          getHeaders: "not a function",
        }),
      ).toBe(false);
    });

    test("should return true for objects with both required functions", () => {
      expect(
        isImsAuthProvider({
          getAccessToken: () => Promise.resolve("token"),
          getHeaders: () => Promise.resolve({}),
        }),
      ).toBe(true);
    });
  });

  describe("getForwardedImsAuthProvider", () => {
    describe('from: "headers"', () => {
      test("should extract token from Authorization header", () => {
        const provider = getForwardedImsAuthProvider({
          from: "headers",
          headers: {
            authorization: "Bearer test-token-123",
          },
        });

        expect(provider.getAccessToken()).toBe("test-token-123");
      });

      test("should extract token and api key from headers", () => {
        const provider = getForwardedImsAuthProvider({
          from: "headers",
          headers: {
            authorization: "Bearer test-token-123",
            "x-api-key": "my-api-key",
          },
        });

        const headers = provider.getHeaders();
        expect(headers).toEqual({
          Authorization: "Bearer test-token-123",
          "x-api-key": "my-api-key",
        });
      });

      test("should work with case-insensitive Authorization header", () => {
        const provider = getForwardedImsAuthProvider({
          from: "headers",
          headers: {
            Authorization: "Bearer test-token-123",
          },
        });

        expect(provider.getAccessToken()).toBe("test-token-123");
      });

      test("should return headers without x-api-key when not present", () => {
        const provider = getForwardedImsAuthProvider({
          from: "headers",
          headers: {
            authorization: "Bearer test-token-123",
          },
        });

        const headers = provider.getHeaders();
        expect(headers).toEqual({
          Authorization: "Bearer test-token-123",
        });
        expect(headers).not.toHaveProperty("x-api-key");
      });

      test("should throw when Authorization header is missing", () => {
        expect(() =>
          getForwardedImsAuthProvider({
            from: "headers",
            headers: {},
          }),
        ).toThrow();
      });

      test("should throw when Authorization header is not Bearer format", () => {
        expect(() =>
          getForwardedImsAuthProvider({
            from: "headers",
            headers: {
              authorization: "Basic dXNlcjpwYXNz",
            },
          }),
        ).toThrow();
      });
    });

    describe('from: "credentials"', () => {
      test("should return provided access token", () => {
        const provider = getForwardedImsAuthProvider({
          from: "credentials",
          accessToken: "my-access-token",
        });

        expect(provider.getAccessToken()).toBe("my-access-token");
      });

      test("should return headers with access token", () => {
        const provider = getForwardedImsAuthProvider({
          from: "credentials",
          accessToken: "my-access-token",
        });

        const headers = provider.getHeaders();
        expect(headers).toEqual({
          Authorization: "Bearer my-access-token",
        });
      });

      test("should include api key in headers when provided", () => {
        const provider = getForwardedImsAuthProvider({
          from: "credentials",
          accessToken: "my-access-token",
          apiKey: "my-api-key",
        });

        const headers = provider.getHeaders();
        expect(headers).toEqual({
          Authorization: "Bearer my-access-token",
          "x-api-key": "my-api-key",
        });
      });

      test("should throw when accessToken is not a string", () => {
        expect(() =>
          getForwardedImsAuthProvider({
            from: "credentials",
            // @ts-expect-error - testing invalid input
            accessToken: 123,
          }),
        ).toThrow(CommerceSdkValidationError);
      });
    });

    describe('from: "getter"', () => {
      test("should use sync getter for headers", () => {
        const provider = getForwardedImsAuthProvider({
          from: "getter",
          getHeaders: () => ({
            Authorization: "Bearer getter-token",
          }),
        });

        const headers = provider.getHeaders();
        expect(headers).toEqual({
          Authorization: "Bearer getter-token",
        });
      });

      test("should use async getter for headers", async () => {
        const provider = getForwardedImsAuthProvider({
          from: "getter",
          getHeaders: async () => ({
            Authorization: "Bearer async-getter-token",
            "x-api-key": "async-api-key",
          }),
        });

        const headers = await provider.getHeaders();
        expect(headers).toEqual({
          Authorization: "Bearer async-getter-token",
          "x-api-key": "async-api-key",
        });
      });

      test("should extract token from getter headers for getAccessToken", async () => {
        const provider = getForwardedImsAuthProvider({
          from: "getter",
          getHeaders: () => ({
            Authorization: "Bearer extracted-token",
          }),
        });

        const token = await provider.getAccessToken();
        expect(token).toBe("extracted-token");
      });

      test("should throw when getter is not a function", () => {
        expect(() =>
          getForwardedImsAuthProvider({
            from: "getter",
            // @ts-expect-error - testing invalid input
            getHeaders: "not-a-function",
          }),
        ).toThrow(CommerceSdkValidationError);
      });
    });

    describe("validation errors", () => {
      test("should throw CommerceSdkValidationError for invalid source", () => {
        expect(() =>
          getForwardedImsAuthProvider({
            // @ts-expect-error - testing invalid input
            from: "invalid",
          }),
        ).toThrow(CommerceSdkValidationError);
      });

      test("should throw CommerceSdkValidationError for missing from field", () => {
        expect(() =>
          // @ts-expect-error - testing invalid input
          getForwardedImsAuthProvider({}),
        ).toThrow(CommerceSdkValidationError);
      });
    });
  });

  describe("forwardImsAuthProviderFromParams", () => {
    test("should forward auth from runtime action params", () => {
      const params = {
        __ow_headers: {
          authorization: "Bearer runtime-token",
          "x-api-key": "runtime-api-key",
        },
      };

      const provider = forwardImsAuthProviderFromParams(params);

      expect(provider.getAccessToken()).toBe("runtime-token");
      expect(provider.getHeaders()).toEqual({
        Authorization: "Bearer runtime-token",
        "x-api-key": "runtime-api-key",
      });
    });

    test("should handle missing __ow_headers gracefully", () => {
      const params = {};
      expect(() => forwardImsAuthProviderFromParams(params)).toThrow();
    });

    test("should handle empty __ow_headers", () => {
      const params = {
        __ow_headers: {},
      };

      expect(() => forwardImsAuthProviderFromParams(params)).toThrow();
    });

    test("should work without x-api-key header", () => {
      const params = {
        __ow_headers: {
          authorization: "Bearer runtime-token",
        },
      };

      const provider = forwardImsAuthProviderFromParams(params);

      expect(provider.getAccessToken()).toBe("runtime-token");
      expect(provider.getHeaders()).toEqual({
        Authorization: "Bearer runtime-token",
      });
    });
  });
});
