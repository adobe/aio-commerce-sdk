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

import { hasCustomInstallationSteps } from "#config/index";
import { createCustomScriptSteps } from "#management/installation/custom-installation/custom-scripts";
import {
  configWithCustomInstallationSteps,
  minimalValidConfig,
} from "#test/fixtures/config";
import { createMockInstallationContext } from "#test/fixtures/installation";

import type { LeafStep } from "#management/installation/workflow/step";

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
    expect(steps[0].meta.label).toBe("Demo Success");
    expect(steps[0].meta.description).toBe("Success script");

    expect(steps[1].type).toBe("leaf");
    expect(steps[1].name).toBe("demoError");
    expect(steps[1].meta.label).toBe("Demo Error");
    expect(steps[1].meta.description).toBe("Error script");
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
            script: "./my-script.js",
            name: "My Custom Step",
            description: "A test step",
          },
        ],
      },
    };

    const steps = createCustomScriptSteps(config);
    expect(steps).toHaveLength(1);
    expect(steps?.[0].name).toBe("myCustomStep");
  });
});

describe("createCustomScriptStep - run function", () => {
  test("should execute script successfully and return result", async () => {
    const mockScriptResult = { status: "success", data: "test-data" };
    const mockScript = vi.fn().mockResolvedValue(mockScriptResult);

    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps?.[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {
      "./demo-success.js": { default: mockScript },
    };

    const result = await step.run(
      configWithCustomInstallationSteps,
      mockContext,
    );

    expect(mockScript).toHaveBeenCalledWith(
      configWithCustomInstallationSteps,
      mockContext,
    );
    expect(result).toEqual({
      script: "./demo-success.js",
      data: mockScriptResult,
    });
  });

  test("should execute multiple scripts independently", async () => {
    const mockScript1 = vi.fn().mockResolvedValue({ step: 1 });
    const mockScript2 = vi.fn().mockResolvedValue({ step: 2 });

    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step1 = steps?.[0] as LeafStep;
    const step2 = steps?.[1] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {
      "./demo-success.js": { default: mockScript1 },
      "./demo-error.js": { default: mockScript2 },
    };

    const result1 = await step1.run(
      configWithCustomInstallationSteps,
      mockContext,
    );
    const result2 = await step2.run(
      configWithCustomInstallationSteps,
      mockContext,
    );

    expect(result1).toEqual({
      script: "./demo-success.js",
      data: { step: 1 },
    });
    expect(result2).toEqual({
      script: "./demo-error.js",
      data: { step: 2 },
    });
    expect(mockScript1).toHaveBeenCalledTimes(1);
    expect(mockScript2).toHaveBeenCalledTimes(1);
  });

  test("should throw error when customScripts are not defined", async () => {
    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps?.[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {};

    await expect(
      step.run(configWithCustomInstallationSteps, mockContext),
    ).rejects.toThrow();
  });

  test("should throw error when script module has no default export", async () => {
    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps?.[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {
      "./demo-success.js": { notDefault: vi.fn() }, // No default export
    };

    await expect(
      step.run(configWithCustomInstallationSteps, mockContext),
    ).rejects.toThrow();
  });

  test("should propagate errors thrown by the script", async () => {
    const mockScript = vi
      .fn()
      .mockRejectedValue(new Error("Script execution failed"));

    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps?.[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {
      "./demo-success.js": { default: mockScript },
    };

    await expect(
      step.run(configWithCustomInstallationSteps, mockContext),
    ).rejects.toThrow("Script execution failed");
  });
});
