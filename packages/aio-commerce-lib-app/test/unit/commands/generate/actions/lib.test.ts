/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { readFile, writeFile } from "node:fs/promises";

const QUOTED_MENU_ITEMS_RE = /"menuItems":/u;

import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  BACKEND_UI_EXTENSION_POINT_ID,
  EXTENSIBILITY_EXTENSION_POINT_ID,
} from "#commands/constants";
import {
  CUSTOM_IMPORTS_PLACEHOLDER,
  CUSTOM_SCRIPTS_LOADER_PLACEHOLDER,
  CUSTOM_SCRIPTS_MAP_PLACEHOLDER,
} from "#commands/generate/actions/config";
import {
  applyCustomScripts,
  generateCustomScriptsTemplate,
  generateRegistrationActionFile,
  readExtConfig,
} from "#commands/generate/actions/lib";
import { templates } from "#test/fixtures/commands";
import {
  configWithCustomInstallationSteps,
  configWithFullAdminUiSdk,
  minimalValidConfig,
} from "#test/fixtures/config";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

vi.mock("@aio-commerce-sdk/scripting-utils/project", () => ({
  getProjectRootDirectory: () => "/fake/project/root",
  makeOutputDirFor: vi.fn(() => Promise.resolve("/fake/output/dir")),
}));

vi.mock("@aio-commerce-sdk/scripting-utils/yaml/index", () => ({
  readYamlFile: vi.fn(),
}));

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    readFile: vi.fn(),
    writeFile: vi.fn().mockResolvedValue(undefined),
  };
});

describe("readExtConfig", () => {
  test("throws a helpful error when ext.config.yaml is missing", async () => {
    const { readYamlFile } = await import(
      "@aio-commerce-sdk/scripting-utils/yaml/index"
    );

    vi.mocked(readYamlFile).mockRejectedValue(new Error("ENOENT"));

    await expect(
      readExtConfig(EXTENSIBILITY_EXTENSION_POINT_ID),
    ).rejects.toThrow(
      "Could not read ext.config.yaml for commerce/extensibility/1",
    );
  });
});

describe("applyCustomScripts", () => {
  describe("when no custom installation steps are configured", () => {
    test("should not replace args or import customScriptsLoader", async () => {
      const scriptsTemplate = await generateCustomScriptsTemplate(
        templates.customScripts,
        minimalValidConfig,
      );

      const result = applyCustomScripts(
        templates.installation,
        scriptsTemplate,
      );

      expect(result).toContain("const args = { appConfig };");
      expect(result).toContain("// No custom installation scripts configured");
      expect(result).not.toContain("function customScriptsLoader");
      expect(result).not.toContain(CUSTOM_SCRIPTS_LOADER_PLACEHOLDER);
    });
  });

  describe("when custom installation steps are configured", () => {
    test("should replace args with customScriptsLoader and import the loader", async () => {
      const scriptsTemplate = await generateCustomScriptsTemplate(
        templates.customScripts,
        configWithCustomInstallationSteps,
      );

      const result = applyCustomScripts(
        templates.installation,
        scriptsTemplate,
      );

      expect(result).toContain("function customScriptsLoader");
      expect(result).toContain(
        "const args = { appConfig, customScriptsLoader };",
      );

      expect(result).not.toContain(CUSTOM_SCRIPTS_LOADER_PLACEHOLDER);
    });
  });

  describe("edge cases", () => {
    test("should handle empty installation object", async () => {
      const appManifest: Partial<CommerceAppConfigOutputModel> = {
        installation: {},
      };

      const scriptsTemplate = await generateCustomScriptsTemplate(
        templates.customScripts,
        appManifest as CommerceAppConfigOutputModel,
      );

      const result = applyCustomScripts(
        templates.installation,
        scriptsTemplate,
      );

      expect(result).toContain("const args = { appConfig };");
      expect(result).toContain("// No custom installation scripts configured");
      expect(result).not.toContain("function customScriptsLoader");
    });
  });
});

describe("generateCustomScriptsTemplate", () => {
  describe("when no custom installation steps are configured", () => {
    test("should return null", async () => {
      const result = await generateCustomScriptsTemplate(
        templates.customScripts,
        minimalValidConfig,
      );

      expect(result).toBeNull();
    });
  });

  describe("when custom installation steps are configured", () => {
    test("should generate import statements for each script and script map", async () => {
      const result = await generateCustomScriptsTemplate(
        templates.customScripts,
        configWithCustomInstallationSteps,
      );

      const expectedImports = [
        'import * as customScript0 from "../../../../../demo-success.js";',
        'import * as customScript1 from "../../../../../demo-error.js";',
      ];

      const expectedScriptMapEntries = [
        '"./demo-success.js": customScript0,',
        '"./demo-error.js": customScript1,',
      ];

      expect(result).not.toContain(CUSTOM_IMPORTS_PLACEHOLDER);
      expect(result).not.toContain(CUSTOM_SCRIPTS_MAP_PLACEHOLDER);

      for (const entry of expectedScriptMapEntries) {
        expect(result).toContain(entry);
      }

      for (const importStatement of expectedImports) {
        expect(result).toContain(importStatement);
      }
    });
  });

  describe("edge cases", () => {
    test("should handle empty installation object", async () => {
      const appManifest: Partial<CommerceAppConfigOutputModel> = {
        installation: {},
      };

      const result = await generateCustomScriptsTemplate(
        templates.customScripts,
        appManifest as CommerceAppConfigOutputModel,
      );

      expect(result).toBeNull();
    });

    test("prefixes a bare relative import path with './' when the script resolves inside the generated actions dir", async () => {
      const appManifest: Partial<CommerceAppConfigOutputModel> = {
        installation: {
          customInstallationSteps: [
            {
              script:
                "src/commerce-extensibility-1/.generated/actions/app-management/nested.js",
              name: "Nested",
              description: "Script inside the generated actions dir",
            },
          ],
        },
      };

      const result = await generateCustomScriptsTemplate(
        templates.customScripts,
        appManifest as CommerceAppConfigOutputModel,
      );

      expect(result).toContain('import * as customScript0 from "./nested.js"');
    });
  });
});

describe("generateRegistrationActionFile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readFile).mockResolvedValue(templates.registration);
  });

  test("writes registration.js with inlined registration JSON", async () => {
    const mockReadFile = vi.mocked(readFile);
    const mockWriteFile = vi.mocked(writeFile);

    await generateRegistrationActionFile(
      configWithFullAdminUiSdk,
      BACKEND_UI_EXTENSION_POINT_ID,
    );

    expect(mockReadFile).toHaveBeenCalledOnce();
    expect(mockWriteFile).toHaveBeenCalledOnce();

    const [_path, content] = mockWriteFile.mock.calls[0];
    const contentStr = content as string;

    expect(contentStr).toContain("// This file has been auto-generated");
    expect(contentStr).toContain(
      'import { registrationRuntimeAction } from "@adobe/aio-commerce-lib-app/actions/registration"',
    );
    expect(contentStr).toContain("const registration =");
    expect(contentStr).toContain(
      "export const main = registrationRuntimeAction({ registration })",
    );
    expect(contentStr).toContain('"my_app::first"');
    expect(contentStr).toContain("selectionLimit: 1");
    expect(contentStr).toContain("productSelectLimit: 1");
    expect(contentStr).toContain("customerSelectLimit: 1");
    expect(contentStr).toContain("menuItems: [");
    expect(contentStr).not.toMatch(QUOTED_MENU_ITEMS_RE);
  });

  test("writes to registration/index.js", async () => {
    const mockWriteFile = vi.mocked(writeFile);

    await generateRegistrationActionFile(
      configWithFullAdminUiSdk,
      BACKEND_UI_EXTENSION_POINT_ID,
    );

    const [filePath] = mockWriteFile.mock.calls[0];
    expect(String(filePath)).toContain("index.js");
  });
});
