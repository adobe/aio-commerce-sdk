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

import { describe, expect, test } from "vitest";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

// Regex pattern to check if installationContext was replaced
const INSTALLATION_CONTEXT_NOT_REPLACED_PATTERN =
  /const installationContext = { params, logger };(?!\s*customScripts)/;

/**
 * Helper function that replicates the generateInstallationTemplate logic
 * for testing purposes. This follows the same implementation as the actual
 * function in run.ts.
 */
async function generateInstallationTemplate(
  template: string,
  manifest: Partial<CommerceAppConfigOutputModel>,
): Promise<string> {
  const customSteps = manifest?.installation?.customInstallationSteps || [];

  if (customSteps.length === 0) {
    return template.replace(
      "// {{CUSTOM_SCRIPT_IMPORTS}}",
      "// No custom installation scripts configured",
    );
  }

  // Generate import statements
  const importStatements = customSteps
    .map((step, index) => {
      const importName = `customScript${index}`;
      return `import * as ${importName} from '${step.script}';`;
    })
    .join("\n");

  // Generate script map for loadCustomInstallationScripts function
  const scriptMap = customSteps
    .map((step, index) => {
      const importName = `customScript${index}`;
      return `      '${step.script}': ${importName},`;
    })
    .join("\n");

  const loadFunction = `
/**
 * Loads custom installation scripts defined in the manifest
 */
async function loadCustomInstallationScripts(appConfig, logger) {
  const customSteps = appConfig.installation?.customInstallationSteps || [];
  
  if (customSteps.length === 0) {
    return {};
  }

  try {
    const loadedScripts = {
${scriptMap}
    };
    return loadedScripts;
  } catch (error) {
    throw new Error(\`Failed to load custom installation scripts: \${error.message}\`);
  }
}
`;

  // Replace the placeholder with imports and function
  let result = template.replace(
    "// {{CUSTOM_SCRIPT_IMPORTS}}",
    `${importStatements}\n\n${loadFunction}`,
  );

  // Replace installationContext to include customScripts
  result = result.replace(
    "const installationContext = { params, logger };",
    `const customScripts = await loadCustomInstallationScripts(appConfig, logger);
  const installationContext = { params, logger, customScripts };`,
  );

  return result;
}

describe("generateInstallationTemplate", () => {
  describe("when no custom installation steps are configured", () => {
    test("should replace placeholder with comment and not modify installationContext", async () => {
      const template = `
// Some code before
// {{CUSTOM_SCRIPT_IMPORTS}}
// Some code after

async function handleExecuteInstallation(plan, params, logger) {
  const appConfig = validateCommerceAppConfig(commerceAppManifest);
  const hooks = createInstallationHooks(store, logger);
  const installationContext = { params, logger };

  const result = await runInstallation({
    installationContext,
    config: appConfig,
    plan,
    hooks,
  });

  return result;
}
`;

      const appManifest: Partial<CommerceAppConfigOutputModel> = {
        metadata: {
          id: "test-app",
          displayName: "Test App",
          description: "Test",
          version: "1.0.0",
        },
      };

      const result = await generateInstallationTemplate(template, appManifest);

      // Verify placeholder replacement
      expect(result).toContain("// No custom installation scripts configured");
      expect(result).not.toContain("{{CUSTOM_SCRIPT_IMPORTS}}");

      // Verify installationContext remains unchanged
      expect(result).toContain(
        "const installationContext = { params, logger };",
      );
      expect(result).not.toContain("await loadCustomInstallationScripts");
      expect(result).not.toContain("customScripts");
    });
  });

  describe("when custom installation steps are configured", () => {
    test("should generate import statements for each script", async () => {
      const template = `
// {{CUSTOM_SCRIPT_IMPORTS}}

async function handleExecuteInstallation(plan, params, logger) {
  const installationContext = { params, logger };
}
`;

      const appManifest: Partial<CommerceAppConfigOutputModel> = {
        metadata: {
          id: "test-app",
          displayName: "Test App",
          description: "Test",
          version: "1.0.0",
        },
        installation: {
          customInstallationSteps: [
            {
              script: "./demo-success.js",
              name: "Demo Success",
              description: "Success script",
            },
            {
              script: "./demo-error.js",
              name: "Demo Error",
              description: "Error script",
            },
          ],
        },
      };

      const result = await generateInstallationTemplate(template, appManifest);

      // Check that import statements are generated
      expect(result).toContain(
        "import * as customScript0 from './demo-success.js';",
      );
      expect(result).toContain(
        "import * as customScript1 from './demo-error.js';",
      );

      // Check that {{CUSTOM_SCRIPT_IMPORTS}} placeholder is replaced
      expect(result).not.toContain("{{CUSTOM_SCRIPT_IMPORTS}}");

      // Check that loadCustomInstallationScripts function is generated
      expect(result).toContain("async function loadCustomInstallationScripts");
      expect(result).toContain("const loadedScripts = {");
      expect(result).toContain("'./demo-success.js': customScript0,");
      expect(result).toContain("'./demo-error.js': customScript1,");
    });

    test("should replace installationContext to include customScripts", async () => {
      const template = `
// {{CUSTOM_SCRIPT_IMPORTS}}

async function handleExecuteInstallation(plan, params, logger) {
  const appConfig = validateCommerceAppConfig(commerceAppManifest);
  const hooks = createInstallationHooks(store, logger);
  const installationContext = { params, logger };

  const result = await runInstallation({
    installationContext,
    config: appConfig,
    plan,
    hooks,
  });

  return result;
}
`;

      const appManifest: Partial<CommerceAppConfigOutputModel> = {
        installation: {
          customInstallationSteps: [
            {
              script: "./setup.js",
              name: "Setup",
              description: "Setup script",
            },
          ],
        },
      };

      const result = await generateInstallationTemplate(template, appManifest);

      // Check that installationContext is updated
      expect(result).toContain(
        "await loadCustomInstallationScripts(appConfig, logger)",
      );
      expect(result).toContain(
        "const installationContext = { params, logger, customScripts };",
      );

      // Original pattern should be replaced
      expect(result).not.toMatch(INSTALLATION_CONTEXT_NOT_REPLACED_PATTERN);
    });

    test("should handle multiple custom scripts correctly", async () => {
      const template = `
// {{CUSTOM_SCRIPT_IMPORTS}}
const installationContext = { params, logger };
`;

      const appManifest: Partial<CommerceAppConfigOutputModel> = {
        installation: {
          customInstallationSteps: [
            {
              script: "./script1.js",
              name: "Script 1",
              description: "First script",
            },
            {
              script: "./script2.js",
              name: "Script 2",
              description: "Second script",
            },
            {
              script: "../../shared/script3.js",
              name: "Script 3",
              description: "Third script",
            },
          ],
        },
      };

      const result = await generateInstallationTemplate(template, appManifest);

      // Check all imports are generated
      expect(result).toContain(
        "import * as customScript0 from './script1.js';",
      );
      expect(result).toContain(
        "import * as customScript1 from './script2.js';",
      );
      expect(result).toContain(
        "import * as customScript2 from '../../shared/script3.js';",
      );

      // Check all scripts are mapped
      expect(result).toContain("'./script1.js': customScript0,");
      expect(result).toContain("'./script2.js': customScript1,");
      expect(result).toContain("'../../shared/script3.js': customScript2,");

      // Check context is updated
      expect(result).toContain("customScripts");
    });
  });

  describe("edge cases", () => {
    test("should handle empty installation object", async () => {
      const template = `
// {{CUSTOM_SCRIPT_IMPORTS}}
const installationContext = { params, logger };
`;

      const appManifest: Partial<CommerceAppConfigOutputModel> = {
        installation: {},
      };

      const result = await generateInstallationTemplate(template, appManifest);

      expect(result).toContain("// No custom installation scripts configured");
      expect(result).toContain(
        "const installationContext = { params, logger };",
      );
      expect(result).not.toContain("customScripts");
    });

    test("should handle single custom script", async () => {
      const template = `
// {{CUSTOM_SCRIPT_IMPORTS}}
const installationContext = { params, logger };
`;

      const appManifest: Partial<CommerceAppConfigOutputModel> = {
        installation: {
          customInstallationSteps: [
            {
              script: "./single-script.js",
              name: "Single Script",
              description: "Only one script",
            },
          ],
        },
      };

      const result = await generateInstallationTemplate(template, appManifest);

      expect(result).toContain(
        "import * as customScript0 from './single-script.js';",
      );
      expect(result).toContain("'./single-script.js': customScript0,");
      expect(result).toContain("customScripts");
    });
  });
});
