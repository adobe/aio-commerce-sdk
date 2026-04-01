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
import { createMockInstallationContext } from "#test/fixtures/installation";

describe("createInitialInstallationState", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  test("creates the root step and delegates state creation to the workflow", async () => {
    const rootStep = {
      type: "branch",
      name: "installation",
      meta: { label: "Installation" },
      children: [],
    };

    const initialState = {
      id: "installation-id",
      startedAt: "2026-01-30T10:00:00.000Z",
      status: "in-progress",
      step: {
        id: "step-id",
        name: "installation",
        path: ["installation"],
        meta: { label: "Installation" },
        status: "pending",
        children: [],
      },
      data: null,
    };

    const createRootInstallationStep = vi.fn().mockReturnValue(rootStep);
    const createInitialState = vi.fn().mockReturnValue(initialState);

    vi.doMock("#management/installation/root", () => ({
      createRootInstallationStep,
    }));
    vi.doMock("#management/installation/workflow", () => ({
      createInitialState,
      executeWorkflow: vi.fn(),
    }));
    vi.doMock("#management/installation/workflow/runner", () => ({
      createInitialState,
      executeWorkflow: vi.fn(),
    }));
    vi.doMock("#management/installation/workflow/validation", () => ({
      validateStepTree: vi.fn(),
    }));

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
    const rootStep = {
      type: "branch",
      name: "installation",
      meta: { label: "Installation" },
      children: [],
    };
    const installationContext = createMockInstallationContext();
    const initialState = {
      id: "installation-id",
      startedAt: "2026-01-30T10:00:00.000Z",
      status: "in-progress",
      step: {
        id: "step-id",
        name: "installation",
        path: ["installation"],
        meta: { label: "Installation" },
        status: "pending",
        children: [],
      },
      data: null,
    };
    const hooks = {
      onInstallationStart: vi.fn(),
    };
    const workflowResult = {
      id: "installation-id",
      startedAt: "2026-01-30T10:00:00.000Z",
      completedAt: "2026-01-30T10:05:00.000Z",
      status: "succeeded",
      step: initialState.step,
      data: null,
    };

    const createRootInstallationStep = vi.fn().mockReturnValue(rootStep);
    const executeWorkflow = vi.fn().mockResolvedValue(workflowResult);

    vi.doMock("#management/installation/root", () => ({
      createRootInstallationStep,
    }));
    vi.doMock("#management/installation/workflow", () => ({
      createInitialState: vi.fn(),
      executeWorkflow,
    }));
    vi.doMock("#management/installation/workflow/runner", () => ({
      createInitialState: vi.fn(),
      executeWorkflow,
    }));
    vi.doMock("#management/installation/workflow/validation", () => ({
      validateStepTree: vi.fn(),
    }));

    const { runInstallation } = await import("#management/installation/runner");

    const result = await runInstallation({
      config: minimalValidConfig,
      installationContext,
      initialState: initialState as never,
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
    const rootStep = {
      type: "branch",
      name: "installation",
      meta: { label: "Installation" },
      children: [],
    };
    const validationContext = createMockInstallationContext();
    const validationResult = {
      valid: true,
      result: {
        name: "installation",
        path: ["installation"],
        meta: { label: "Installation" },
        issues: [],
        children: [],
      },
      summary: {
        errors: 0,
        warnings: 0,
        totalIssues: 0,
      },
    };

    const createRootInstallationStep = vi.fn().mockReturnValue(rootStep);
    const validateStepTree = vi.fn().mockResolvedValue(validationResult);

    vi.doMock("#management/installation/root", () => ({
      createRootInstallationStep,
    }));
    vi.doMock("#management/installation/workflow", () => ({
      createInitialState: vi.fn(),
      executeWorkflow: vi.fn(),
    }));
    vi.doMock("#management/installation/workflow/runner", () => ({
      createInitialState: vi.fn(),
      executeWorkflow: vi.fn(),
    }));
    vi.doMock("#management/installation/workflow/validation", () => ({
      validateStepTree,
    }));

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
