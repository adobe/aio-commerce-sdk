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

import { getConfigDomains, hasConfigDomain } from "#config/schema/domains";
import {
  configWithBusinessConfig,
  configWithCommerceEventing,
  configWithCustomInstallationSteps,
  configWithEventingAndWebhooks,
  configWithExternalEventing,
  configWithFullEventing,
  configWithWebhooks,
  fullConfig,
  minimalValidConfig,
} from "#test/fixtures/config";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

describe.concurrent("domains schema helpers", () => {
  describe.concurrent("getConfigDomains", () => {
    test("should return only metadata domain for minimal config", () => {
      const domains = getConfigDomains(minimalValidConfig);

      expect(domains.has("metadata")).toBe(true);
      expect(domains.size).toBe(1);
    });

    test("should include eventing and eventing.commerce domains when commerce eventing is present", () => {
      const domains = getConfigDomains(configWithCommerceEventing);

      expect(domains.has("metadata")).toBe(true);
      expect(domains.has("eventing")).toBe(true);
      expect(domains.has("eventing.commerce")).toBe(true);
      expect(domains.has("eventing.external")).toBe(false);
    });

    test("should include eventing and eventing.external domains when external eventing is present", () => {
      const domains = getConfigDomains(configWithExternalEventing);

      expect(domains.has("metadata")).toBe(true);
      expect(domains.has("eventing")).toBe(true);
      expect(domains.has("eventing.external")).toBe(true);
      expect(domains.has("eventing.commerce")).toBe(false);
    });

    test("should include both eventing.commerce and eventing.external when both are present", () => {
      const domains = getConfigDomains(configWithFullEventing);

      expect(domains.has("metadata")).toBe(true);
      expect(domains.has("eventing")).toBe(true);
      expect(domains.has("eventing.commerce")).toBe(true);
      expect(domains.has("eventing.external")).toBe(true);
    });

    test("should include webhooks domain when webhooks are present", () => {
      const domains = getConfigDomains(configWithWebhooks);

      expect(domains.has("metadata")).toBe(true);
      expect(domains.has("webhooks")).toBe(true);
    });

    test("should include installation and customInstallationSteps domains when custom installation is present", () => {
      const domains = getConfigDomains(configWithCustomInstallationSteps);

      expect(domains.has("metadata")).toBe(true);
      expect(domains.has("installation")).toBe(true);
      expect(domains.has("installation.customInstallationSteps")).toBe(true);
    });

    test("should include multiple domains when config has multiple features", () => {
      const domains = getConfigDomains(configWithEventingAndWebhooks);

      expect(domains.has("metadata")).toBe(true);
      expect(domains.has("eventing")).toBe(true);
      expect(domains.has("eventing.commerce")).toBe(true);
      expect(domains.has("eventing.external")).toBe(true);
      expect(domains.has("webhooks")).toBe(true);
    });

    test("should include businessConfig domain when businessConfig is present", () => {
      const config: CommerceAppConfigOutputModel = {
        ...minimalValidConfig,
        businessConfig: {
          ...configWithBusinessConfig.businessConfig,
          schema: [],
        },
      };

      const domains = getConfigDomains(config);

      expect(domains.has("metadata")).toBe(true);
      expect(domains.has("businessConfig")).toBe(true);
      expect(domains.has("businessConfig.schema")).toBe(false); // Empty schema
    });

    test("should include businessConfig.schema domain when schema is non-empty", () => {
      const domains = getConfigDomains(configWithBusinessConfig);

      expect(domains.has("metadata")).toBe(true);
      expect(domains.has("businessConfig")).toBe(true);
      expect(domains.has("businessConfig.schema")).toBe(true);
    });
  });

  describe.concurrent("hasConfigDomain", () => {
    test.concurrent.each([
      { config: minimalValidConfig, domain: "metadata" },
      { config: configWithBusinessConfig, domain: "businessConfig" },
      { config: configWithBusinessConfig, domain: "businessConfig.schema" },
      { config: configWithCommerceEventing, domain: "eventing" },
      { config: configWithWebhooks, domain: "webhooks" },
      { config: configWithCommerceEventing, domain: "eventing" },
      { config: configWithCommerceEventing, domain: "eventing.commerce" },
      { config: configWithExternalEventing, domain: "eventing" },
      { config: configWithExternalEventing, domain: "eventing.external" },
      { config: configWithEventingAndWebhooks, domain: "webhooks" },
      { config: configWithEventingAndWebhooks, domain: "eventing.commerce" },
      { config: configWithEventingAndWebhooks, domain: "eventing.external" },
      { config: configWithCustomInstallationSteps, domain: "installation" },
      {
        config: configWithCustomInstallationSteps,
        domain: "installation.customInstallationSteps",
      },
    ] as const)('should return true for domain "$domain" when config with "$domain" domain is present', ({
      config,
      domain,
    }) => {
      expect(hasConfigDomain(config, domain)).toBe(true);
    });

    test.concurrent.each([
      { config: {}, domain: "metadata" },
      { config: minimalValidConfig, domain: "businessConfig" },
      { config: minimalValidConfig, domain: "businessConfig.schema" },
      { config: minimalValidConfig, domain: "eventing" },
      { config: minimalValidConfig, domain: "webhooks" },
      { config: minimalValidConfig, domain: "installation" },
      { config: configWithCommerceEventing, domain: "eventing.external" },
      { config: configWithExternalEventing, domain: "eventing.commerce" },
    ] as const)('should return false for domain "$domain" when config with "$domain" domain is not present', ({
      config,
      domain,
    }) => {
      // @ts-expect-error - There might be invalid configs (e.g. missing metadata)
      expect(hasConfigDomain(config, domain)).toBe(false);
    });

    test.concurrent.each([
      { config: fullConfig, domain: "metadata" },
      { config: fullConfig, domain: "businessConfig" },
      { config: fullConfig, domain: "businessConfig.schema" },
      { config: fullConfig, domain: "eventing" },
      { config: fullConfig, domain: "eventing.commerce" },
      { config: fullConfig, domain: "eventing.external" },
      { config: fullConfig, domain: "webhooks" },
      { config: fullConfig, domain: "installation" },
      { config: fullConfig, domain: "installation.customInstallationSteps" },
    ] as const)("should work with all domain types", ({ config, domain }) => {
      expect(hasConfigDomain(config, domain)).toBe(true);
    });
  });
});
