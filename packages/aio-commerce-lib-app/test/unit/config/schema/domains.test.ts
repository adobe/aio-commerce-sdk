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
  configWithCommerceEventing,
  configWithCustomInstallationSteps,
  configWithEventingAndWebhooks,
  configWithExternalEventing,
  configWithFullEventing,
  configWithWebhooks,
  minimalValidConfig,
} from "#test/fixtures/config";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

describe("domains schema helpers", () => {
  describe("getConfigDomains", () => {
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
          schema: [],
        },
      };

      const domains = getConfigDomains(config);

      expect(domains.has("metadata")).toBe(true);
      expect(domains.has("businessConfig")).toBe(true);
      expect(domains.has("businessConfig.schema")).toBe(false); // Empty schema
    });

    test("should include businessConfig.schema domain when schema is non-empty", () => {
      const config: CommerceAppConfigOutputModel = {
        ...minimalValidConfig,
        businessConfig: {
          schema: [
            {
              name: "test-field",
              label: "Test Field",
              type: "text",
              default: "",
            },
          ],
        },
      };

      const domains = getConfigDomains(config);

      expect(domains.has("metadata")).toBe(true);
      expect(domains.has("businessConfig")).toBe(true);
      expect(domains.has("businessConfig.schema")).toBe(true);
    });
  });

  describe("hasConfigDomain", () => {
    test("should return true when domain is present", () => {
      expect(hasConfigDomain(minimalValidConfig, "metadata")).toBe(true);
      expect(hasConfigDomain(configWithWebhooks, "webhooks")).toBe(true);
      expect(hasConfigDomain(configWithCommerceEventing, "eventing")).toBe(
        true,
      );
      expect(
        hasConfigDomain(configWithCommerceEventing, "eventing.commerce"),
      ).toBe(true);
    });

    test("should return false when domain is not present", () => {
      expect(hasConfigDomain(minimalValidConfig, "webhooks")).toBe(false);
      expect(hasConfigDomain(minimalValidConfig, "eventing")).toBe(false);
      expect(
        hasConfigDomain(configWithCommerceEventing, "eventing.external"),
      ).toBe(false);
      expect(
        hasConfigDomain(configWithExternalEventing, "eventing.commerce"),
      ).toBe(false);
    });

    test("should work with all domain types", () => {
      const fullConfig = configWithEventingAndWebhooks;

      expect(hasConfigDomain(fullConfig, "metadata")).toBe(true);
      expect(hasConfigDomain(fullConfig, "eventing")).toBe(true);
      expect(hasConfigDomain(fullConfig, "webhooks")).toBe(true);
      expect(hasConfigDomain(fullConfig, "eventing.commerce")).toBe(true);
      expect(hasConfigDomain(fullConfig, "eventing.external")).toBe(true);
    });
  });
});
