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

import { defineCustomInstallationStep } from "#management/installation/custom-installation/define";
import { minimalValidConfig } from "#test/fixtures/config";
import { createMockInstallationContext } from "#test/fixtures/installation";

import type { CustomInstallationStepHandler } from "#management/installation/custom-installation/define";

describe("defineCustomInstallationStep", () => {
  test("should preserve handler functionality", () => {
    const handler: CustomInstallationStepHandler<string> = (config, _) => {
      return `Hello ${config.metadata.displayName}`;
    };

    const wrappedHandler = defineCustomInstallationStep(handler);
    expect(wrappedHandler).toBe(handler);

    const result = wrappedHandler(
      minimalValidConfig,
      createMockInstallationContext(),
    );

    expect(result).toBe(`Hello ${minimalValidConfig.metadata.displayName}`);
  });
  test("should preserve error throwing behavior", () => {
    const handler: CustomInstallationStepHandler = () => {
      throw new Error("Custom installation error");
    };

    const wrappedHandler = defineCustomInstallationStep(handler);

    expect(() =>
      wrappedHandler(minimalValidConfig, createMockInstallationContext()),
    ).toThrow("Custom installation error");
  });
});
