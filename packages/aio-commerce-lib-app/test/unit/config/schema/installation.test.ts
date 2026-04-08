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

import { hasCustomInstallation } from "#config/schema/installation";
import {
  configWithCustomInstallationSteps,
  configWithOneScript,
  minimalValidConfig,
} from "#test/fixtures/config";

describe("installation schema helpers", () => {
  describe("hasCustomInstallation", () => {
    test("should return true when installation is defined", () => {
      expect(hasCustomInstallation(configWithCustomInstallationSteps)).toBe(
        true,
      );
    });

    test("should return false when installation is undefined", () => {
      expect(hasCustomInstallation(minimalValidConfig)).toBe(false);
    });

    test("should return true when installation has a single script", () => {
      expect(hasCustomInstallation(configWithOneScript)).toBe(true);
    });
  });
});
