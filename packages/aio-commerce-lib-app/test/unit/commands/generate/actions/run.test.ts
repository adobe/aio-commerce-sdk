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

import { describe, expect, test, vi } from "vitest";

import {
  CUSTOM_IMPORTS_PLACEHOLDER,
  CUSTOM_SCRIPTS_LOADER_PLACEHOLDER,
  CUSTOM_SCRIPTS_MAP_PLACEHOLDER,
} from "#commands/generate/actions/constants";
import {
  applyCustomScripts,
  generateCustomScriptsTemplate,
} from "#commands/generate/actions/run";
import { templates } from "#test/fixtures/commands";
import {
  configWithCustomInstallationSteps,
  minimalValidConfig,
} from "#test/fixtures/config";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

vi.mock("@aio-commerce-sdk/scripting-utils/project", () => ({
  getProjectRootDirectory: () => "/fake/project/root",
}));

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
        // The path re-calculation logic places the scripts 5 levels up from the generated file location
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
  });
});
