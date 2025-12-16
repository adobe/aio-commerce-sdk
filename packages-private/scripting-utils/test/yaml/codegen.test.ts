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

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, test } from "vitest";
import { Document, parseDocument } from "yaml";

import { withTempFiles } from "#filesystem/temp";
import { createOrUpdateExtConfig } from "#yaml/codegen";

describe("createOrUpdateExtConfig", () => {
  test("should create a new ext.config.yaml file", async () => {
    await withTempFiles({}, async (tempDir) => {
      const configPath = join(tempDir, "ext.config.yaml");
      const config = {
        hooks: {
          "pre-app-build": "$packageExec generate-manifest",
        },
        operations: {
          workerProcess: [
            {
              type: "action" as const,
              impl: "my-action",
            },
          ],
        },
        runtimeManifest: {
          packages: {
            "my-package": {
              license: "Apache-2.0",
              actions: {
                "my-action": {
                  function: "actions/my-action.js",
                  web: "yes",
                  runtime: "nodejs:22",
                },
              },
            },
          },
        },
      };

      // Initialize document with empty object so it has contents
      const doc = await createOrUpdateExtConfig(
        configPath,
        config,
        new Document({}),
      );

      // Verify document structure
      expect(doc.has("hooks")).toBe(true);
      expect(doc.has("operations")).toBe(true);
      expect(doc.has("runtimeManifest")).toBe(true);

      // Verify file was written
      const fileContent = await readFile(configPath, "utf-8");
      expect(fileContent).toContain("hooks:");
      expect(fileContent).toContain("operations:");
      expect(fileContent).toContain("runtimeManifest:");
    });
  });

  test("should update existing ext.config.yaml file", async () => {
    const existingConfig = `
hooks:
  existing-hook: echo "existing"

operations:
  workerProcess: []

runtimeManifest:
  packages: {}
`;

    await withTempFiles(
      {
        "ext.config.yaml": existingConfig,
      },
      async (tempDir) => {
        const configPath = join(tempDir, "ext.config.yaml");
        const existingDoc = parseDocument(existingConfig);

        const config = {
          hooks: {
            "new-hook": "echo 'new'",
          },
          operations: {
            workerProcess: [],
          },
          runtimeManifest: {
            packages: {},
          },
        };

        await createOrUpdateExtConfig(configPath, config, existingDoc);

        // Verify both hooks exist
        const fileContent = await readFile(configPath, "utf-8");
        expect(fileContent).toContain("existing-hook");
        expect(fileContent).toContain("new-hook");
      },
    );
  });

  test("should handle empty config", async () => {
    await withTempFiles({}, async (tempDir) => {
      const configPath = join(tempDir, "ext.config.yaml");
      const config = {};

      // Initialize document with empty object
      const doc = await createOrUpdateExtConfig(
        configPath,
        config,
        new Document({}),
      );

      // Should have default empty structures
      expect(doc.has("hooks")).toBe(true);
      expect(doc.has("operations")).toBe(true);
      expect(doc.has("runtimeManifest")).toBe(true);
    });
  });

  test("should create document when none is provided", async () => {
    await withTempFiles({}, async (tempDir) => {
      const configPath = join(tempDir, "ext.config.yaml");
      const config = {
        hooks: {
          "test-hook": "echo test",
        },
      };

      // Don't pass a document - tests line 38 (doc ?? new Document({}))
      const doc = await createOrUpdateExtConfig(configPath, config);

      expect(doc).toBeInstanceOf(Document);
      expect(doc.has("hooks")).toBe(true);
      expect(doc.get("hooks")).toBeDefined();
    });
  });

  test("should handle config without operations.workerProcess", async () => {
    await withTempFiles({}, async (tempDir) => {
      const configPath = join(tempDir, "ext.config.yaml");
      const config = {
        operations: {
          // No workerProcess - tests line 114 (operations.workerProcess ?? [])
        },
      };

      const doc = await createOrUpdateExtConfig(
        configPath,
        config,
        new Document({}),
      );

      expect(doc.has("operations")).toBe(true);
    });
  });

  test("should handle config without runtimeManifest.packages", async () => {
    await withTempFiles({}, async (tempDir) => {
      const configPath = join(tempDir, "ext.config.yaml");
      const config = {
        runtimeManifest: {
          // No packages - tests line 148 (manifest.packages ?? {})
        },
      };

      const doc = await createOrUpdateExtConfig(
        configPath,
        config,
        new Document({}),
      );

      expect(doc.has("runtimeManifest")).toBe(true);
    });
  });

  test("should build runtime manifest with packages and actions", async () => {
    await withTempFiles({}, async (tempDir) => {
      const configPath = join(tempDir, "ext.config.yaml");
      const config = {
        runtimeManifest: {
          packages: {
            "test-package": {
              license: "MIT",
              actions: {
                "test-action": {
                  function: "actions/test.js",
                  web: "yes",
                  runtime: "nodejs:20",
                },
              },
            },
          },
        },
      };

      const doc = await createOrUpdateExtConfig(
        configPath,
        config,
        new Document({}),
      );

      expect(doc.has("runtimeManifest")).toBe(true);
      expect(
        doc.getIn(["runtimeManifest", "packages", "test-package"]),
      ).toBeDefined();
      expect(
        doc.getIn([
          "runtimeManifest",
          "packages",
          "test-package",
          "actions",
          "test-action",
        ]),
      ).toBeDefined();
    });
  });

  test("should use default license if not provided", async () => {
    await withTempFiles({}, async (tempDir) => {
      const configPath = join(tempDir, "ext.config.yaml");
      const config = {
        runtimeManifest: {
          packages: {
            "test-package": {
              actions: {
                "test-action": {
                  function: "actions/test.js",
                },
              },
            },
          },
        },
      };

      const doc = await createOrUpdateExtConfig(
        configPath,
        config,
        new Document({}),
      );

      const license = doc.getIn([
        "runtimeManifest",
        "packages",
        "test-package",
        "license",
      ]);
      expect(license).toBe("Apache-2.0");
    });
  });

  test("should handle action with includes", async () => {
    await withTempFiles({}, async (tempDir) => {
      const configPath = join(tempDir, "ext.config.yaml");
      const config = {
        runtimeManifest: {
          packages: {
            "test-package": {
              actions: {
                "test-action": {
                  function: "actions/test.js",
                  include: [
                    ["config.json", "config.json"] as [string, string],
                    ["data.txt", "data.txt"] as [string, string],
                  ],
                },
              },
            },
          },
        },
      };

      const doc = await createOrUpdateExtConfig(
        configPath,
        config,
        new Document({}),
      );

      const action = doc.getIn([
        "runtimeManifest",
        "packages",
        "test-package",
        "actions",
        "test-action",
      ]);
      expect(action).toBeDefined();
    });
  });

  test("should not duplicate existing operations", async () => {
    const existingConfig = `
operations:
  workerProcess:
    - type: action
      impl: existing-action
`;

    await withTempFiles(
      {
        "ext.config.yaml": existingConfig,
      },
      async (tempDir) => {
        const configPath = join(tempDir, "ext.config.yaml");
        const existingDoc = parseDocument(existingConfig);

        const config = {
          operations: {
            workerProcess: [
              {
                type: "action" as const,
                impl: "existing-action",
              },
              {
                type: "action" as const,
                impl: "new-action",
              },
            ],
          },
        };

        await createOrUpdateExtConfig(configPath, config, existingDoc);

        const fileContent = await readFile(configPath, "utf-8");
        const doc = parseDocument(fileContent);

        const ops = doc.toJSON().operations.workerProcess;
        // Should have 2 operations: existing one + new one
        expect(ops).toHaveLength(2);
        expect(ops[0].impl).toBe("existing-action");
        expect(ops[1].impl).toBe("new-action");
      },
    );
  });

  test("should throw error when hook value ends with .js", async () => {
    const existingConfig = `
hooks:
  pre-app-build: scripts/build.js
`;

    await withTempFiles(
      {
        "ext.config.yaml": existingConfig,
      },
      async (tempDir) => {
        const configPath = join(tempDir, "ext.config.yaml");
        const existingDoc = parseDocument(existingConfig);

        const config = {
          hooks: {
            "pre-app-build": "echo 'test'",
          },
        };

        await expect(
          createOrUpdateExtConfig(configPath, config, existingDoc),
        ).rejects.toThrow(
          'Conflicting hook definition found. The "pre-app-build" hook needs to be a command, not a script.',
        );
      },
    );
  });

  test("should throw error when hook value ends with .ts", async () => {
    const existingConfig = `
hooks:
  pre-app-build: scripts/build.ts
`;

    await withTempFiles(
      {
        "ext.config.yaml": existingConfig,
      },
      async (tempDir) => {
        const configPath = join(tempDir, "ext.config.yaml");
        const existingDoc = parseDocument(existingConfig);

        const config = {
          hooks: {
            "pre-app-build": "echo 'test'",
          },
        };

        await expect(
          createOrUpdateExtConfig(configPath, config, existingDoc),
        ).rejects.toThrow(
          'Conflicting hook definition found. The "pre-app-build" hook needs to be a command, not a script.',
        );
      },
    );
  });

  test("should chain hooks when previous value exists", async () => {
    const existingConfig = `
hooks:
  pre-app-build: echo 'existing'
`;

    await withTempFiles(
      {
        "ext.config.yaml": existingConfig,
      },
      async (tempDir) => {
        const configPath = join(tempDir, "ext.config.yaml");
        const existingDoc = parseDocument(existingConfig);

        const config = {
          hooks: {
            "pre-app-build": "echo 'new'",
          },
        };

        await createOrUpdateExtConfig(configPath, config, existingDoc);

        const fileContent = await readFile(configPath, "utf-8");
        const doc = parseDocument(fileContent);

        const hookValue = doc.getIn(["hooks", "pre-app-build"]);
        // Should chain the commands with &&
        expect(hookValue).toContain("echo 'existing'");
        expect(hookValue).toContain("echo 'new'");
        expect(hookValue).toContain("&&");
      },
    );
  });

  test("should handle empty previous hook value", async () => {
    const existingConfig = `
hooks:
  pre-app-build: ""
`;

    await withTempFiles(
      {
        "ext.config.yaml": existingConfig,
      },
      async (tempDir) => {
        const configPath = join(tempDir, "ext.config.yaml");
        const existingDoc = parseDocument(existingConfig);

        const config = {
          hooks: {
            "pre-app-build": "echo 'new'",
          },
        };

        await createOrUpdateExtConfig(configPath, config, existingDoc);

        const fileContent = await readFile(configPath, "utf-8");
        const doc = parseDocument(fileContent);

        const hookValue = doc.getIn(["hooks", "pre-app-build"]);
        // Should just use the new value (not chain with empty)
        expect(hookValue).toBe("echo 'new'");
      },
    );
  });

  test("should not chain when command already included in empty hook", async () => {
    const existingConfig = `
hooks:
  pre-app-build: ""
`;

    await withTempFiles(
      {
        "ext.config.yaml": existingConfig,
      },
      async (tempDir) => {
        const configPath = join(tempDir, "ext.config.yaml");
        const existingDoc = parseDocument(existingConfig);

        const config = {
          hooks: {
            "pre-app-build": "echo 'test'",
          },
        };

        // First call
        await createOrUpdateExtConfig(configPath, config, existingDoc);

        // Read the updated doc
        const fileContent = await readFile(configPath, "utf-8");
        const updatedDoc = parseDocument(fileContent);

        // Second call with same command - tests line 201
        const config2 = {
          hooks: {
            "pre-app-build": "echo 'test'",
          },
        };

        await createOrUpdateExtConfig(configPath, config2, updatedDoc);

        const finalContent = await readFile(configPath, "utf-8");
        const finalDoc = parseDocument(finalContent);

        const hookValue = finalDoc.getIn(["hooks", "pre-app-build"]);
        // Should not duplicate the command
        expect(hookValue).toBe("echo 'test'");
      },
    );
  });
});
