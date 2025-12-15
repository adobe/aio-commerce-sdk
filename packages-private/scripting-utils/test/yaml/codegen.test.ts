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
import { buildRuntimeManifest, createOrUpdateExtConfig } from "#yaml/codegen";

import type { RuntimeManifest } from "#yaml/types";

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
});

describe("buildRuntimeManifest", () => {
  test("should build runtime manifest with packages and actions", () => {
    const doc = new Document({});
    const manifest = {
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
    };

    buildRuntimeManifest(doc, manifest);

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

  test("should use default license if not provided", () => {
    const doc = new Document({});
    const manifest = {
      packages: {
        "test-package": {
          actions: {
            "test-action": {
              function: "actions/test.js",
            },
          },
        },
      },
    };

    buildRuntimeManifest(doc, manifest);

    const license = doc.getIn([
      "runtimeManifest",
      "packages",
      "test-package",
      "license",
    ]);
    expect(license).toBe("Apache-2.0");
  });

  test("should handle action with includes", () => {
    const doc = new Document({});
    const manifest: RuntimeManifest = {
      packages: {
        "test-package": {
          actions: {
            "test-action": {
              function: "actions/test.js",
              include: [
                ["config.json", "config.json"],
                ["data.txt", "data.txt"],
              ],
            },
          },
        },
      },
    };

    buildRuntimeManifest(doc, manifest);

    const action = doc.getIn([
      "runtimeManifest",
      "packages",
      "test-package",
      "actions",
      "test-action",
    ]);
    expect(action).toBeDefined();
  });

  test("should replace actions map with new one", () => {
    const doc = new Document({
      runtimeManifest: {
        packages: {
          "test-package": {
            license: "MIT",
            actions: {
              "existing-action": {
                function: "actions/existing.js",
              },
            },
          },
        },
      },
    });

    const manifest = {
      packages: {
        "test-package": {
          actions: {
            "new-action": {
              function: "actions/new.js",
            },
          },
        },
      },
    };

    buildRuntimeManifest(doc, manifest);

    // Should create new actions map (replaces old one)
    const newAction = doc.getIn([
      "runtimeManifest",
      "packages",
      "test-package",
      "actions",
      "new-action",
    ]);
    expect(newAction).toBeDefined();

    // Old action should not exist in new map
    const existingAction = doc.getIn([
      "runtimeManifest",
      "packages",
      "test-package",
      "actions",
      "existing-action",
    ]);
    expect(existingAction).toBeUndefined();
  });

  test("should handle empty packages", () => {
    const doc = new Document({});
    const manifest = {
      packages: {},
    };

    buildRuntimeManifest(doc, manifest);

    expect(doc.has("runtimeManifest")).toBe(true);
    expect(doc.getIn(["runtimeManifest", "packages"])).toBeDefined();
  });

  test("should handle package without actions", () => {
    const doc = new Document({});
    const manifest = {
      packages: {
        "test-package": {
          license: "MIT",
        },
      },
    };

    buildRuntimeManifest(doc, manifest);

    const pkg = doc.getIn(["runtimeManifest", "packages", "test-package"]);
    expect(pkg).toBeDefined();
    expect(
      doc.getIn(["runtimeManifest", "packages", "test-package", "license"]),
    ).toBe("MIT");
  });
});
