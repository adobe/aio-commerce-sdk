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

import { fs, vol } from "memfs";
import { beforeEach, describe, expect, test, vi } from "vitest";

// Mock the entire fs module with memfs
// See: https://vitest.dev/guide/mocking/file-system.html#mocking-the-file-system
vi.mock("node:fs", () => ({ default: fs }));
vi.mock("node:fs/promises", () => fs.promises);

import { readBundledExtensibilityConfig } from "~/config/lib/parser";

describe("readBundledExtensibilityConfig", () => {
  beforeEach(() => {
    vol.reset();
  });

  test("should read and parse bundled config file", async () => {
    const mockConfig = {
      metadata: {
        id: "bundled-app",
        displayName: "Bundled App",
        description: "A bundled application",
        version: "2.0.0",
      },
    };

    vol.fromJSON({
      "app-management/extensibility.manifest.json": JSON.stringify(mockConfig),
    });

    const result = await readBundledExtensibilityConfig();
    expect(result.metadata.id).toBe("bundled-app");
    expect(result.metadata.displayName).toBe("Bundled App");
    expect(result.metadata.description).toBe("A bundled application");
    expect(result.metadata.version).toBe("2.0.0");
  });

  test("should throw when bundled config file is not found", async () => {
    vol.fromJSON({});

    await expect(readBundledExtensibilityConfig()).rejects.toThrow(
      "Failed to read bundled extensibility config file",
    );
  });

  test("should throw when bundled config has invalid JSON", async () => {
    vol.fromJSON({
      "app-management/extensibility.manifest.json": "{ invalid json }",
    });

    await expect(readBundledExtensibilityConfig()).rejects.toThrow(
      "Failed to read bundled extensibility config file",
    );
  });

  test("should throw when bundled config is invalid", async () => {
    const invalidConfig = {
      metadata: {
        id: "invalid id!",
        displayName: "Test",
        description: "Test",
        version: "1.0.0",
      },
    };

    vol.fromJSON({
      "app-management/extensibility.manifest.json":
        JSON.stringify(invalidConfig),
    });

    await expect(readBundledExtensibilityConfig()).rejects.toThrow(
      "Failed to read bundled extensibility config file",
    );
  });

  test("should validate complete config with business schema", async () => {
    const mockConfig = {
      metadata: {
        id: "complete-app",
        displayName: "Complete App",
        description: "A complete application",
        version: "1.0.0",
      },
      businessConfig: {
        schema: [
          {
            name: "apiKey",
            type: "text",
            label: "API Key",
          },
        ],
      },
    };

    vol.fromJSON({
      "app-management/extensibility.manifest.json": JSON.stringify(mockConfig),
    });

    const result = await readBundledExtensibilityConfig();
    expect(result.metadata.id).toBe("complete-app");
    expect(result.metadata.displayName).toBe("Complete App");
    expect(result.metadata.description).toBe("A complete application");
    expect(result.metadata.version).toBe("1.0.0");
    expect(result.businessConfig?.schema).toHaveLength(1);
    expect(result.businessConfig?.schema[0].name).toBe("apiKey");
  });
});
