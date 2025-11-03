import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConfigManager } from "#config-manager";
import { mockScopeTree } from "#test/fixtures/scope-tree";

vi.mock("#modules/scope-tree/scope-tree-repository", () => {
  const MockScopeTreeRepository = vi.fn(
    class {
      getCachedScopeTree = vi.fn(() => null);
      getPersistedScopeTree = vi.fn(() => mockScopeTree);
      setCachedScopeTree = vi.fn();
      saveScopeTree = vi.fn();
    },
  );

  return { ScopeTreeRepository: MockScopeTreeRepository };
});

vi.mock("#modules/schema/config-schema-repository", () => {
  const mockSchema = JSON.stringify([
    {
      name: "exampleList",
      type: "list",
      options: [{ label: "Option 1", value: "option1" }],
      default: "option1",
    },
    {
      name: "currency",
      type: "text",
      label: "Currency",
      default: "",
    },
  ]);

  const MockConfigSchemaRepository = vi.fn(
    class {
      getCachedSchema = vi.fn(() => null);
      setCachedSchema = vi.fn();
      deleteCachedSchema = vi.fn();
      getPersistedSchema = vi.fn(() => mockSchema);
      saveSchema = vi.fn();
      getSchemaVersion = vi.fn(() => null);
      setSchemaVersion = vi.fn();
    },
  );

  return { ConfigSchemaRepository: MockConfigSchemaRepository };
});

function buildPayload(
  id: string,
  code: string,
  level: string,
  entries: Array<{
    name: string;
    value: any;
    origin?: { code: string; level: string };
  }>,
) {
  return JSON.stringify({
    scope: { id, code, level },
    config: entries,
  });
}

class MockConfigurationRepository {
  private state = new Map<string, string>();
  private files = new Map<string, string>();

  // Low-level methods
  async getCachedConfig(scopeCode: string): Promise<string | null> {
    const key = `configuration.${scopeCode}`;
    return this.state.get(key) || null;
  }

  async setCachedConfig(scopeCode: string, payload: string): Promise<void> {
    const key = `configuration.${scopeCode}`;
    this.state.set(key, payload);
  }

  async getPersistedConfig(scopeCode: string): Promise<string | null> {
    const path = `scope/${scopeCode.toLowerCase()}/configuration.json`;
    return this.files.get(path) || null;
  }

  async saveConfig(scopeCode: string, payload: string): Promise<void> {
    const path = `scope/${scopeCode.toLowerCase()}/configuration.json`;
    this.files.set(path, payload);
  }

  // High-level methods
  async loadConfig(
    scopeCode: string,
  ): Promise<{ scope: any; config: any[] } | null> {
    try {
      const statePayload = await this.getCachedConfig(scopeCode);
      if (statePayload) {
        return JSON.parse(statePayload);
      }
    } catch (_e) {
      // Continue to files
    }

    try {
      const filePayload = await this.getPersistedConfig(scopeCode);
      if (filePayload) {
        const parsed = JSON.parse(filePayload);
        try {
          await this.setCachedConfig(scopeCode, JSON.stringify(parsed));
        } catch (_e) {
          // Cache failure is non-critical
        }
        return parsed;
      }
    } catch (_e) {
      // No config found
    }

    return null;
  }

  async persistConfig(scopeCode: string, payload: any): Promise<void> {
    const payloadString = JSON.stringify(payload);
    await this.saveConfig(scopeCode, payloadString);
    try {
      await this.setCachedConfig(scopeCode, payloadString);
    } catch (_e) {
      // Cache failure is non-critical
    }
  }
}

// Mock instances
let mockConfigRepo: MockConfigurationRepository;

vi.mock("#modules/configuration/configuration-repository", () => ({
  ConfigurationRepository: class MockedConfigurationRepository {
    constructor() {
      // Delegate all methods to the mock instance
      if (mockConfigRepo) {
        Object.setPrototypeOf(this, mockConfigRepo);
        Object.assign(this, mockConfigRepo);
      }
    }
  },
}));

function createManager(): ConfigManager {
  return new ConfigManager();
}

describe("ConfigManager", () => {
  beforeEach(() => {
    // Initialize mock instances before each test
    mockConfigRepo = new MockConfigurationRepository();
  });

  it("returns defaults when no persisted config", async () => {
    const mgr = createManager();
    const result = await mgr.getConfiguration("global", "global");
    expect(result.scope.code).toBe("global");
    expect(Array.isArray(result.config)).toBe(true);
    expect(result.config.length).toBeGreaterThan(0);
  });

  it("reads from state when present", async () => {
    const mgr = createManager();
    await mockConfigRepo.setCachedConfig(
      "global",
      buildPayload("id1", "global", "global", [
        {
          name: "currency",
          value: "€",
          origin: { code: "global", level: "global" },
        },
      ]),
    );
    const result = await mgr.getConfiguration("global", "global");
    expect(result.config.find((e: any) => e.name === "currency")?.value).toBe(
      "€",
    );
  });

  it("falls back to files and caches to state", async () => {
    const mgr = createManager();
    await mockConfigRepo.saveConfig(
      "global",
      buildPayload("id2", "global", "global", [
        {
          name: "currency",
          value: "£",
          origin: { code: "global", level: "global" },
        },
      ]),
    );
    const result = await mgr.getConfiguration("global", "global");
    expect(result.config.find((e: any) => e.name === "currency")?.value).toBe(
      "£",
    );

    // Verify it was cached in state
    const cachedPayload = await mockConfigRepo.getCachedConfig("global");
    expect(cachedPayload).toBeTruthy();
    const cached = JSON.parse(cachedPayload!);
    expect(cached.config.find((e: any) => e.name === "currency")?.value).toBe(
      "£",
    );
  });

  it("merges inherited values from parent scopes", async () => {
    const mgr = createManager();

    // Set up global scope config (top-level parent)
    await mockConfigRepo.saveConfig(
      "global",
      buildPayload("id-global", "global", "global", [
        {
          name: "currency",
          value: "$",
          origin: { code: "global", level: "global" },
        },
      ]),
    );

    // Set up intermediate parent scopes in the hierarchy
    await mockConfigRepo.saveConfig(
      "commerce",
      buildPayload("id-commerce", "commerce", "commerce", [
        // Commerce inherits currency from global but doesn't override it
      ]),
    );

    await mockConfigRepo.saveConfig(
      "base",
      buildPayload("idw", "base", "website", [
        // Base website inherits currency from global but doesn't override it
      ]),
    );

    await mockConfigRepo.saveConfig(
      "main_store",
      buildPayload("ids", "main_store", "store", [
        // Store inherits currency from global but doesn't override it
      ]),
    );

    // Set up child scope config with partial override
    await mockConfigRepo.saveConfig(
      "default",
      buildPayload("idsv", "default", "store_view", [
        {
          name: "exampleList",
          value: "option1",
          origin: { code: "default", level: "store_view" },
        },
      ]),
    );

    const result = await mgr.getConfiguration("default", "store_view");
    expect(result.config.find((e: any) => e.name === "currency")?.value).toBe(
      "$",
    );
    expect(
      result.config.find((e: any) => e.name === "currency")?.origin,
    ).toEqual({ code: "global", level: "global" });
    expect(
      result.config.find((e: any) => e.name === "exampleList")?.value,
    ).toBe("option1");
    expect(
      result.config.find((e: any) => e.name === "exampleList")?.origin,
    ).toEqual({ code: "default", level: "store_view" });
  });

  it("resolves scope by code+level to id and fetches same via id", async () => {
    const mgr = createManager();
    // Use the correct ID from mock scope tree: 'base'/'website' has id 'idw'
    await mockConfigRepo.saveConfig(
      "base",
      buildPayload("idw", "base", "website", [
        {
          name: "currency",
          value: "EUR",
          origin: { code: "base", level: "website" },
        },
      ]),
    );

    const resultByCodeLevel = await mgr.getConfiguration("base", "website");
    const resultById = await mgr.getConfiguration("idw");

    expect(resultByCodeLevel).toEqual(resultById);
    expect(resultByCodeLevel.scope.id).toBe("idw");
    expect(resultByCodeLevel.scope.code).toBe("base");
    expect(resultByCodeLevel.scope.level).toBe("website");
  });

  it("sets configuration and persists to files/state", async () => {
    const mgr = createManager();

    const response = await mgr.setConfiguration(
      { config: [{ name: "currency", value: "JPY" }] },
      "global",
      "global",
    );

    expect(response.message).toBe("Configuration values updated successfully");
    expect(response.scope.code).toBe("global");
    expect(response.config).toEqual([{ name: "currency", value: "JPY" }]);

    // Verify persistence
    const persisted = await mockConfigRepo.getPersistedConfig("global");
    expect(persisted).toBeTruthy();
    const parsed = JSON.parse(persisted!);
    expect(parsed.config.find((e: any) => e.name === "currency")?.value).toBe(
      "JPY",
    );
  });

  it("merges existing and newly set entries without losing prior values", async () => {
    const mgr = createManager();

    // Set initial config
    await mockConfigRepo.saveConfig(
      "global",
      buildPayload("id-global", "global", "global", [
        {
          name: "currency",
          value: "USD",
          origin: { code: "global", level: "global" },
        },
        {
          name: "exampleList",
          value: "option1",
          origin: { code: "global", level: "global" },
        },
      ]),
    );

    // Update only currency
    await mgr.setConfiguration(
      { config: [{ name: "currency", value: "CAD" }] },
      "global",
      "global",
    );

    // Verify both values are present
    const result = await mgr.getConfiguration("global", "global");
    expect(result.config.find((e: any) => e.name === "currency")?.value).toBe(
      "CAD",
    );
    expect(
      result.config.find((e: any) => e.name === "exampleList")?.value,
    ).toBe("option1");
  });

  it("ignores extra properties in setConfiguration request entries", async () => {
    const mgr = createManager();

    // Test that extra properties are stripped at runtime
    const response = await mgr.setConfiguration(
      {
        config: [
          {
            name: "currency",
            value: "GBP",
            extraProp: "ignored",
            anotherProp: 123,
          } as any, // Allow extra props for runtime testing
        ],
      },
      "global",
      "global",
    );

    expect(response.config).toEqual([{ name: "currency", value: "GBP" }]);
  });

  it("skips entries missing value and strips unknown props as per request contract", async () => {
    const mgr = createManager();

    // Test malformed entries are handled at runtime
    const response = await mgr.setConfiguration(
      {
        config: [
          { name: "currency" } as any, // missing value - test runtime handling
          { name: "exampleList", value: "option1" }, // valid
          { value: "orphaned" } as any, // missing name - test runtime handling
        ],
      },
      "global",
      "global",
    );

    expect(response.config).toEqual([
      { name: "exampleList", value: "option1" },
    ]);
  });
});
