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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  createInitialUninstallationState,
  executeOffboardingWorkflow,
  runUninstallation,
} from "#management/installation/runner";
import { minimalValidConfig } from "#test/fixtures/config";
import {
  createMockInstallationContext,
  FAKE_SYSTEM_TIME,
} from "#test/fixtures/installation";

describe("createInitialUninstallationState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FAKE_SYSTEM_TIME));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should create initial state with uninstallation step", () => {
    const state = createInitialUninstallationState({
      config: minimalValidConfig,
    });

    expect(state.status).toBe("in-progress");
    expect(state.step.name).toBe("uninstallation");
    expect(state.step.meta).toEqual({
      label: "Uninstallation",
      description: "App uninstallation workflow",
    });
  });
});

describe("runUninstallation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FAKE_SYSTEM_TIME));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should return succeeded state when all steps complete", async () => {
    const initialState = createInitialUninstallationState({
      config: minimalValidConfig,
    });

    const result = await runUninstallation({
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
      initialState,
    });

    expect(result.status).toBe("succeeded");
    expect(result.id).toBe(initialState.id);
  });
});

describe("executeOffboardingWorkflow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(FAKE_SYSTEM_TIME));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("should execute offboarding workflow successfully", async () => {
    const result = await executeOffboardingWorkflow({
      installationContext: createMockInstallationContext(),
      config: minimalValidConfig,
    });

    expect(result.status).toBe("succeeded");
    expect(result.id).toBeDefined();
  });
});
