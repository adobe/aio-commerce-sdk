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

import { beforeEach, describe, expect, test, vi } from "vitest";

import { minimalValidConfig } from "#test/fixtures/config";
import {
  createMockBranchStep,
  createMockInstallationContext,
  createMockInstallationInProgressState,
  createMockInstallationSucceededState,
  createMockStepValidationResult,
  createMockValidationResult,
} from "#test/fixtures/installation";

function mockRunnerDependencies({
  createRootInstallationStep = vi.fn(),
  createInitialState = vi.fn(),
  executeWorkflow = vi.fn(),
  validateStepTree = vi.fn(),
} = {}) {
  vi.doMock("#management/installation/root", () => ({
    createRootInstallationStep,
  }));
  vi.doMock("#management/installation/workflow", () => ({
    createInitialState,
    executeWorkflow,
  }));
  vi.doMock("#management/installation/workflow/runner", () => ({
    createInitialState,
    executeWorkflow,
  }));
  vi.doMock("#management/installation/workflow/validation", () => ({
    validateStepTree,
  }));

  return {
    createRootInstallationStep,
    createInitialState,
    executeWorkflow,
    validateStepTree,
  };
}

describe("createInitialInstallationState", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  test("creates the root step and delegates state creation to the workflow", async () => {
    const rootStep = createMockBranchStep();
    const initialState = createMockInstallationInProgressState();
    const { createRootInstallationStep, createInitialState } =
      mockRunnerDependencies({
        createRootInstallationStep: vi.fn().mockReturnValue(rootStep),
        createInitialState: vi.fn().mockReturnValue(initialState),
      });

    const { createInitialInstallationState } = await import(
      "#management/installation/runner"
    );

    const result = createInitialInstallationState({
      config: minimalValidConfig,
    });

    expect(createRootInstallationStep).toHaveBeenCalledWith(minimalValidConfig);
    expect(createInitialState).toHaveBeenCalledWith({
      rootStep,
      config: minimalValidConfig,
    });

    expect(result).toBe(initialState);
  });
});

describe("runInstallation", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  test("creates the root step and delegates execution to the workflow", async () => {
    const rootStep = createMockBranchStep();
    const installationContext = createMockInstallationContext();
    const initialState = createMockInstallationInProgressState();
    const hooks = {
      onInstallationStart: vi.fn(),
    };

    const workflowResult = createMockInstallationSucceededState({
      step: initialState.step,
    });

    const { createRootInstallationStep, executeWorkflow } =
      mockRunnerDependencies({
        createRootInstallationStep: vi.fn().mockReturnValue(rootStep),
        executeWorkflow: vi.fn().mockResolvedValue(workflowResult),
      });

    const { runInstallation } = await import("#management/installation/runner");
    const result = await runInstallation({
      config: minimalValidConfig,
      installationContext,
      initialState,
      hooks,
    });

    expect(createRootInstallationStep).toHaveBeenCalledWith(minimalValidConfig);
    expect(executeWorkflow).toHaveBeenCalledWith({
      rootStep,
      installationContext,
      config: minimalValidConfig,
      initialState,
      hooks,
    });

    expect(result).toBe(workflowResult);
  });
});

describe("runValidation", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  test("creates the root step and delegates validation to the workflow validator", async () => {
    const rootStep = createMockBranchStep();
    const validationContext = createMockInstallationContext();
    const validationResult = createMockValidationResult({
      result: createMockStepValidationResult({
        name: "installation",
        path: ["installation"],
        meta: { label: "Installation" },
        issues: [],
        children: [],
      }),
    });

    const { createRootInstallationStep, validateStepTree } =
      mockRunnerDependencies({
        createRootInstallationStep: vi.fn().mockReturnValue(rootStep),
        validateStepTree: vi.fn().mockResolvedValue(validationResult),
      });

    const { runValidation } = await import("#management/installation/runner");
    const result = await runValidation({
      config: minimalValidConfig,
      validationContext,
    });

    expect(createRootInstallationStep).toHaveBeenCalledWith(minimalValidConfig);
    expect(validateStepTree).toHaveBeenCalledWith({
      rootStep,
      validationContext,
      config: minimalValidConfig,
    });

    expect(result).toBe(validationResult);
  });
});
