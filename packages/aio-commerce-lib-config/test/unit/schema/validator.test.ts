import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { loadBusinessConfigSchema } from "../../../source/commands/schema/validate/lib";
import { validateSchema } from "../../../source/modules/schema/utils";
import {
  INVALID_CONFIGURATION,
  VALID_CONFIGURATION,
} from "../../fixtures/configuration-schema";

vi.mock("node:fs");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("validator", () => {
  describe("validateSchema()", () => {
    it("should not throw with valid schema", () => {
      expect(() => {
        const result = validateSchema(VALID_CONFIGURATION);
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
      }).not.toThrow();
    });

    it("should throw with invalid schema", () => {
      expect(() => validateSchema(INVALID_CONFIGURATION)).toThrow();
    });
  });

  describe("loadBusinessConfigSchema()", () => {
    it("should validate if the file does exist and the content is valid", async () => {
      const testFile = join(tmpdir(), `test-config-${Date.now()}.js`);
      await writeFile(
        testFile,
        `module.exports = { businessConfig: { schema: ${JSON.stringify(VALID_CONFIGURATION)} } };`,
      );

      vi.mocked(existsSync).mockReturnValueOnce(true);

      await expect(async () => {
        await loadBusinessConfigSchema(testFile);
      }).not.toThrow();
    });

    it("should return null if the file does not exist", async () => {
      vi.mocked(existsSync).mockReturnValueOnce(false);

      // Should return gracefully with null
      const result = await loadBusinessConfigSchema(
        "./path/to/configuration.js",
      );
      expect(result).toBeNull();
    });

    it("should throw if loading the file fails with invalid syntax", async () => {
      const testFile = join(tmpdir(), `invalid-syntax-${Date.now()}.js`);
      await writeFile(testFile, "module.exports = { invalid syntax here");

      vi.mocked(existsSync).mockReturnValueOnce(true);

      await expect(loadBusinessConfigSchema(testFile)).rejects.toThrow();
    });
  });
});
