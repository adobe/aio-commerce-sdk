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

import { afterEach, describe, expect, test, vi } from "vitest";

import { commerceEventsStep } from "#management/installation/events/commerce";
import { isLeafStep } from "#management/installation/workflow/step";
import {
  configWithCommerceEventing,
  configWithExternalEventing,
  createConfigWithTwoCommerceEventingSources,
  minimalValidConfig,
} from "#test/fixtures/config";
import {
  createMockEventingInstallationContext,
  createMockExistingCommerceEventingData,
  createMockExistingIoEventsData,
  createMockWorkspaceConfiguration,
} from "#test/fixtures/eventing";

describe("commerceEventsStep leaf step", () => {
  test("should be a leaf step with name and meta", () => {
    expect(isLeafStep(commerceEventsStep)).toBe(true);
    expect(commerceEventsStep.name).toBe("commerce");
    expect(commerceEventsStep.meta).toEqual({
      label: "Configure Commerce Events",
      description: "Sets up I/O Events for Adobe Commerce event sources",
    });
  });

  test("should only run if eventing.commerce is defined", () => {
    expect.assert(commerceEventsStep.when);

    expect(commerceEventsStep.when(configWithCommerceEventing)).toBe(true);
    expect(commerceEventsStep.when(configWithExternalEventing)).toBe(false);
    expect(commerceEventsStep.when(minimalValidConfig)).toBe(false);
  });
});

describe("commerceEventsStep orchestration", () => {
  async function importCommerceStepWithMocks() {
    vi.resetModules();

    const helperMocks = {
      configureCommerceEventing: vi.fn(),
      onboardCommerceEventing: vi.fn(),
      onboardIoEvents: vi.fn(),
    };

    const utilsMocks = {
      getCommerceEventingExistingData: vi.fn(),
      getIoEventsExistingData: vi.fn(),
      makeWorkspaceConfig: vi.fn(),
    };

    vi.doMock("#management/installation/events/helpers", async () => {
      const actual = await vi.importActual<
        typeof import("#management/installation/events/helpers")
      >("#management/installation/events/helpers");

      return {
        ...actual,
        ...helperMocks,
      };
    });

    vi.doMock("#management/installation/events/utils", async () => {
      const actual = await vi.importActual<
        typeof import("#management/installation/events/utils")
      >("#management/installation/events/utils");

      return {
        ...actual,
        ...utilsMocks,
      };
    });

    const commerceModule = await import(
      "#management/installation/events/commerce"
    );

    return {
      commerceEventsStep: commerceModule.commerceEventsStep,
      helperMocks,
      utilsMocks,
    };
  }

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
    vi.doUnmock("#management/installation/events/helpers");
    vi.doUnmock("#management/installation/events/utils");
  });

  test("should configure Commerce Eventing only once when multiple commerce sources are installed", async () => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");
    const context = createMockEventingInstallationContext({
      appData: {
        orgName: "Test Org! #42",
        projectName: "Test Project! #7",
      },
    });

    const { commerceEventsStep, helperMocks, utilsMocks } =
      await importCommerceStepWithMocks();

    utilsMocks.makeWorkspaceConfig.mockReturnValue(
      createMockWorkspaceConfiguration(),
    );
    utilsMocks.getIoEventsExistingData.mockResolvedValue(
      createMockExistingIoEventsData(),
    );
    utilsMocks.getCommerceEventingExistingData.mockResolvedValue(
      createMockExistingCommerceEventingData(),
    );

    helperMocks.onboardIoEvents
      .mockResolvedValueOnce({
        eventsData: [],
        providerData: {
          instance_id: "test-app-commerce-events-provider-test-workspace-id",
        },
      })
      .mockResolvedValueOnce({
        eventsData: [],
        providerData: {
          instance_id:
            "test-app-second-commerce-events-provider-test-workspace-id",
        },
      });

    helperMocks.configureCommerceEventing.mockResolvedValue(undefined);
    helperMocks.onboardCommerceEventing.mockResolvedValue({
      commerceProvider: {},
      subscriptions: [],
    });

    const result = await commerceEventsStep.run(
      createConfigWithTwoCommerceEventingSources(),
      context,
    );

    expect(result).toHaveLength(2);

    expect(helperMocks.onboardIoEvents).toHaveBeenCalledTimes(2);
    expect(helperMocks.configureCommerceEventing).toHaveBeenCalledTimes(1);
    expect(helperMocks.configureCommerceEventing).toHaveBeenCalledWith(
      {
        context,
        config: {
          enabled: true,
          merchant_id: "test_org_42",
          environment_id: "test_project_7",
          instance_id: "test-app-commerce-events-provider-test-workspace-id",
          workspace_configuration: expect.any(String),
        },
      },
      createMockExistingCommerceEventingData(),
    );

    expect(helperMocks.onboardCommerceEventing).toHaveBeenCalledTimes(2);
  });
});
