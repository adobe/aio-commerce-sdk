import { beforeEach, describe, expect, test } from "vitest";

import {
  getGlobalSchema,
  setGlobalSchema,
} from "#modules/schema/config-schema-repository";
import { VALID_CONFIGURATION } from "#test/fixtures/configuration-schema";

import type { BusinessConfigSchema } from "#modules/schema/types";

describe("schema/config-schema-repository", () => {
  beforeEach(() => {
    // Reset global schema before each test
    setGlobalSchema(null as unknown as BusinessConfigSchema);
  });

  describe("setGlobalSchema", () => {
    test("should set global schema", () => {
      const schema = VALID_CONFIGURATION;

      setGlobalSchema(schema);

      const result = getGlobalSchema();
      expect(result).toEqual(schema);
    });

    test("should overwrite existing schema", () => {
      const schema1 = VALID_CONFIGURATION;
      const schema2 = [
        {
          name: "newField",
          type: "text",
          label: "New Field",
          default: "new",
        },
      ] satisfies BusinessConfigSchema;

      setGlobalSchema(schema1);
      setGlobalSchema(schema2);

      const result = getGlobalSchema();
      expect(result).toEqual(schema2);
      expect(result).not.toEqual(schema1);
    });
  });

  describe("getGlobalSchema", () => {
    test("should return null when no schema is set", () => {
      const result = getGlobalSchema();
      expect(result).toBeNull();
    });

    test("should return the schema that was set", () => {
      const schema = VALID_CONFIGURATION;

      setGlobalSchema(schema);

      const result = getGlobalSchema();
      expect(result).toEqual(schema);
    });

    test("should return the same reference that was set", () => {
      const schema = VALID_CONFIGURATION;

      setGlobalSchema(schema);

      const result = getGlobalSchema();
      expect(result).toBe(schema); // Same reference
    });
  });
});
