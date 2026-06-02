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

import { requiresInstallation } from "#config/schema/app";
import {
  configWithAdminUiSdk,
  configWithBusinessConfig,
  configWithCommerceEventing,
  configWithCustomInstallationSteps,
  configWithEventingAndWebhooks,
  configWithExternalEventing,
  configWithFullEventing,
  configWithWebhooks,
  fullConfig,
  minimalValidConfig,
  mockMetadata,
} from "#test/fixtures/config";

import type {
  CommerceAppConfig,
  CommerceAppConfigOutputModel,
} from "#config/schema/app";

describe.concurrent("app schema helpers", () => {
  describe.concurrent("requiresInstallation", () => {
    test.concurrent.each([
      {
        config: configWithCustomInstallationSteps,
        name: "custom installation steps",
      },
      { config: configWithCommerceEventing, name: "commerce eventing" },
      { config: configWithExternalEventing, name: "external eventing" },
      { config: configWithFullEventing, name: "full eventing" },
      { config: configWithWebhooks, name: "webhooks" },
      { config: configWithAdminUiSdk, name: "Admin UI SDK" },
      {
        config: configWithEventingAndWebhooks,
        name: "multiple installable features",
      },
      { config: fullConfig, name: "full config" },
    ])("should return true when config has $name", ({ config }) => {
      expect(requiresInstallation(config)).toBe(true);
    });

    test.concurrent.each([
      { config: minimalValidConfig, name: "metadata only" },
      { config: configWithBusinessConfig, name: "business config" },
      {
        config: {
          metadata: { ...mockMetadata, id: "test-app-installation-messages" },
          installation: {
            messages: {
              preInstallation: "Preparing to install",
              postInstallation: "Installation complete",
            },
          },
        } satisfies CommerceAppConfigOutputModel,
        name: "installation messages without custom steps",
      },
    ])("should return false when config has $name", ({ config }) => {
      expect(requiresInstallation(config)).toBe(false);
    });

    test("should accept app config input shape", () => {
      const config = {
        metadata: { ...mockMetadata, id: "test-app-input-shape" },
        webhooks: configWithWebhooks.webhooks,
      } satisfies CommerceAppConfig;

      expect(requiresInstallation(config)).toBe(true);
    });
  });
});
