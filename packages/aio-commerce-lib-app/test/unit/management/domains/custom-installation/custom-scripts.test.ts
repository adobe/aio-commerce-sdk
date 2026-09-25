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

import { hasCustomInstallationSteps } from "#config/index";
import { createCustomScriptSteps } from "#management/domains/custom-installation/custom-scripts";
import {
  configWithCustomInstallationSteps,
  minimalValidConfig,
} from "#test/fixtures/config";

describe("hasCustomInstallationSteps", () => {
  test("should return false when config has no installation property", () => {
    expect(hasCustomInstallationSteps(minimalValidConfig)).toBe(false);
  });

  test("should return false when config has no customInstallationSteps", () => {
    const config = { ...minimalValidConfig, installation: {} };
    expect(hasCustomInstallationSteps(config)).toBe(false);
  });

  test("should return false when customInstallationSteps is empty array", () => {
    const config = {
      ...minimalValidConfig,
      installation: { customInstallationSteps: [] },
    };

    expect(hasCustomInstallationSteps(config)).toBe(false);
  });

  test("should return true when customInstallationSteps has items", () => {
    expect(hasCustomInstallationSteps(configWithCustomInstallationSteps)).toBe(
      true,
    );
  });
});

describe("createCustomScriptSteps", () => {
  test("should return empty array when config has no custom steps", () => {
    const steps = createCustomScriptSteps(minimalValidConfig);
    expect(steps).toEqual([]);
  });

  test("should create one leaf step per custom script", () => {
    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);

    expect(steps.length).toBe(2);

    // Verify each step is a leaf step with correct metadata
    expect(steps[0].type).toBe("leaf");
    expect(steps[0].name).toBe("demoSuccess");
    expect(steps[0].meta.install.label).toBe("Demo Success");
    expect(steps[0].meta.install.description).toBe("Success script");

    expect(steps[1].type).toBe("leaf");
    expect(steps[1].name).toBe("demoError");
    expect(steps[1].meta.install.label).toBe("Demo Error");
    expect(steps[1].meta.install.description).toBe("Error script");
  });

  test("should throw if multiple steps have the same name", () => {
    // Grab the config and duplicate a step.
    const config = structuredClone(configWithCustomInstallationSteps);
    config.installation.customInstallationSteps.push(
      config.installation.customInstallationSteps[0],
    );

    expect(() => createCustomScriptSteps(config)).toThrow();
  });

  test("should convert step names to camelCase", () => {
    const config = {
      ...minimalValidConfig,
      installation: {
        customInstallationSteps: [
          {
            description: "A test step",
            name: "My Custom Step",
            script: "./my-script.js",
          },
        ],
      },
    };

    const steps = createCustomScriptSteps(config);
    expect(steps).toHaveLength(1);
    expect(steps[0].name).toBe("myCustomStep");
  });
});
