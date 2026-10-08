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

import { vi } from "vitest";

import type {
  AnyStep,
  BranchStep,
  LeafStep,
} from "#management/common/workflow/step";
import type { StepStatus } from "#management/common/workflow/types";

type MockLifecycleLeafOverrides = Omit<
  Partial<LeafStep>,
  "isConfigured" | "when"
> &
  Pick<AnyStep, "isConfigured" | "when">;

/** Creates a workflow step status with stable defaults. */
export function createMockStepStatus(
  overrides?: Partial<StepStatus>,
): StepStatus {
  return {
    children: [],
    id: "root-id",
    meta: { description: "Root step for testing", label: "Root Step" },
    name: "root",
    path: ["root"],
    status: "pending",
    ...overrides,
  };
}

/** Creates a branch step with stable defaults. */
export function createMockBranchStep(
  overrides?: Partial<BranchStep>,
): BranchStep {
  return {
    children: [],
    meta: { install: { label: "Installation" } },
    name: "installation",
    type: "branch",
    ...overrides,
  };
}

/** Creates a lifecycle root supporting installation and upgrade. */
export function createMockLifecycleRoot(
  children: AnyStep[] = [],
  overrides?: Partial<BranchStep>,
): BranchStep {
  return createMockBranchStep({
    children,
    meta: {
      install: { label: "Lifecycle" },
      upgrade: { label: "Lifecycle" },
    },
    name: "root",
    ...overrides,
  });
}

/** Creates a lifecycle leaf with stable defaults. */
export function createMockLifecycleLeaf(
  overrides?: MockLifecycleLeafOverrides,
): AnyStep {
  return {
    install: vi.fn(),
    name: "synthetic",
    type: "leaf",
    ...overrides,
    meta: {
      ...overrides?.meta,
      install: { label: "Synthetic domain", ...overrides?.meta?.install },
      upgrade: { label: "Synthetic domain", ...overrides?.meta?.upgrade },
    },
  };
}
