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

import { withTempFiles } from "@aio-commerce-sdk/scripting-utils/filesystem";
import { describe, expect, test } from "vitest";

import {
  parseCommerceAppConfig,
  readCommerceAppConfig,
  resolveCommerceAppConfig,
} from "#config/lib/parser";

describe("resolveExtensibilityConfig", () => {
  test("should return null when no package.json is found", () => {
    withTempFiles({}, async (tempDir) => {
      const result = await resolveCommerceAppConfig(tempDir);
      expect(result).toBeNull();
    });
  });

  test("should resolve app config file", async () => {
    await withTempFiles(
      {
        "app.commerce.config.js": "export {}",
        "package.json": JSON.stringify({ name: "test-app" }),
      },
      async (tempDir) => {
        const result = await resolveCommerceAppConfig(tempDir);
        expect(result).toContain("app.commerce.config.js");
      },
    );
  });

  test("should return null when commerce app config file is not found", async () => {
    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test-app" }),
      },
      async (tempDir) => {
        const result = await resolveCommerceAppConfig(tempDir);
        expect(result).toBeNull();
      },
    );
  });

  test("should find app.commerce.config.ts", async () => {
    await withTempFiles(
      {
        "app.commerce.config.ts": "export default {};",
        "package.json": JSON.stringify({ name: "test-app" }),
      },
      async (tempDir) => {
        const result = await resolveCommerceAppConfig(tempDir);
        expect(result).toContain("app.commerce.config.ts");
      },
    );
  });

  test("should find app.commerce.config.mjs", async () => {
    await withTempFiles(
      {
        "app.commerce.config.mjs": "export default {};",
        "package.json": JSON.stringify({ name: "test-app" }),
      },
      async (tempDir) => {
        const result = await resolveCommerceAppConfig(tempDir);
        expect(result).toContain("app.commerce.config.mjs");
      },
    );
  });

  test("should find app.commerce.config.mts", async () => {
    await withTempFiles(
      {
        "app.commerce.config.mts": "export default {};",
        "package.json": JSON.stringify({ name: "test-app" }),
      },
      async (tempDir) => {
        const result = await resolveCommerceAppConfig(tempDir);
        expect(result).toContain("app.commerce.config.mts");
      },
    );
  });

  test("should find app.commerce.config.cjs", async () => {
    await withTempFiles(
      {
        "app.commerce.config.cjs": "module.exports = {};",
        "package.json": JSON.stringify({ name: "test-app" }),
      },
      async (tempDir) => {
        const result = await resolveCommerceAppConfig(tempDir);
        expect(result).toContain("app.commerce.config.cjs");
      },
    );
  });

  test("should find app.commerce.config.cts", async () => {
    await withTempFiles(
      {
        "app.commerce.config.cts": "export default {};",
        "package.json": JSON.stringify({ name: "test-app" }),
      },
      async (tempDir) => {
        const result = await resolveCommerceAppConfig(tempDir);
        expect(result).toContain("app.commerce.config.cts");
      },
    );
  });

  test("should prioritize .js over .ts", async () => {
    await withTempFiles(
      {
        "app.commerce.config.js": "export default {};",
        "app.commerce.config.ts": "export default {};",
        "package.json": JSON.stringify({ name: "test-app" }),
      },
      async (tempDir) => {
        const result = await resolveCommerceAppConfig(tempDir);
        expect(result).toContain("app.commerce.config.js");
      },
    );
  });

  test("should prioritize .ts over .mjs", async () => {
    await withTempFiles(
      {
        "app.commerce.config.mjs": "export default {};",
        "app.commerce.config.ts": "export default {};",
        "package.json": JSON.stringify({ name: "test-app" }),
      },
      async (tempDir) => {
        const result = await resolveCommerceAppConfig(tempDir);
        expect(result).toContain("app.commerce.config.ts");
      },
    );
  });

  test("should prioritize .cjs over .mjs", async () => {
    await withTempFiles(
      {
        "app.commerce.config.cjs": "module.exports = {};",
        "app.commerce.config.mjs": "export default {};",
        "package.json": JSON.stringify({ name: "test-app" }),
      },
      async (tempDir) => {
        const result = await resolveCommerceAppConfig(tempDir);
        expect(result).toContain("app.commerce.config.cjs");
      },
    );
  });

  test("should find config in parent directory", async () => {
    await withTempFiles(
      {
        "app.commerce.config.js": "export default {};",
        "package.json": JSON.stringify({ name: "test-app" }),
        "src/components/dummy.txt": "",
      },
      async (tempDir) => {
        const { join } = await import("node:path");
        const result = await resolveCommerceAppConfig(
          join(tempDir, "src/components"),
        );
        expect(result).toContain("app.commerce.config.js");
      },
    );
  });

  test("should stop at package.json directory", async () => {
    await withTempFiles(
      {
        "app.commerce.config.js": "export default {};",
        "package.json": JSON.stringify({ name: "root-project" }),
        "project/package.json": JSON.stringify({ name: "nested-project" }),
      },
      async (tempDir) => {
        const { join } = await import("node:path");
        const result = await resolveCommerceAppConfig(join(tempDir, "project"));
        expect(result).toBeNull();
      },
    );
  });
});

describe("readExtensibilityConfig", () => {
  test("should throw when no config file exists", async () => {
    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test-project" }),
      },
      async (tempDir) => {
        await expect(readCommerceAppConfig(tempDir)).rejects.toThrow(
          "Could not find a commerce app config file in the current working directory or its parents.",
        );
      },
    );
  });

  test("should read a valid config file", async () => {
    const configContent = `
      module.exports = {
        metadata: {
          id: "test-app",
          displayName: "Test App",
          description: "A test application",
          version: "1.0.0",
        },
      };
    `;

    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test-project" }),
        "app.commerce.config.js": configContent,
      },
      async (tempDir) => {
        const result = (await readCommerceAppConfig(tempDir)) as {
          metadata: { id: string; displayName: string };
        };

        expect(result.metadata.id).toBe("test-app");
        expect(result.metadata.displayName).toBe("Test App");
      },
    );
  });

  test("should throw when config has no exports", async () => {
    const configContent = `
      // No exports at all
    `;

    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test-project" }),
        "app.commerce.config.js": configContent,
      },
      async (tempDir) => {
        await expect(readCommerceAppConfig(tempDir)).rejects.toThrow(
          "does not export a default export",
        );
      },
    );
  });

  test("should read config with business schema", async () => {
    const configContent = `
      module.exports = {
        metadata: {
          id: "app-with-schema",
          displayName: "App with Schema",
          description: "An app with business config",
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
    `;

    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test-project" }),
        "app.commerce.config.js": configContent,
      },
      async (tempDir) => {
        const result = (await readCommerceAppConfig(tempDir)) as {
          metadata: { id: string; displayName: string };
          businessConfig: {
            schema: { name: string; type: string; label: string }[];
          };
        };

        expect(result.metadata.id).toBe("app-with-schema");
        expect(result.businessConfig?.schema).toHaveLength(1);
        expect(result.businessConfig?.schema[0].name).toBe("apiKey");
      },
    );
  });

  test("should read TypeScript config file (.ts)", async () => {
    const configContent = `
      export default {
        metadata: {
          id: "ts-app",
          displayName: "TypeScript App",
          description: "A TypeScript application",
          version: "1.0.0",
        },
      };
    `;

    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test-project" }),
        "app.commerce.config.ts": configContent,
      },
      async (tempDir) => {
        const result = (await readCommerceAppConfig(tempDir)) as {
          metadata: { id: string; displayName: string };
        };
        expect(result.metadata.id).toBe("ts-app");
        expect(result.metadata.displayName).toBe("TypeScript App");
      },
    );
  });

  test("should read ESM config file (.mjs)", async () => {
    const configContent = `
      export default {
        metadata: {
          id: "esm-app",
          displayName: "ESM App",
          description: "An ESM application",
          version: "1.0.0",
        },
      };
    `;

    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test-project" }),
        "app.commerce.config.mjs": configContent,
      },
      async (tempDir) => {
        const result = (await readCommerceAppConfig(tempDir)) as {
          metadata: { id: string; displayName: string };
        };
        expect(result.metadata.id).toBe("esm-app");
        expect(result.metadata.displayName).toBe("ESM App");
      },
    );
  });

  test("should read CommonJS config file (.cjs)", async () => {
    const configContent = `
      module.exports = {
        metadata: {
          id: "cjs-app",
          displayName: "CJS App",
          description: "A CommonJS application",
          version: "1.0.0",
        },
      };
    `;

    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test-project" }),
        "app.commerce.config.cjs": configContent,
      },
      async (tempDir) => {
        const result = (await readCommerceAppConfig(tempDir)) as {
          metadata: { id: string; displayName: string };
        };
        expect(result.metadata.id).toBe("cjs-app");
        expect(result.metadata.displayName).toBe("CJS App");
      },
    );
  });
});

describe("parseExtensibilityConfig", () => {
  test("should parse and validate a valid config", async () => {
    const configContent = `
      module.exports = {
        metadata: {
          id: "valid-app",
          displayName: "Valid App",
          description: "A valid application",
          version: "1.0.0",
        },
      };
    `;

    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test-project" }),
        "app.commerce.config.js": configContent,
      },
      async (tempDir) => {
        const result = await parseCommerceAppConfig(tempDir);
        expect(result.metadata.id).toBe("valid-app");
        expect(result.metadata.displayName).toBe("Valid App");
      },
    );
  });

  test("should throw when config is invalid", async () => {
    const configContent = `
      module.exports = {
        metadata: {
          id: "invalid id!",
          displayName: "Invalid App",
          description: "An invalid application",
          version: "1.0.0",
        },
      };
    `;

    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test-project" }),
        "app.commerce.config.js": configContent,
      },
      async (tempDir) => {
        await expect(parseCommerceAppConfig(tempDir)).rejects.toThrow(
          "Invalid commerce app config",
        );
      },
    );
  });

  test("should throw on invalid syntax", async () => {
    const configContent = `
      export default {
        metadata: {
          // Use invalid quotes: “ instead of "
          id: “invalid-app“,
          displayName: "Invalid App",
          description: "An invalid application",
          version: "1.0.0",
        },
      };
    `;

    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test-project" }),
        "app.commerce.config.js": configContent,
      },
      async (tempDir) => {
        await expect(parseCommerceAppConfig(tempDir)).rejects.toThrow();
      },
    );
  });

  test("should throw when metadata is missing", async () => {
    const configContent = `
      module.exports = {
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
    `;

    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test-project" }),
        "app.commerce.config.js": configContent,
      },
      async (tempDir) => {
        await expect(parseCommerceAppConfig(tempDir)).rejects.toThrow(
          "Invalid commerce app config",
        );
      },
    );
  });

  test("should throw when version is invalid", async () => {
    const configContent = `
      module.exports = {
        metadata: {
          id: "test-app",
          displayName: "Test App",
          description: "A test application",
          version: "invalid-version",
        },
      };
    `;

    await withTempFiles(
      {
        "package.json": JSON.stringify({ name: "test-project" }),
        "app.commerce.config.js": configContent,
      },
      async (tempDir) => {
        await expect(parseCommerceAppConfig(tempDir)).rejects.toThrow(
          "Invalid commerce app config",
        );
      },
    );
  });
});
