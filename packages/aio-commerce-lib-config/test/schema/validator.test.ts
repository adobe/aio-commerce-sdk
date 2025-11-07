import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { assertType, beforeEach, describe, expect, it, vi } from "vitest";

import {
  check,
  validate,
} from "../../source/modules/schema/validation/validator";
import {
  INVALID_CONFIGURATION,
  VALID_CONFIGURATION,
} from "../fixtures/configuration-schema";

import type { InferOutput } from "valibot";
import type { RootSchema } from "../../source/modules/schema/validation/schema";

vi.mock("node:fs");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("validator", () => {
  describe("validate()", () => {
    it("should not throw with valid schema", () => {
      expect(() => {
        const result = validate(VALID_CONFIGURATION);
        assertType<InferOutput<typeof RootSchema>>(result);
      }).not.toThrow();
    });

    it("should throw with invalid schema", () => {
      expect(() => validate(INVALID_CONFIGURATION)).toThrow();
    });
  });

  describe("check()", () => {
    it("should validate if the file does exist and the content is valid", async () => {
      const testFile = join(tmpdir(), `test-config-${Date.now()}.js`);
      await writeFile(
        testFile,
        `module.exports = { businessConfig: { schema: ${JSON.stringify(VALID_CONFIGURATION)} } };`,
      );

      vi.mocked(existsSync).mockReturnValueOnce(true);

      await expect(async () => {
        await check(testFile);
      }).not.toThrow();
    });

    it("should not throw if the file does not exist", async () => {
      vi.mocked(existsSync).mockReturnValueOnce(false);

      // Should return gracefully with validated: false
      const result = await check("./path/to/configuration.js");
      expect(result).toEqual({ validated: false });
    });

    it("should throw if loading the file fails with invalid syntax", async () => {
      const testFile = join(tmpdir(), `invalid-syntax-${Date.now()}.js`);
      await writeFile(testFile, "module.exports = { invalid syntax here");

      vi.mocked(existsSync).mockReturnValueOnce(true);

      await expect(check(testFile)).rejects.toThrow();
    });
  });
});
