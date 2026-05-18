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

import { defineCustomInstallationStep } from "#management/installation/custom-installation/define";
import { minimalValidConfig } from "#test/fixtures/config";
import { createMockInstallationContext } from "#test/fixtures/installation";

import type {
  CustomInstallationStepDefinition,
  CustomInstallationStepHandler,
} from "#management/installation/custom-installation/define";

describe("defineCustomInstallationStep - function form (legacy)", () => {
  test("should preserve handler functionality", () => {
    const handler: CustomInstallationStepHandler<string> = (config, _) =>
      `Hello ${config.metadata.displayName}`;

    const wrappedHandler = defineCustomInstallationStep(
      handler,
    ) as CustomInstallationStepHandler<string>;
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

    const wrappedHandler = defineCustomInstallationStep(
      handler,
    ) as CustomInstallationStepHandler;

    expect(() =>
      wrappedHandler(minimalValidConfig, createMockInstallationContext()),
    ).toThrow("Custom installation error");
  });
});

describe("defineCustomInstallationStep - object form", () => {
  test("should return the same definition object", () => {
    const definition: CustomInstallationStepDefinition<string> = {
      install: (config) => `Hello ${config.metadata.displayName}`,
      uninstall: vi.fn(),
    };

    const result = defineCustomInstallationStep(definition);
    expect(result).toBe(definition);
  });

  test("should preserve install handler functionality", () => {
    const definition: CustomInstallationStepDefinition<string> = {
      install: (config) => `Hello ${config.metadata.displayName}`,
    };

    const result = defineCustomInstallationStep(
      definition,
    ) as CustomInstallationStepDefinition<string>;
    const installResult = result.install(
      minimalValidConfig,
      createMockInstallationContext(),
    );

    expect(installResult).toBe(
      `Hello ${minimalValidConfig.metadata.displayName}`,
    );
  });

  test("should preserve uninstall handler functionality", async () => {
    const mockUninstall = vi.fn().mockResolvedValue(undefined);
    const definition: CustomInstallationStepDefinition = {
      install: vi.fn(),
      uninstall: mockUninstall,
    };

    const result = defineCustomInstallationStep(
      definition,
    ) as CustomInstallationStepDefinition;
    await result.uninstall?.(
      minimalValidConfig,
      createMockInstallationContext(),
    );

    expect(mockUninstall).toHaveBeenCalledWith(
      minimalValidConfig,
      expect.any(Object),
    );
  });

  test("should allow omitting uninstall handler", () => {
    const definition: CustomInstallationStepDefinition = {
      install: vi.fn(),
    };

    const result = defineCustomInstallationStep(
      definition,
    ) as CustomInstallationStepDefinition;
    expect(result.uninstall).toBeUndefined();
  });

  test("should preserve error throwing from install handler", () => {
    const definition: CustomInstallationStepDefinition = {
      install: () => {
        throw new Error("Install error");
      },
    };

    const result = defineCustomInstallationStep(
      definition,
    ) as CustomInstallationStepDefinition;

    expect(() =>
      result.install(minimalValidConfig, createMockInstallationContext()),
    ).toThrow("Install error");
  });
});
