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
  createConfigWithCommerceProviderKey,
  createConfigWithTwoCommerceEventingSources,
  minimalValidConfig,
} from "#test/fixtures/config";
import {
  cleanupCommerceEventsStepMocks,
  createMockEventingInstallationContext,
  createMockExistingCommerceEventingData,
  createMockExistingIoEventsData,
  createMockWorkspaceConfiguration,
  importCommerceEventsStepWithMocks,
} from "#test/fixtures/eventing";

describe("commerceEventsStep leaf step", () => {
  test("should be a leaf step with name and meta", () => {
    expect(isLeafStep(commerceEventsStep)).toBe(true);
    expect(commerceEventsStep.name).toBe("commerce");
    expect(commerceEventsStep.meta).toEqual({
      install: {
        description: "Sets up I/O Events for Adobe Commerce event sources",
        label: "Configure Commerce Events",
      },
      uninstall: {
        description: "Removes I/O Events for Adobe Commerce event sources",
        label: "Remove Commerce Events",
      },
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
  afterEach(() => {
    vi.unstubAllEnvs();
    cleanupCommerceEventsStepMocks();
  });

  test("should configure Commerce Eventing only once when multiple commerce sources are installed", async () => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");
    const context = createMockEventingInstallationContext({
      appData: {
        orgName: "Test Org! #42",
        projectName: "Test Project! #7",
      },
    });

    const {
      commerceEventsStep: mockedCommerceEventsStep,
      helperMocks,
      utilsMocks,
    } = await importCommerceEventsStepWithMocks();

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

    const result = await mockedCommerceEventsStep.install(
      createConfigWithTwoCommerceEventingSources(),
      context,
    );

    expect(result).toHaveLength(2);

    expect(helperMocks.onboardIoEvents).toHaveBeenCalledTimes(2);
    expect(helperMocks.configureCommerceEventing).toHaveBeenCalledTimes(1);
    expect(helperMocks.configureCommerceEventing).toHaveBeenCalledWith(
      {
        config: {
          enabled: true,
          environment_id: "test_project_7",
          instance_id: "test-app-commerce-events-provider-test-workspace-id",
          merchant_id: "test_org_42",
          workspace_configuration: expect.any(String),
        },
        context,
      },
      createMockExistingCommerceEventingData(),
    );

    expect(helperMocks.onboardCommerceEventing).toHaveBeenCalledTimes(2);
  });

  test("should skip a provider whose events are all scoped to another environment and still configure eventing once on the surviving provider", async () => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");
    const context = createMockEventingInstallationContext({
      appData: {
        orgName: "Test Org! #42",
        projectName: "Test Project! #7",
      },
      params: { AIO_COMMERCE_API_FLAVOR: "saas" },
    });

    const {
      commerceEventsStep: mockedCommerceEventsStep,
      helperMocks,
      utilsMocks,
    } = await importCommerceEventsStepWithMocks();

    utilsMocks.makeWorkspaceConfig.mockReturnValue(
      createMockWorkspaceConfiguration(),
    );
    utilsMocks.getIoEventsExistingData.mockResolvedValue(
      createMockExistingIoEventsData(),
    );
    utilsMocks.getCommerceEventingExistingData.mockResolvedValue(
      createMockExistingCommerceEventingData(),
    );

    helperMocks.onboardIoEvents.mockResolvedValue({
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

    // First provider is entirely PaaS-scoped, so it is skipped on a SaaS install;
    // the second (un-scoped) provider survives and drives the one-time config.
    const config = createConfigWithTwoCommerceEventingSources({
      firstSourceEnv: ["paas"],
    });

    const result = await mockedCommerceEventsStep.install(config, context);

    expect(result).toHaveLength(1);
    expect(helperMocks.onboardIoEvents).toHaveBeenCalledTimes(1);
    expect(helperMocks.configureCommerceEventing).toHaveBeenCalledTimes(1);
    expect(helperMocks.onboardCommerceEventing).toHaveBeenCalledTimes(1);
  });

  test("persists provider id and event codes to system storage keyed by provider.key", async () => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");
    const context = createMockEventingInstallationContext();

    const {
      commerceEventsStep: mockedCommerceEventsStep,
      helperMocks,
      utilsMocks,
      configMocks,
    } = await importCommerceEventsStepWithMocks();

    const configWithKey = createConfigWithCommerceProviderKey(
      "order-events-provider",
    );

    utilsMocks.makeWorkspaceConfig.mockReturnValue(
      createMockWorkspaceConfiguration(),
    );
    utilsMocks.getIoEventsExistingData.mockResolvedValue(
      createMockExistingIoEventsData(),
    );
    utilsMocks.getCommerceEventingExistingData.mockResolvedValue(
      createMockExistingCommerceEventingData(),
    );

    helperMocks.onboardIoEvents.mockResolvedValue({
      eventsData: [
        {
          config: { name: "plugin.order_placed" },
          data: { metadata: { event_code: "com.adobe.commerce.order.placed" } },
        },
      ],
      providerData: {
        id: "provider-uuid-123",
        instance_id: "test-app-order-events-provider-test-workspace-id",
      },
    });
    helperMocks.configureCommerceEventing.mockResolvedValue(undefined);
    helperMocks.onboardCommerceEventing.mockResolvedValue({
      commerceProvider: {},
      subscriptions: [{}],
    });

    await mockedCommerceEventsStep.install(configWithKey, context);

    expect(configMocks.setSystemConfigByKey).toHaveBeenCalledWith("events", {
      providers: {
        "order-events-provider": {
          events: {
            "plugin.order_placed": {
              code: "com.adobe.commerce.order.placed",
              isPhiData: false,
            },
          },
          id: "provider-uuid-123",
        },
      },
    });
  });

  test("merges newly stored providers with pre-existing stored data", async () => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");
    const context = createMockEventingInstallationContext();

    const {
      commerceEventsStep: mockedCommerceEventsStep,
      helperMocks,
      utilsMocks,
      configMocks,
    } = await importCommerceEventsStepWithMocks();

    const configWithKey = createConfigWithCommerceProviderKey(
      "order-events-provider",
    );

    configMocks.getSystemConfigByKey.mockResolvedValue({
      providers: {
        "existing-provider": { events: {}, id: "existing-uuid" },
      },
    });

    utilsMocks.makeWorkspaceConfig.mockReturnValue(
      createMockWorkspaceConfiguration(),
    );
    utilsMocks.getIoEventsExistingData.mockResolvedValue(
      createMockExistingIoEventsData(),
    );
    utilsMocks.getCommerceEventingExistingData.mockResolvedValue(
      createMockExistingCommerceEventingData(),
    );

    helperMocks.onboardIoEvents.mockResolvedValue({
      eventsData: [
        {
          config: { name: "plugin.order_placed" },
          data: { metadata: { event_code: "com.adobe.commerce.order.placed" } },
        },
      ],
      providerData: {
        id: "provider-uuid-123",
        instance_id: "test-app-order-events-provider-test-workspace-id",
      },
    });
    helperMocks.configureCommerceEventing.mockResolvedValue(undefined);
    helperMocks.onboardCommerceEventing.mockResolvedValue({
      commerceProvider: {},
      subscriptions: [{}],
    });

    await mockedCommerceEventsStep.install(configWithKey, context);

    expect(configMocks.setSystemConfigByKey).toHaveBeenCalledWith("events", {
      providers: {
        "existing-provider": { events: {}, id: "existing-uuid" },
        "order-events-provider": {
          events: {
            "plugin.order_placed": {
              code: "com.adobe.commerce.order.placed",
              isPhiData: false,
            },
          },
          id: "provider-uuid-123",
        },
      },
    });
  });
});

describe("commerceEventsStep uninstall orchestration", () => {
  afterEach(() => {
    cleanupCommerceEventsStepMocks();
  });

  test("prunes the uninstalled provider's stored entry, preserving unrelated ones", async () => {
    const context = createMockEventingInstallationContext();
    const {
      commerceEventsStep: mockedCommerceEventsStep,
      utilsMocks,
      configMocks,
    } = await importCommerceEventsStepWithMocks();

    utilsMocks.getIoEventsExistingData.mockResolvedValue(
      createMockExistingIoEventsData(),
    );
    utilsMocks.getCommerceEventingExistingData.mockResolvedValue(
      createMockExistingCommerceEventingData(),
    );
    configMocks.getSystemConfigByKey.mockResolvedValue({
      providers: {
        "order-events-provider": { events: {}, id: "stale-uuid" },
        "unrelated-provider": { events: {}, id: "keep-uuid" },
      },
    });

    expect.assert(mockedCommerceEventsStep.uninstall);
    await mockedCommerceEventsStep.uninstall(
      createConfigWithCommerceProviderKey("order-events-provider"),
      context,
    );

    expect(configMocks.setSystemConfigByKey).toHaveBeenCalledWith("events", {
      providers: {
        "unrelated-provider": { events: {}, id: "keep-uuid" },
      },
    });
  });

  test("does not write to storage when the provider has no stored entry", async () => {
    const context = createMockEventingInstallationContext();
    const {
      commerceEventsStep: mockedCommerceEventsStep,
      utilsMocks,
      configMocks,
    } = await importCommerceEventsStepWithMocks();

    utilsMocks.getIoEventsExistingData.mockResolvedValue(
      createMockExistingIoEventsData(),
    );
    utilsMocks.getCommerceEventingExistingData.mockResolvedValue(
      createMockExistingCommerceEventingData(),
    );
    configMocks.getSystemConfigByKey.mockResolvedValue(null);

    expect.assert(mockedCommerceEventsStep.uninstall);
    await mockedCommerceEventsStep.uninstall(
      createConfigWithCommerceProviderKey("order-events-provider"),
      context,
    );

    expect(configMocks.setSystemConfigByKey).not.toHaveBeenCalled();
  });

  test("does not write to storage when the provider has no explicit key", async () => {
    const context = createMockEventingInstallationContext();
    const {
      commerceEventsStep: mockedCommerceEventsStep,
      utilsMocks,
      configMocks,
    } = await importCommerceEventsStepWithMocks();

    utilsMocks.getIoEventsExistingData.mockResolvedValue(
      createMockExistingIoEventsData(),
    );
    utilsMocks.getCommerceEventingExistingData.mockResolvedValue(
      createMockExistingCommerceEventingData(),
    );
    configMocks.getSystemConfigByKey.mockResolvedValue({
      providers: {
        "unrelated-provider": { events: {}, id: "keep-uuid" },
      },
    });

    expect.assert(mockedCommerceEventsStep.uninstall);
    await mockedCommerceEventsStep.uninstall(
      configWithCommerceEventing,
      context,
    );

    expect(configMocks.setSystemConfigByKey).not.toHaveBeenCalled();
  });
});
