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

import { eventingStep } from "#management/installation/events/branch";
import { createRootInstallationStep } from "#management/installation/root";
import { webhooksStep } from "#management/installation/webhooks/branch";
import {
  configWithCustomInstallationSteps,
  minimalValidConfig,
} from "#test/fixtures/config";

describe("createRootInstallationStep", () => {
  test("should create installation step with default children", () => {
    const result = createRootInstallationStep(minimalValidConfig);

    expect(result.type).toBe("branch");
    expect(result.name).toBe("installation");

    expect(result.children.length).toBe(3);
    expect(result.children[0]).toBe(eventingStep);
    expect(result.children[1]).toBe(webhooksStep);
    expect(result.children[2].name).toBe("customInstallationSteps");
  });

  test("should create custom installation step with dynamic children when config has custom steps", () => {
    const result = createRootInstallationStep(
      configWithCustomInstallationSteps,
    );

    expect(result.children.length).toBe(3);
    const customInstallationStep = result.children[2];
    expect(customInstallationStep.name).toBe("customInstallationSteps");
    expect(customInstallationStep.type).toBe("branch");

    // The custom installation step should have children (script steps directly)
    if (
      customInstallationStep.type === "branch" &&
      customInstallationStep.children
    ) {
      expect(customInstallationStep.children.length).toBe(2);
      expect(customInstallationStep.children[0].name).toBe("demoSuccess");
      expect(customInstallationStep.children[0].meta.label).toBe(
        "Demo Success",
      );

      expect(customInstallationStep.children[0].type).toBe("leaf");
    }
  });
});
