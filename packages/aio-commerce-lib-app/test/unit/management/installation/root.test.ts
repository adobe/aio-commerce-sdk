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

import { customInstallationStep } from "#management/installation/custom-installation/branch";
import { eventingStep } from "#management/installation/events/branch";
import {
  createRootInstallationStep,
  ROOT_INSTALLATION_STEP,
} from "#management/installation/root";
import { webhooksStep } from "#management/installation/webhooks/branch";

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
    const result = createRootInstallationStep();
    expect(result).toBe(ROOT_INSTALLATION_STEP);
  });
});
