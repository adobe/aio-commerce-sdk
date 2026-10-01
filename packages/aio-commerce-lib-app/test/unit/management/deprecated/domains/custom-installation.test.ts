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

import { createCustomScriptSteps } from "#management/domains/custom-installation/custom-scripts";
import { configWithCustomInstallationSteps } from "#test/fixtures/config";
import { createMockInstallationContext } from "#test/fixtures/installation";

import type { LeafStep } from "#management/common/workflow/step";

describe("createCustomScriptStep - run function", () => {
  test("should execute script successfully and return result", async () => {
    const mockScriptResult = { data: "test-data", status: "success" };
    const mockScript = vi.fn().mockResolvedValue(mockScriptResult);

    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {
      "./demo-success.js": { default: mockScript },
    };

    const result = await step.install(
      configWithCustomInstallationSteps,
      mockContext,
    );

    expect(mockScript).toHaveBeenCalledWith(
      configWithCustomInstallationSteps,
      mockContext,
    );
    expect(result).toEqual({
      data: mockScriptResult,
      script: "./demo-success.js",
    });
  });

  test("should throw error when customScripts are not defined", async () => {
    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {};

    await expect(
      step.install(configWithCustomInstallationSteps, mockContext),
    ).rejects.toThrow();
  });

  test("should throw error when customScripts is undefined on context", async () => {
    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = undefined;

    await expect(
      step.install(configWithCustomInstallationSteps, mockContext),
    ).rejects.toThrow();
  });

  test("should throw error when script module has no default export", async () => {
    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {
      "./demo-success.js": { notDefault: vi.fn() }, // No default export
    };

    await expect(
      step.install(configWithCustomInstallationSteps, mockContext),
    ).rejects.toThrow();
  });

  test("should propagate errors thrown by the script", async () => {
    const mockScript = vi
      .fn()
      .mockRejectedValue(new Error("Script execution failed"));

    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {
      "./demo-success.js": { default: mockScript },
    };

    await expect(
      step.install(configWithCustomInstallationSteps, mockContext),
    ).rejects.toThrow("Script execution failed");
  });
});

describe("createCustomScriptStep - run function (CJS module.exports forms)", () => {
  test("should execute CJS function form (module.exports = fn) without .default wrapper", async () => {
    const mockScriptResult = { data: "cjs-fn", status: "success" };
    const mockScript = vi.fn().mockResolvedValue(mockScriptResult);

    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {
      "./demo-success.js": mockScript, // CJS: module.exports = fn
    };

    const result = await step.install(
      configWithCustomInstallationSteps,
      mockContext,
    );

    expect(mockScript).toHaveBeenCalledWith(
      configWithCustomInstallationSteps,
      mockContext,
    );
    expect(result).toEqual({
      data: mockScriptResult,
      script: "./demo-success.js",
    });
  });

  test("should execute CJS object form (module.exports = { install }) without .default wrapper", async () => {
    const mockInstallResult = { data: "cjs-obj", status: "success" };
    const mockInstall = vi.fn().mockResolvedValue(mockInstallResult);

    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {
      "./demo-success.js": { install: mockInstall }, // CJS: module.exports = { install }
    };

    const result = await step.install(
      configWithCustomInstallationSteps,
      mockContext,
    );

    expect(mockInstall).toHaveBeenCalledWith(
      configWithCustomInstallationSteps,
      mockContext,
    );
    expect(result).toEqual({
      data: mockInstallResult,
      script: "./demo-success.js",
    });
  });

  test("should call uninstall from CJS object form without .default wrapper", async () => {
    const mockUninstall = vi.fn().mockResolvedValue(undefined);
    const mockInstall = vi.fn().mockResolvedValue({ status: "success" });

    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {
      "./demo-success.js": { install: mockInstall, uninstall: mockUninstall },
    };

    await step.uninstall?.(configWithCustomInstallationSteps, mockContext);

    expect(mockUninstall).toHaveBeenCalledWith(
      configWithCustomInstallationSteps,
      mockContext,
    );
  });

  test("should skip uninstall gracefully for CJS function form (no uninstall to call)", async () => {
    const mockScript = vi.fn().mockResolvedValue({ status: "success" });

    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {
      "./demo-success.js": mockScript, // CJS function: no uninstall
    };

    await expect(
      step.uninstall?.(configWithCustomInstallationSteps, mockContext),
    ).resolves.toBeUndefined();
  });
});

describe("createCustomScriptStep - run function (object form)", () => {
  test("should execute install handler from object form and return result", async () => {
    const mockInstallResult = { data: "object-form", status: "success" };
    const mockInstall = vi.fn().mockResolvedValue(mockInstallResult);

    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {
      "./demo-success.js": { default: { install: mockInstall } },
    };

    const result = await step.install(
      configWithCustomInstallationSteps,
      mockContext,
    );

    expect(mockInstall).toHaveBeenCalledWith(
      configWithCustomInstallationSteps,
      mockContext,
    );
    expect(result).toEqual({
      data: mockInstallResult,
      script: "./demo-success.js",
    });
  });

  test("should throw when object form has no install method", async () => {
    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {
      "./demo-success.js": { default: { uninstall: vi.fn() } }, // missing install
    };

    await expect(
      step.install(configWithCustomInstallationSteps, mockContext),
    ).rejects.toThrow();
  });
});

describe("createCustomScriptStep - uninstall function", () => {
  test("should call uninstall function when script exports it", async () => {
    const mockUninstall = vi.fn().mockResolvedValue(undefined);
    const mockInstall = vi.fn().mockResolvedValue({ status: "success" });

    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps[0] as LeafStep;

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
    const step = steps[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {
      "./demo-success.js": { default: mockRun }, // No uninstall export
    };

    // Should not throw and should complete successfully
    await expect(
      step.uninstall?.(configWithCustomInstallationSteps, mockContext),
    ).resolves.toBeUndefined();
  });

  test("should skip uninstall gracefully when script module not found", async () => {
    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps[0] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {}; // Empty scripts

    await expect(
      step.uninstall?.(configWithCustomInstallationSteps, mockContext),
    ).resolves.toBeUndefined();

    expect(mockContext.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("./demo-success.js"),
    );
  });

  test("should handle uninstall function that throws an error", async () => {
    const mockUninstall = vi
      .fn()
      .mockRejectedValue(new Error("Uninstall failed"));

    const steps = createCustomScriptSteps(configWithCustomInstallationSteps);
    const step = steps[0] as LeafStep;

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
    const step1 = steps[0] as LeafStep;
    const step2 = steps[1] as LeafStep;

    const mockContext = createMockInstallationContext();
    mockContext.customScripts = {
      "./demo-error.js": {
        default: { install: vi.fn(), uninstall: mockUninstall2 },
      },
      "./demo-success.js": {
        default: { install: vi.fn(), uninstall: mockUninstall1 },
      },
    };

    await step1.uninstall?.(configWithCustomInstallationSteps, mockContext);
    await step2.uninstall?.(configWithCustomInstallationSteps, mockContext);

    expect(mockUninstall1).toHaveBeenCalledTimes(1);
    expect(mockUninstall2).toHaveBeenCalledTimes(1);
  });
});
