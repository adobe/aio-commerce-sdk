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
  hasCommerceEvents,
  hasEventing,
  hasExternalEvents,
} from "#config/schema/eventing";
import {
  configWithCommerceEventing,
  configWithExternalEventing,
  configWithFullEventing,
  minimalValidConfig,
} from "#test/fixtures/config";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

describe("eventing schema helpers", () => {
  describe("hasEventing", () => {
    test("should return true when eventing is defined", () => {
      expect(hasEventing(configWithCommerceEventing)).toBe(true);
    });

    test("should return false when eventing is undefined", () => {
      expect(hasEventing(minimalValidConfig)).toBe(false);
    });

    test("should return true for eventing with only external events", () => {
      expect(hasEventing(configWithExternalEventing)).toBe(true);
    });

    test("should return true for eventing with both commerce and external", () => {
      expect(hasEventing(configWithFullEventing)).toBe(true);
    });
  });

  describe("hasCommerceEvents", () => {
    test("should return true when commerce events are configured", () => {
      expect(hasCommerceEvents(configWithCommerceEventing)).toBe(true);
    });

    test("should return false when eventing is undefined", () => {
      expect(hasCommerceEvents(minimalValidConfig)).toBe(false);
    });

    test("should return false when eventing has only external events", () => {
      expect(hasCommerceEvents(configWithExternalEventing)).toBe(false);
    });

    test("should return false when eventing.commerce is empty", () => {
      const config: CommerceAppConfigOutputModel = {
        ...minimalValidConfig,
        eventing: { commerce: [] },
      };

      expect(hasCommerceEvents(config)).toBe(false);
    });
  });

  describe("hasExternalEvents", () => {
    test("should return true when external events are configured", () => {
      expect(hasExternalEvents(configWithExternalEventing)).toBe(true);
    });

    test("should return false when eventing is undefined", () => {
      expect(hasExternalEvents(minimalValidConfig)).toBe(false);
    });

    test("should return false when eventing has only commerce events", () => {
      expect(hasExternalEvents(configWithCommerceEventing)).toBe(false);
    });

    test("should return false when eventing.external is empty", () => {
      const config: CommerceAppConfigOutputModel = {
        ...minimalValidConfig,
        eventing: { external: [] },
      };

      expect(hasExternalEvents(config)).toBe(false);
    });
  });
});
