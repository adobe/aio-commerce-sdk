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

import { hasWebhooks } from "#config/schema/webhooks";
import { configWithWebhooks, minimalValidConfig } from "#test/fixtures/config";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

describe("webhooks schema helpers", () => {
  describe("hasWebhooks", () => {
    test("should return true when webhooks are configured", () => {
      expect(hasWebhooks(configWithWebhooks)).toBe(true);
    });

    test("should return false when webhooks is undefined", () => {
      expect(hasWebhooks(minimalValidConfig)).toBe(false);
    });

    test("should return false when webhooks is empty array", () => {
      const config: CommerceAppConfigOutputModel = {
        ...minimalValidConfig,
        webhooks: [],
      };

      expect(hasWebhooks(config)).toBe(false);
    });
  });
});
