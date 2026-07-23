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
        description: "Sets up I/O Events for external event sources",
        label: "Configure External Events",
      },
      uninstall: {
        description: "Removes I/O Events for external event sources",
        label: "Remove External Events",
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
      configMocks,
      externalEventsStep: module.externalEventsStep,
      helperMocks,
      utilsMocks,
    };
  }

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.doUnmock("#management/installation/events/helpers");
    vi.doUnmock("#management/installation/events/utils");
    vi.doUnmock("@adobe/aio-commerce-lib-config");
  });

  test("persists provider id and event codes to system storage keyed by provider.key", async () => {
    const context = createMockEventingInstallationContext();

    const {
      externalEventsStep: mockedExternalEventsStep,
      helperMocks,
      utilsMocks,
      configMocks,
    } = await importExternalStepWithMocks();

    const configWithKey = {
      ...configWithExternalEventing,
      eventing: {
        external: [
          {
            events: configWithExternalEventing.eventing.external[0].events,
            provider: {
              description: "Provides external events",
              key: "third-party-events-provider",
              label: "Third Party Events Provider",
            },
          },
        ],
      },
    };

    utilsMocks.getIoEventsExistingData.mockResolvedValue(
      createMockExistingIoEventsData(),
    );
    helperMocks.onboardIoEvents.mockResolvedValue({
      eventsData: [
        {
          config: { name: "external_event" },
          data: { metadata: { event_code: "external_event" } },
        },
      ],
      providerData: { id: "external-provider-uuid-123" },
    });

    await mockedExternalEventsStep.install(configWithKey, context);

    expect(configMocks.setSystemConfigByKey).toHaveBeenCalledWith("events", {
      providers: {
        "third-party-events-provider": {
          events: {
            external_event: {
              code: "external_event",
              isPhiData: false,
            },
          },
          id: "external-provider-uuid-123",
        },
      },
    });
  });

  test("does not store providers that have no explicit key", async () => {
    const context = createMockEventingInstallationContext();

    const {
      externalEventsStep: mockedExternalEventsStep,
      helperMocks,
      utilsMocks,
      configMocks,
    } = await importExternalStepWithMocks();

    utilsMocks.getIoEventsExistingData.mockResolvedValue(
      createMockExistingIoEventsData(),
    );
    helperMocks.onboardIoEvents.mockResolvedValue({
      eventsData: [
        {
          config: { name: "external_event" },
          data: { metadata: { event_code: "external_event" } },
        },
      ],
      providerData: { id: "external-provider-uuid-123" },
    });

    await mockedExternalEventsStep.install(configWithExternalEventing, context);

    expect(configMocks.setSystemConfigByKey).toHaveBeenCalledWith("events", {
      providers: {},
    });
  });

  test("merges newly stored providers with pre-existing stored data", async () => {
    const context = createMockEventingInstallationContext();

    const {
      externalEventsStep: mockedExternalEventsStep,
      helperMocks,
      utilsMocks,
      configMocks,
    } = await importExternalStepWithMocks();

    const configWithKey = {
      ...configWithExternalEventing,
      eventing: {
        external: [
          {
            events: configWithExternalEventing.eventing.external[0].events,
            provider: {
              description: "Provides external events",
              key: "third-party-events-provider",
              label: "Third Party Events Provider",
            },
          },
        ],
      },
    };

    configMocks.getSystemConfigByKey.mockResolvedValue({
      providers: {
        "existing-provider": { events: {}, id: "existing-uuid" },
      },
    });
    utilsMocks.getIoEventsExistingData.mockResolvedValue(
      createMockExistingIoEventsData(),
    );
    helperMocks.onboardIoEvents.mockResolvedValue({
      eventsData: [
        {
          config: { name: "external_event" },
          data: { metadata: { event_code: "external_event" } },
        },
      ],
      providerData: { id: "external-provider-uuid-123" },
    });

    await mockedExternalEventsStep.install(configWithKey, context);

    expect(configMocks.setSystemConfigByKey).toHaveBeenCalledWith("events", {
      providers: {
        "existing-provider": { events: {}, id: "existing-uuid" },
        "third-party-events-provider": {
          events: {
            external_event: {
              code: "external_event",
              isPhiData: false,
            },
          },
          id: "external-provider-uuid-123",
        },
      },
    });
  });

  test("skips a provider whose events are all scoped to another environment", async () => {
    const context = createMockEventingInstallationContext({
      params: { AIO_COMMERCE_API_FLAVOR: "paas" },
    });

    const {
      externalEventsStep: mockedExternalEventsStep,
      helperMocks,
      utilsMocks,
    } = await importExternalStepWithMocks();

    utilsMocks.getIoEventsExistingData.mockResolvedValue(
      createMockExistingIoEventsData(),
    );
    helperMocks.onboardIoEvents.mockResolvedValue({
      eventsData: [],
      providerData: {},
    });

    const config = createExternalEventConfig("ext.saas_event", {
      description: "SaaS-only external event",
      env: ["saas"],
      label: "SaaS Event",
      runtimeActions: ["my-package/on-saas"],
    });

    const result = await mockedExternalEventsStep.install(config, context);

    expect(result).toHaveLength(0);
    expect(helperMocks.onboardIoEvents).not.toHaveBeenCalled();
  });
});

describe("externalEventsStep uninstall orchestration", () => {
  async function importExternalStepWithMocks() {
    vi.resetModules();

    const helperMocks = {
      offboardIoEvents: vi.fn().mockResolvedValue(undefined),
    };
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
      return { ...actual, ...configMocks };
    });

    const module = await import("#management/installation/events/external");
    return {
      configMocks,
      externalEventsStep: module.externalEventsStep,
      utilsMocks,
    };
  }

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.doUnmock("#management/installation/events/helpers");
    vi.doUnmock("#management/installation/events/utils");
    vi.doUnmock("@adobe/aio-commerce-lib-config");
  });

  function configWithProviderKey(key: string) {
    return {
      ...configWithExternalEventing,
      eventing: {
        external: [
          {
            events: configWithExternalEventing.eventing.external[0].events,
            provider: {
              description: "Provides external events",
              key,
              label: "Third Party Events Provider",
            },
          },
        ],
      },
    };
  }

  test("prunes the uninstalled provider's stored entry, preserving unrelated ones", async () => {
    const context = createMockEventingInstallationContext();
    const {
      externalEventsStep: mockedExternalEventsStep,
      utilsMocks,
      configMocks,
    } = await importExternalStepWithMocks();

    utilsMocks.getIoEventsExistingData.mockResolvedValue(
      createMockExistingIoEventsData(),
    );
    configMocks.getSystemConfigByKey.mockResolvedValue({
      providers: {
        "third-party-events-provider": { events: {}, id: "stale-uuid" },
        "unrelated-provider": { events: {}, id: "keep-uuid" },
      },
    });

    expect.assert(mockedExternalEventsStep.uninstall);
    await mockedExternalEventsStep.uninstall(
      configWithProviderKey("third-party-events-provider"),
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
      externalEventsStep: mockedExternalEventsStep,
      utilsMocks,
      configMocks,
    } = await importExternalStepWithMocks();

    utilsMocks.getIoEventsExistingData.mockResolvedValue(
      createMockExistingIoEventsData(),
    );
    configMocks.getSystemConfigByKey.mockResolvedValue(null);

    expect.assert(mockedExternalEventsStep.uninstall);
    await mockedExternalEventsStep.uninstall(
      configWithProviderKey("third-party-events-provider"),
      context,
    );

    expect(configMocks.setSystemConfigByKey).not.toHaveBeenCalled();
  });

  test("does not write to storage when the provider has no explicit key", async () => {
    const context = createMockEventingInstallationContext();
    const {
      externalEventsStep: mockedExternalEventsStep,
      utilsMocks,
      configMocks,
    } = await importExternalStepWithMocks();

    utilsMocks.getIoEventsExistingData.mockResolvedValue(
      createMockExistingIoEventsData(),
    );
    configMocks.getSystemConfigByKey.mockResolvedValue({
      providers: {
        "unrelated-provider": { events: {}, id: "keep-uuid" },
      },
    });

    expect.assert(mockedExternalEventsStep.uninstall);
    await mockedExternalEventsStep.uninstall(
      configWithExternalEventing,
      context,
    );

    expect(configMocks.setSystemConfigByKey).not.toHaveBeenCalled();
  });
});
