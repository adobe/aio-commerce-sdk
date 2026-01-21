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

import { existsSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

import { loadBusinessConfigSchema } from "#commands/schema/validate/lib";
import { parseBusinessConfigSchema } from "#modules/schema/utils";
import {
  INVALID_CONFIGURATION,
  VALID_CONFIGURATION,
} from "#test/fixtures/configuration-schema";

vi.mock("node:fs");

vi.mock("@adobe/aio-commerce-lib-app/config", async () => {
  const actual = await vi.importActual<
    typeof import("@adobe/aio-commerce-lib-app/config")
  >("@adobe/aio-commerce-lib-app/config");

  return {
    ...actual,
    readCommerceAppConfig: vi.fn(),
    resolveCommerceAppConfig: vi.fn(),
  } satisfies typeof import("@adobe/aio-commerce-lib-app/config");
});

describe("validator", () => {
  describe("validateSchema()", () => {
    it("should not throw with valid schema", () => {
      expect(() => {
        const result = parseBusinessConfigSchema(VALID_CONFIGURATION);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it("should throw with invalid schema", () => {
      expect(() => parseBusinessConfigSchema(INVALID_CONFIGURATION)).toThrow();
    });
  });

  describe("loadBusinessConfigSchema()", () => {
    it("should validate if the file does exist and the content is valid", async () => {
      const { readCommerceAppConfig, resolveCommerceAppConfig } = await import(
        "@adobe/aio-commerce-lib-app/config"
      );

      vi.mocked(resolveCommerceAppConfig).mockResolvedValueOnce(
        "app.commerce.config.js",
      );
      vi.mocked(existsSync).mockReturnValueOnce(true);

      vi.mocked(readCommerceAppConfig).mockResolvedValueOnce({
        businessConfig: { schema: VALID_CONFIGURATION },
      });

      await expect(async () => {
        await loadBusinessConfigSchema();
      }).not.toThrow();
    });

    it("should return null if the file does not exist", async () => {
      const { resolveCommerceAppConfig } = await import(
        "@adobe/aio-commerce-lib-app/config"
      );

      vi.mocked(resolveCommerceAppConfig).mockResolvedValueOnce(
        "app.commerce.config.js",
      );
      vi.mocked(existsSync).mockReturnValueOnce(false);

      // Should return gracefully with null
      const result = await loadBusinessConfigSchema();
      expect(result).toBeNull();
    });

    it("should throw if loading the file fails with invalid syntax", async () => {
      const { readCommerceAppConfig, resolveCommerceAppConfig } = await import(
        "@adobe/aio-commerce-lib-app/config"
      );

      vi.mocked(resolveCommerceAppConfig).mockResolvedValueOnce(
        "app.commerce.config.js",
      );
      vi.mocked(existsSync).mockReturnValueOnce(true);

      vi.mocked(readCommerceAppConfig).mockRejectedValueOnce(
        new Error("Invalid syntax"),
      );

      await expect(loadBusinessConfigSchema()).rejects.toThrow();
    });
  });
});
