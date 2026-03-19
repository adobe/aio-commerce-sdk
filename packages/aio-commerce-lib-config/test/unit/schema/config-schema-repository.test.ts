import stringify from "safe-stable-stringify";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteCachedSchema,
  getCachedSchema,
  getPersistedSchema,
  getSchemaVersion,
  savePersistedSchema,
  setCachedSchema,
  setSchemaVersion,
} from "#modules/schema/config-schema-repository";
import {
  VALID_CONFIGURATION,
  VALID_CONFIGURATION_WITHOUT_DEFAULTS,
} from "#test/fixtures/configuration-schema";
import { createMockLibFiles } from "#test/mocks/lib-files";
import { createMockLibState } from "#test/mocks/lib-state";

const MockState = createMockLibState();
const MockFiles = createMockLibFiles();

let mockStateInstance = new MockState();
let mockFilesInstance = new MockFiles();

vi.mock("#utils/repository", () => ({
  getSharedState: vi.fn(async () => mockStateInstance),
  getSharedFiles: vi.fn(async () => mockFilesInstance),
}));

describe("config-schema-repository", () => {
  beforeEach(() => {
    mockStateInstance = new MockState();
    mockFilesInstance = new MockFiles();
    vi.clearAllMocks();
  });

  describe("getCachedSchema", () => {
    it("should return cached schema when present", async () => {
      const schema = VALID_CONFIGURATION;

      await mockStateInstance.put(
        "test-namespace:config-schema",
        JSON.stringify({ data: schema }),
      );

      const result = await getCachedSchema("test-namespace");

      expect(result).toEqual(schema);
    });

    it("should return null when cache is empty", async () => {
      const result = await getCachedSchema("test-namespace");

      expect(result).toBeNull();
    });

    it("should return null when cache value is invalid", async () => {
      await mockStateInstance.put(
        "test-namespace:config-schema",
        "invalid-json",
      );

      const result = await getCachedSchema("test-namespace");

      expect(result).toBeNull();
    });

    it("should return null when data property is missing", async () => {
      await mockStateInstance.put(
        "test-namespace:config-schema",
        JSON.stringify({ other: "value" }),
      );

      const result = await getCachedSchema("test-namespace");

      expect(result).toBeNull();
    });
  });

  describe("setCachedSchema", () => {
    it("should cache schema with TTL", async () => {
      const schema = VALID_CONFIGURATION;
      const ttl = 300_000;

      await setCachedSchema("test-namespace", schema, ttl);

      // Verify the schema was cached with the correct TTL
      expect(mockStateInstance.put).toHaveBeenCalledWith(
        "test-namespace:config-schema",
        stringify({ data: schema }),
        { ttl },
      );

      // Verify the cached data is correct
      const cached = await mockStateInstance.get(
        "test-namespace:config-schema",
      );
      expect(cached.value).toBeDefined();

      // biome-ignore lint/style/noNonNullAssertion: we just checked it's defined
      const parsed = JSON.parse(cached.value!);
      expect(parsed.data).toEqual(schema);
    });

    it("should not throw when caching fails", async () => {
      const schema = VALID_CONFIGURATION_WITHOUT_DEFAULTS;

      vi.spyOn(mockStateInstance, "put").mockRejectedValue(
        new Error("State error"),
      );

      await expect(
        setCachedSchema("test-namespace", schema, 300_000),
      ).resolves.not.toThrow();
    });
  });

  describe("deleteCachedSchema", () => {
    it("should delete cached schema", async () => {
      await mockStateInstance.put(
        "test-namespace:config-schema",
        JSON.stringify({ data: [] }),
      );

      await deleteCachedSchema("test-namespace");

      const cached = await mockStateInstance.get(
        "test-namespace:config-schema",
      );
      expect(cached?.value).toBeNull();
    });

    it("should not throw when deletion fails", async () => {
      vi.spyOn(mockStateInstance, "delete").mockRejectedValue(
        new Error("Delete error"),
      );

      await expect(deleteCachedSchema("test-namespace")).resolves.not.toThrow();
    });
  });

  describe("getSchemaVersion", () => {
    it("should return schema version when present", async () => {
      const version = "abc123def456";

      await mockStateInstance.put(
        "test-namespace:schema-version",
        JSON.stringify({ version }),
      );

      const result = await getSchemaVersion("test-namespace");

      expect(result).toBe(version);
    });

    it("should return null when version is not set", async () => {
      const result = await getSchemaVersion("test-namespace");

      expect(result).toBeNull();
    });

    it("should return null when version data is invalid", async () => {
      await mockStateInstance.put(
        "test-namespace:schema-version",
        "invalid-json",
      );

      const result = await getSchemaVersion("test-namespace");

      expect(result).toBeNull();
    });

    it("should return null when version property is missing", async () => {
      await mockStateInstance.put(
        "test-namespace:schema-version",
        JSON.stringify({ other: "value" }),
      );

      const result = await getSchemaVersion("test-namespace");

      expect(result).toBeNull();
    });
  });

  describe("setSchemaVersion", () => {
    it("should set schema version", async () => {
      const version = "xyz789abc123";

      await setSchemaVersion("test-namespace", version);

      const stored = await mockStateInstance.get(
        "test-namespace:schema-version",
      );
      expect(stored.value).toBeDefined();

      // biome-ignore lint/style/noNonNullAssertion: we just checked it's defined
      const parsed = JSON.parse(stored.value!);
      expect(parsed.version).toBe(version);
    });

    it("should not throw when setting version fails", async () => {
      vi.spyOn(mockStateInstance, "put").mockRejectedValue(
        new Error("State error"),
      );

      await expect(
        setSchemaVersion("test-namespace", "version123"),
      ).resolves.not.toThrow();
    });
  });

  describe("savePersistedSchema", () => {
    it("should save schema to files", async () => {
      const schema = VALID_CONFIGURATION;

      await savePersistedSchema("test-namespace", schema);

      const saved = await mockFilesInstance.read("config-schema.json");
      const parsed = JSON.parse(saved.toString());

      expect(parsed).toEqual(schema);
    });

    it("should delete cached schema after saving", async () => {
      const schema = VALID_CONFIGURATION_WITHOUT_DEFAULTS;

      await mockStateInstance.put(
        "test-namespace:config-schema",
        JSON.stringify({ data: schema }),
      );

      await savePersistedSchema("test-namespace", schema);

      const cached = await mockStateInstance.get(
        "test-namespace:config-schema",
      );
      expect(cached?.value).toBeNull();
    });

    it("should set schema version when provided", async () => {
      const schema = VALID_CONFIGURATION;
      const version = "version-hash-123";

      await savePersistedSchema("test-namespace", schema, version);

      const storedVersion = await getSchemaVersion("test-namespace");
      expect(storedVersion).toBe(version);
    });

    it("should not set version when not provided", async () => {
      const schema = VALID_CONFIGURATION_WITHOUT_DEFAULTS;

      await savePersistedSchema("test-namespace", schema);

      const storedVersion = await getSchemaVersion("test-namespace");
      expect(storedVersion).toBeNull();
    });

    it("should format schema with proper indentation", async () => {
      const schema = VALID_CONFIGURATION;

      await savePersistedSchema("test-namespace", schema);

      const saved = await mockFilesInstance.read("config-schema.json");
      const content = saved.toString();

      expect(content).toContain("\n");
      expect(content).toContain("  ");
    });
  });

  describe("getPersistedSchema", () => {
    it("should read persisted schema from files", async () => {
      const schema = VALID_CONFIGURATION;

      await mockFilesInstance.write(
        "config-schema.json",
        JSON.stringify(schema, null, 2),
      );

      const result = await getPersistedSchema();

      expect(result).toBe(JSON.stringify(schema, null, 2));
    });

    it("should throw when file does not exist", async () => {
      vi.spyOn(mockFilesInstance, "read").mockRejectedValue(
        new Error("File not found"),
      );

      await expect(getPersistedSchema()).rejects.toThrow();
    });
  });
});
