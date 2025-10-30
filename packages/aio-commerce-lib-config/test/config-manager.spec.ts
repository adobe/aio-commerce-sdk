import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConfigManager } from "../source/config-manager";
import { mockScopeTree } from "./fixtures/mock-scope-tree";

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

// Mock repositories for testing
class MockScopeTreeRepository {
  async getCachedScopeTree(namespace: string) {
    return null;
  }
  async setCachedScopeTree(namespace: string, tree: any, ttl: number) {}
  async getPersistedScopeTree(namespace: string) {
    return mockScopeTree;
  }
  async saveScopeTree(namespace: string, scopes: any): Promise<void> {}
}

class MockConfigSchemaRepository {
  async getCachedSchema(namespace: string) {
    return null;
  }
  async setCachedSchema(namespace: string, data: any, ttl: number) {}
  async deleteCachedSchema(namespace: string) {}
  async getPersistedSchema(): Promise<string> {
    // Return a valid schema with defaults for testing
    return JSON.stringify([
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
  }
  async saveSchema(schema: string): Promise<void> {}
  async getSchemaVersion(namespace: string) {
    return null;
  }
  async setSchemaVersion(namespace: string, version: string) {}
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
    } catch (e) {
      // Continue to files
    }

    try {
      const filePayload = await this.getPersistedConfig(scopeCode);
      if (filePayload) {
        const parsed = JSON.parse(filePayload);
        try {
          await this.setCachedConfig(scopeCode, JSON.stringify(parsed));
        } catch (e) {
          // Cache failure is non-critical
        }
        return parsed;
      }
    } catch (e) {
      // No config found
    }

    return null;
  }

  async persistConfig(scopeCode: string, payload: any): Promise<void> {
    const payloadString = JSON.stringify(payload);
    await this.saveConfig(scopeCode, payloadString);
    try {
      await this.setCachedConfig(scopeCode, payloadString);
    } catch (e) {
      // Cache failure is non-critical
    }
  }
}

// Global mock instances
let mockScopeTreeRepo: MockScopeTreeRepository;
let mockSchemaRepo: MockConfigSchemaRepository;
let mockConfigRepo: MockConfigurationRepository;

// Mock the repository modules
vi.mock("../source/modules/scope-tree/scope-tree-repository", () => ({
  ScopeTreeRepository: vi.fn(() => mockScopeTreeRepo),
}));

vi.mock("../source/modules/schema/config-schema-repository", () => ({
  ConfigSchemaRepository: vi.fn(() => mockSchemaRepo),
}));

vi.mock("../source/modules/configuration/configuration-repository", () => ({
  ConfigurationRepository: vi.fn(() => mockConfigRepo),
}));

function createManager(): ConfigManager {
  return new ConfigManager();
}

describe("ConfigManager", () => {
  beforeEach(() => {
    // Reset mock instances before each test
    mockScopeTreeRepo = new MockScopeTreeRepository();
    mockSchemaRepo = new MockConfigSchemaRepository();
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

    const response = await mgr.setConfiguration(
      {
        config: [
          // @ts-expect-error - testing that extra props are stripped
          {
            name: "currency",
            value: "GBP",
            extraProp: "ignored",
            anotherProp: 123,
          },
        ],
      },
      "global",
      "global",
    );

    expect(response.config).toEqual([{ name: "currency", value: "GBP" }]);
  });

  it("skips entries missing value and strips unknown props as per request contract", async () => {
    const mgr = createManager();

    const response = await mgr.setConfiguration(
      {
        config: [
          // @ts-expect-error - testing malformed entries
          { name: "currency" }, // missing value
          { name: "exampleList", value: "option1" }, // valid
          // @ts-expect-error - testing malformed entries
          { value: "orphaned" }, // missing name
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
