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
  hasBusinessConfig,
  hasBusinessConfigSchema,
} from "#config/schema/business-configuration";
import { minimalValidConfig } from "#test/fixtures/config";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

describe("business-configuration schema helpers", () => {
  describe("hasBusinessConfig", () => {
    test("should return true when businessConfig is defined", () => {
      const config: CommerceAppConfigOutputModel = {
        ...minimalValidConfig,
        businessConfig: {
          schema: [],
        },
      };

      expect(hasBusinessConfig(config)).toBe(true);
    });

    test("should return false when businessConfig is undefined", () => {
      const config: CommerceAppConfigOutputModel = {
        ...minimalValidConfig,
      };

      expect(hasBusinessConfig(config)).toBe(false);
    });

    test("should return true when businessConfig is defined with schema", () => {
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

      expect(hasBusinessConfig(config)).toBe(true);
    });
  });

  describe("hasBusinessConfigSchema", () => {
    test("should return true when businessConfig.schema is defined and non-empty", () => {
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

      expect(hasBusinessConfigSchema(config)).toBe(true);
    });

    test("should return false when businessConfig is undefined", () => {
      const config: CommerceAppConfigOutputModel = {
        ...minimalValidConfig,
      };

      expect(hasBusinessConfigSchema(config)).toBe(false);
    });

    test("should return false when businessConfig.schema is undefined", () => {
      const config: CommerceAppConfigOutputModel = {
        ...minimalValidConfig,
        businessConfig: {} as any,
      };

      expect(hasBusinessConfigSchema(config)).toBe(false);
    });

    test("should return false when businessConfig.schema is empty array", () => {
      const config: CommerceAppConfigOutputModel = {
        ...minimalValidConfig,
        businessConfig: {
          schema: [],
        },
      };

      expect(hasBusinessConfigSchema(config)).toBe(false);
    });

    test("should return true when businessConfig.schema has multiple fields", () => {
      const config: CommerceAppConfigOutputModel = {
        ...minimalValidConfig,
        businessConfig: {
          schema: [
            {
              name: "field1",
              label: "Field 1",
              type: "text",
              default: "",
            },
            {
              name: "field2",
              label: "Field 2",
              type: "email",
              default: "",
            },
          ],
        },
      };

      expect(hasBusinessConfigSchema(config)).toBe(true);
    });
  });
});
