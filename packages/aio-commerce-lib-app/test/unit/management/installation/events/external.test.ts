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

import { externalEventsStep } from "#management/installation/events/external";
import { isLeafStep } from "#management/installation/workflow/step";
import {
  configWithCommerceEventing,
  configWithExternalEventing,
  createExternalEventConfig,
  minimalValidConfig,
} from "#test/fixtures/config";
import {
  createMockEventingInstallationContext,
  createMockExistingIoEventsData,
} from "#test/fixtures/eventing";

describe("externalEventsStep leaf step", () => {
  test("should be a leaf step with name and meta", () => {
    expect(isLeafStep(externalEventsStep)).toBe(true);
    expect(externalEventsStep.name).toBe("external");
    expect(externalEventsStep.meta).toEqual({
      install: {
        label: "Configure External Events",
        description: "Sets up I/O Events for external event sources",
      },
      uninstall: {
        label: "Remove External Events",
        description: "Removes I/O Events for external event sources",
      },
    });
  });

  test("should only run if eventing.external is defined", () => {
    expect.assert(externalEventsStep.when);

    expect(externalEventsStep.when(configWithExternalEventing)).toBe(true);
    expect(externalEventsStep.when(configWithCommerceEventing)).toBe(false);
    expect(externalEventsStep.when(minimalValidConfig)).toBe(false);
  });
});

describe("externalEventsStep orchestration", () => {
  async function importExternalStepWithMocks() {
    vi.resetModules();

    const helperMocks = { onboardIoEvents: vi.fn() };
    const utilsMocks = { getIoEventsExistingData: vi.fn() };
    const configMocks = {
      getSystemConfigByKey: vi.fn().mockResolvedValue(null),
      setSystemConfigByKey: vi.fn().mockResolvedValue(undefined),
    };

    vi.doMock("#management/installation/events/helpers", async () => {
      const actual = await vi.importActual<
        typeof import("#management/installation/events/helpers")
      >("#management/installation/events/helpers");
      return { ...actual, ...helperMocks };
    });

    vi.doMock("#management/installation/events/utils", async () => {
      const actual = await vi.importActual<
        typeof import("#management/installation/events/utils")
      >("#management/installation/events/utils");
      return { ...actual, ...utilsMocks };
    });

    vi.doMock("@adobe/aio-commerce-lib-config", async () => {
      const actual = await vi.importActual<
        typeof import("@adobe/aio-commerce-lib-config")
      >("@adobe/aio-commerce-lib-config");
      return {
        ...actual,
        ...configMocks,
      };
    });

    const module = await import("#management/installation/events/external");
    return {
      externalEventsStep: module.externalEventsStep,
      helperMocks,
      utilsMocks,
      configMocks,
    };
  }

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.doUnmock("#management/installation/events/helpers");
    vi.doUnmock("#management/installation/events/utils");
    vi.doUnmock("@adobe/aio-commerce-lib-config");
  });

  test("persists provider id and event codes to system storage keyed by the provider storage key", async () => {
    const context = createMockEventingInstallationContext();

    const { externalEventsStep, helperMocks, utilsMocks, configMocks } =
      await importExternalStepWithMocks();

    utilsMocks.getIoEventsExistingData.mockResolvedValue(
      createMockExistingIoEventsData(),
    );
    helperMocks.onboardIoEvents.mockResolvedValue({
      providerData: { id: "external-provider-uuid-123" },
      eventsData: [
        {
          config: { name: "external_event" },
          data: { metadata: { event_code: "external_event" } },
        },
      ],
    });

    await externalEventsStep.install(configWithExternalEventing, context);

    expect(configMocks.setSystemConfigByKey).toHaveBeenCalledWith("events", {
      providers: {
        "third-party-events-provider": {
          id: "external-provider-uuid-123",
          events: { external_event: "external_event" },
        },
      },
    });
  });

  test("merges newly stored providers with pre-existing stored data", async () => {
    const context = createMockEventingInstallationContext();

    const { externalEventsStep, helperMocks, utilsMocks, configMocks } =
      await importExternalStepWithMocks();

    configMocks.getSystemConfigByKey.mockResolvedValue({
      providers: {
        "existing-provider": { id: "existing-uuid", events: {} },
      },
    });
    utilsMocks.getIoEventsExistingData.mockResolvedValue(
      createMockExistingIoEventsData(),
    );
    helperMocks.onboardIoEvents.mockResolvedValue({
      providerData: { id: "external-provider-uuid-123" },
      eventsData: [
        {
          config: { name: "external_event" },
          data: { metadata: { event_code: "external_event" } },
        },
      ],
    });

    await externalEventsStep.install(configWithExternalEventing, context);

    expect(configMocks.setSystemConfigByKey).toHaveBeenCalledWith("events", {
      providers: {
        "existing-provider": { id: "existing-uuid", events: {} },
        "third-party-events-provider": {
          id: "external-provider-uuid-123",
          events: { external_event: "external_event" },
        },
      },
    });
  });

  test("skips a provider whose events are all scoped to another environment", async () => {
    const context = createMockEventingInstallationContext({
      params: { AIO_COMMERCE_API_FLAVOR: "paas" },
    });

    const { externalEventsStep, helperMocks, utilsMocks } =
      await importExternalStepWithMocks();

    utilsMocks.getIoEventsExistingData.mockResolvedValue(
      createMockExistingIoEventsData(),
    );
    helperMocks.onboardIoEvents.mockResolvedValue({
      eventsData: [],
      providerData: {},
    });

    const config = createExternalEventConfig("ext.saas_event", {
      label: "SaaS Event",
      description: "SaaS-only external event",
      runtimeActions: ["my-package/on-saas"],
      env: ["saas"],
    });

    const result = await externalEventsStep.install(config, context);

    expect(result).toHaveLength(0);
    expect(helperMocks.onboardIoEvents).not.toHaveBeenCalled();
  });
});
