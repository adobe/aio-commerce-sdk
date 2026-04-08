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

  test("should throw error when customScripts are not defined", async () => {
    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps?.[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {};

    await expect(
      step.run(configWithCustomInstallationSteps, mockContext),
    ).rejects.toThrow();
  });

  test("should throw error when customScripts is undefined on context", async () => {
    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps?.[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = undefined;

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

describe("createCustomScriptStep - run function (object form)", () => {
  test("should execute install handler from object form and return result", async () => {
    const mockInstallResult = { status: "success", data: "object-form" };
    const mockInstall = vi.fn().mockResolvedValue(mockInstallResult);

    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps?.[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {
      "./demo-success.js": { default: { install: mockInstall } },
    };

    const result = await step.run(
      configWithCustomInstallationSteps,
      mockContext,
    );

    expect(mockInstall).toHaveBeenCalledWith(
      configWithCustomInstallationSteps,
      mockContext,
    );
    expect(result).toEqual({
      script: "./demo-success.js",
      data: mockInstallResult,
    });
  });

  test("should throw when object form has no install method", async () => {
    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps?.[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {
      "./demo-success.js": { default: { uninstall: vi.fn() } }, // missing install
    };

    await expect(
      step.run(configWithCustomInstallationSteps, mockContext),
    ).rejects.toThrow();
  });
});

describe("createCustomScriptStep - uninstall function", () => {
  test("should call uninstall function when script exports it", async () => {
    const mockUninstall = vi.fn().mockResolvedValue(undefined);
    const mockInstall = vi.fn().mockResolvedValue({ status: "success" });

    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps?.[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {
      "./demo-success.js": {
        default: { install: mockInstall, uninstall: mockUninstall },
      },
    };

    await step.uninstall?.(configWithCustomInstallationSteps, mockContext);

    expect(mockUninstall).toHaveBeenCalledWith(
      configWithCustomInstallationSteps,
      mockContext,
    );
  });

  test("should skip uninstall gracefully when script does not export uninstall", async () => {
    const mockRun = vi.fn().mockResolvedValue({ status: "success" });

    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps?.[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {
      "./demo-success.js": { default: mockRun }, // No uninstall export
    };

    // Should not throw and should complete successfully
    await expect(
      step.uninstall?.(configWithCustomInstallationSteps, mockContext),
    ).resolves.toBeUndefined();
  });

  test("should throw error when script module not found during uninstall", async () => {
    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps?.[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {}; // Empty scripts

    await expect(
      step.uninstall?.(configWithCustomInstallationSteps, mockContext),
    ).rejects.toThrow();
  });

  test("should handle uninstall function that throws an error", async () => {
    const mockUninstall = vi
      .fn()
      .mockRejectedValue(new Error("Uninstall failed"));

    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps?.[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {
      "./demo-success.js": {
        default: { install: vi.fn(), uninstall: mockUninstall },
      },
    };

    await expect(
      step.uninstall?.(configWithCustomInstallationSteps, mockContext),
    ).rejects.toThrow("Uninstall failed");
  });

  test("should call uninstall on multiple scripts independently", async () => {
    const mockUninstall1 = vi.fn().mockResolvedValue(undefined);
    const mockUninstall2 = vi.fn().mockResolvedValue(undefined);

    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step1 = steps?.[0] as LeafStep;
    const step2 = steps?.[1] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {
      "./demo-success.js": {
        default: { install: vi.fn(), uninstall: mockUninstall1 },
      },
      "./demo-error.js": {
        default: { install: vi.fn(), uninstall: mockUninstall2 },
      },
    };

    await step1.uninstall?.(configWithCustomInstallationSteps, mockContext);
    await step2.uninstall?.(configWithCustomInstallationSteps, mockContext);

    expect(mockUninstall1).toHaveBeenCalledTimes(1);
    expect(mockUninstall2).toHaveBeenCalledTimes(1);
  });
});
