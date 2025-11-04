/*
Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import type {
  CommerceHttpClientParams,
  PaaSClientParams,
  SaaSClientParams,
} from "@adobe/aio-commerce-lib-api";

export type CommerceConfigParams = {
  COMMERCE_CONSUMER_KEY?: string;
  COMMERCE_CONSUMER_SECRET?: string;
  COMMERCE_ACCESS_TOKEN?: string;
  COMMERCE_ACCESS_TOKEN_SECRET?: string;
  COMMERCE_CLIENT_ID?: string;
  COMMERCE_CLIENT_SECRET?: string;
  COMMERCE_TECHNICAL_ACCOUNT_ID?: string;
  COMMERCE_TECHNICAL_ACCOUNT_EMAIL?: string;
  COMMERCE_IMS_ORG_ID?: string;
  COMMERCE_BASE_URL?: string;
  COMMERCE_FLAVOR?: "paas" | "saas";
};

export class CommerceValidationError extends Error {
  public constructor(message: string, _code = "INVALID_COMMERCE_CONFIG") {
    super(message);
    this.name = "CommerceValidationError";
  }
}

/**
 * Validate Commerce configuration before making API calls
 * @param commerceConfig - Commerce configuration to validate
 * @throws {CommerceValidationError} When configuration is invalid or missing
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: This validation will be removed soon
export function validateCommerceConfig(
  commerceConfig?: CommerceHttpClientParams,
): asserts commerceConfig is CommerceHttpClientParams {
  if (!commerceConfig) {
    throw new CommerceValidationError(
      "Commerce configuration is required for this operation. Initialize the library with Commerce config: init({ commerce: { auth: {...}, config: {...} } })",
      "MISSING_COMMERCE_CONFIG",
    );
  }

  if (!commerceConfig.config) {
    throw new CommerceValidationError(
      "Commerce config object is required",
      "MISSING_COMMERCE_CONFIG_OBJECT",
    );
  }

  if (!commerceConfig.auth) {
    throw new CommerceValidationError(
      "Commerce auth object is required",
      "MISSING_COMMERCE_AUTH",
    );
  }

  // Validate flavor
  if (
    commerceConfig.config.flavor !== "paas" &&
    commerceConfig.config.flavor !== "saas"
  ) {
    throw new CommerceValidationError(
      `Invalid Commerce flavor: Must be 'paas' or 'saas'`,
      "INVALID_FLAVOR",
    );
  }

  // Validate base URL
  if (!commerceConfig.config.baseUrl) {
    throw new CommerceValidationError(
      "Commerce baseUrl is required",
      "MISSING_BASE_URL",
    );
  }

  try {
    new URL(commerceConfig.config.baseUrl);
  } catch {
    throw new CommerceValidationError(
      "Invalid Commerce base URL format",
      "INVALID_BASE_URL",
    );
  }

  // Validate auth parameters based on flavor
  if (commerceConfig.config.flavor === "paas") {
    const auth = commerceConfig.auth as PaaSClientParams["auth"];

    if (!("getHeaders" in auth)) {
      const requiredFields = [
        "consumerKey",
        "consumerSecret",
        "accessToken",
        "accessTokenSecret",
      ] as const;

      const missingFields = requiredFields.filter((field) => !auth[field]);

      if (missingFields.length > 0) {
        throw new CommerceValidationError(
          `Missing required PAAS authentication fields: ${missingFields.join(", ")}`,
          "MISSING_PAAS_AUTH",
        );
      }
    }
  } else if (commerceConfig.config.flavor === "saas") {
    const auth = commerceConfig.auth as SaaSClientParams["auth"];

    if (!("getHeaders" in auth)) {
      const requiredFields = [
        "clientId",
        "clientSecrets",
        "technicalAccountId",
        "technicalAccountEmail",
        "imsOrgId",
      ] as const;

      const missingFields = requiredFields.filter((field) => {
        if (field === "clientSecrets") {
          return (
            !(auth.clientSecrets && Array.isArray(auth.clientSecrets)) ||
            auth.clientSecrets.length === 0
          );
        }
        return !auth[field];
      });

      if (missingFields.length > 0) {
        throw new CommerceValidationError(
          `Missing required SAAS authentication fields: ${missingFields.join(", ")}`,
          "MISSING_SAAS_AUTH",
        );
      }
    }
  }
}

/**
 * Builds Commerce configuration object from action parameters
 * @param params - Action parameters containing Commerce configuration values
 * @returns Properly structured Commerce configuration for the library
 */
export function buildCommerceConfig(
  params: CommerceConfigParams,
): CommerceHttpClientParams {
  const flavor = params.COMMERCE_FLAVOR || "paas";

  if (flavor === "saas") {
    return {
      auth: {
        clientId: params.COMMERCE_CLIENT_ID as string,
        clientSecrets: [params.COMMERCE_CLIENT_SECRET as string],
        technicalAccountId: params.COMMERCE_TECHNICAL_ACCOUNT_ID as string,
        technicalAccountEmail:
          params.COMMERCE_TECHNICAL_ACCOUNT_EMAIL as string,
        imsOrgId: params.COMMERCE_IMS_ORG_ID as string,
      },
      config: {
        baseUrl: params.COMMERCE_BASE_URL as string,
        flavor: "saas" as const,
      },
    };
  }

  return {
    auth: {
      consumerKey: params.COMMERCE_CONSUMER_KEY as string,
      consumerSecret: params.COMMERCE_CONSUMER_SECRET as string,
      accessToken: params.COMMERCE_ACCESS_TOKEN as string,
      accessTokenSecret: params.COMMERCE_ACCESS_TOKEN_SECRET as string,
    },
    config: {
      baseUrl: params.COMMERCE_BASE_URL as string,
      flavor: "paas" as const,
      storeViewCode: "default",
      version: "V1" as const,
    },
  };
}
