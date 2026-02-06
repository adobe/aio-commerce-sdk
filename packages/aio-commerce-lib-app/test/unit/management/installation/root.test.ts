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

import { customInstallationStep } from "#management/installation/custom-installation/branch";
import { eventingStep } from "#management/installation/events/branch";
import {
  createRootInstallationStep,
  ROOT_INSTALLATION_STEP,
} from "#management/installation/root";
import { webhooksStep } from "#management/installation/webhooks/branch";
import {
  defineBranchStep,
  defineLeafStep,
} from "#management/installation/workflow/step";

describe("ROOT_INSTALLATION_STEP", () => {
  test("should be a branch step with type 'branch'", () => {
    expect(ROOT_INSTALLATION_STEP.type).toBe("branch");
  });

  test("should have name 'installation'", () => {
    expect(ROOT_INSTALLATION_STEP.name).toBe("installation");
  });

  test("should have meta", () => {
    expect(ROOT_INSTALLATION_STEP.meta.label).toBeDefined();
    expect(ROOT_INSTALLATION_STEP.meta.description).toBeDefined();
  });

  test("should have default children (eventingStep, webhooksStep, and customInstallationStep)", () => {
    expect(ROOT_INSTALLATION_STEP.children).toEqual([
      eventingStep,
      webhooksStep,
      customInstallationStep,
    ]);
  });
});

describe("createRootInstallationStep", () => {
  test("should return ROOT_INSTALLATION_STEP when no extra steps provided", () => {
    const result = createRootInstallationStep();
    expect(result).toBe(ROOT_INSTALLATION_STEP);
  });

  test("should return ROOT_INSTALLATION_STEP when empty array provided", () => {
    const result = createRootInstallationStep([]);
    expect(result).toBe(ROOT_INSTALLATION_STEP);
  });

  test("should return a new step with extra steps appended to children", () => {
    const mockExtraStep = defineLeafStep({
      name: "extra-step",
      meta: { label: "Extra Step" },
      run: vi.fn(() => ({ result: "test" })),
    });

    const result = createRootInstallationStep([mockExtraStep]);
    expect(result.children).toEqual([
      eventingStep,
      webhooksStep,
      customInstallationStep,
      mockExtraStep,
    ]);
  });

  test("should not mutate the original ROOT_INSTALLATION_STEP", () => {
    const originalChildren = [...ROOT_INSTALLATION_STEP.children];
    const mockExtraStep = defineLeafStep({
      name: "mutate-test-step",
      meta: { label: "Mutate Test Step" },
      run: vi.fn(() => ({ result: "test" })),
    });

    createRootInstallationStep([mockExtraStep]);
    expect(ROOT_INSTALLATION_STEP.children).toEqual(originalChildren);
    expect(ROOT_INSTALLATION_STEP.children).toHaveLength(3);
  });

  test("should handle multiple extra steps", () => {
    const extraStep1 = defineLeafStep({
      name: "extra-1",
      meta: { label: "Extra 1" },
      run: vi.fn(() => ({ result: "1" })),
    });

    const extraStep2 = defineBranchStep({
      name: "extra-2",
      meta: { label: "Extra 2" },
      children: [],
    });

    const result = createRootInstallationStep([extraStep1, extraStep2]);
    expect(result.children).toHaveLength(5);
    expect(result.children).toEqual([
      eventingStep,
      webhooksStep,
      customInstallationStep,
      extraStep1,
      extraStep2,
    ]);
  });
});
