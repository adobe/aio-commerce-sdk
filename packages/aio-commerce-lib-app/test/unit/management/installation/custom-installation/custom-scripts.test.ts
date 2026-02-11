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

import {
  createCustomScriptSteps,
  hasCustomInstallationSteps,
} from "#management/installation/custom-installation/custom-scripts";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

const baseConfig: CommerceAppConfigOutputModel = {
  metadata: {
    id: "test-app",
    displayName: "Test App",
    description: "Test App",
    version: "1.0.0",
  },
};

describe("hasCustomInstallationSteps", () => {
  test("should return false when config has no installation property", () => {
    expect(hasCustomInstallationSteps(baseConfig)).toBe(false);
  });

  test("should return false when config has no customInstallationSteps", () => {
    const config = { ...baseConfig, installation: {} };
    expect(hasCustomInstallationSteps(config)).toBe(false);
  });

  test("should return false when customInstallationSteps is empty array", () => {
    const config = {
      ...baseConfig,
      installation: { customInstallationSteps: [] },
    };
    expect(hasCustomInstallationSteps(config)).toBe(false);
  });

  test("should return true when customInstallationSteps has items", () => {
    const config = {
      ...baseConfig,
      installation: {
        customInstallationSteps: [
          {
            script: "./scripts/my-script.js",
            name: "My Script",
            description: "Test",
          },
        ],
      },
    };
    expect(hasCustomInstallationSteps(config)).toBe(true);
  });
});

describe("createCustomScriptSteps", () => {
  test("should return empty array when config has no custom steps", () => {
    const steps = createCustomScriptSteps(baseConfig);

    expect(steps).toEqual([]);
  });

  test("should create one leaf step per custom script", () => {
    const config: CommerceAppConfigOutputModel = {
      ...baseConfig,
      installation: {
        customInstallationSteps: [
          {
            script: "./scripts/script1.js",
            name: "Script 1",
            description: "First script",
          },
          {
            script: "./scripts/script2.js",
            name: "Script 2",
            description: "Second script",
          },
          {
            script: "./scripts/script3.js",
            name: "Script 3",
            description: "Third script",
          },
        ],
      },
    };

    const steps = createCustomScriptSteps(config);

    if (!steps) {
      throw new Error("Expected steps to be defined");
    }

    expect(steps.length).toBe(3);

    // Verify each step is a leaf step with correct metadata
    expect(steps[0].type).toBe("leaf");
    expect(steps[0].name).toBe("Script 1");
    expect(steps[0].meta.label).toBe("Script 1");
    expect(steps[0].meta.description).toBe("First script");

    expect(steps[1].type).toBe("leaf");
    expect(steps[1].name).toBe("Script 2");
    expect(steps[1].meta.label).toBe("Script 2");

    expect(steps[2].type).toBe("leaf");
    expect(steps[2].name).toBe("Script 3");
    expect(steps[2].meta.label).toBe("Script 3");
  });
});
