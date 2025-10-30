import { readFile } from "node:fs/promises";

import { assertType, beforeEach, describe, expect, it, vi } from "vitest";

import {
  check,
  validate,
} from "../../source/modules/schema/validation/validator";
import {
  INVALID_CONFIGURATION,
  VALID_CONFIGURATION,
} from "../fixtures/configuration-schema-fixture";

import type { InferOutput } from "valibot";
import type { RootSchema } from "../../source/modules/schema/validation/schema";

vi.mock("node:fs/promises");

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
      vi.mocked(readFile).mockResolvedValueOnce(
        JSON.stringify(VALID_CONFIGURATION),
      );

      await expect(async () => {
        await check("./path/to/configuration.json");
      }).not.toThrow();
    });

    it("should throw if not a JSON file", async () => {
      await expect(async () => {
        await check("./path/to/configuration.yaml");
      }).rejects.toThrow("Configuration file must be a JSON file");
    });

    it("should throw if the file does not exist", async () => {
      vi.mocked(readFile).mockRejectedValueOnce(new Error("File not found"));

      await expect(async () => {
        await check("./path/to/configuration.json");
      }).rejects.toThrow("File not found");
    });
  });
});
