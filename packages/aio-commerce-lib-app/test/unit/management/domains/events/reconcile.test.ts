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

import {
  generateInstanceId,
  getIoEventCode,
  getNamespacedEvent,
  getRegistrationName,
} from "#management/domains/events/utils";
import { createMockMetadata } from "#test/fixtures/config";
import {
  createMockEventingInstallationContext,
  createMockExistingIoEventsData,
  createMockIoEventProvider,
  createMockIoEventRegistration,
} from "#test/fixtures/eventing";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { ExistingIoEventsData } from "#management/domains/events/utils";

const metadata = createMockMetadata("recon-app");
const WORKSPACE_ID = "test-workspace-id";
const RUNTIME_ACTION = "my-package/action";

type TestEvent = { name: string; runtimeActions?: string[] };

function commerceSource(label: string, events: TestEvent[]) {
  return {
    events: events.map((event) => ({
      description: "desc",
      fields: [{ name: "field" }],
      label: "Event",
      runtimeActions: [RUNTIME_ACTION],
      ...event,
    })),
    provider: { description: `${label} desc`, label },
  };
}

function externalSource(label: string, events: TestEvent[]) {
  return {
    events: events.map((event) => ({
      description: "desc",
      label: "Event",
      runtimeActions: [RUNTIME_ACTION],
      ...event,
    })),
    provider: { description: `${label} desc`, label },
  };
}

function cfg(eventing?: {
  commerce?: ReturnType<typeof commerceSource>[];
  external?: ReturnType<typeof externalSource>[];
}): CommerceAppConfigOutputModel {
  return { eventing, metadata } as unknown as CommerceAppConfigOutputModel;
}

/** Builds an {@link ExistingIoEventsData} with one deployed commerce provider + its registration. */
function deployedCommerceProvider(label: string): ExistingIoEventsData {
  const instanceId = generateInstanceId(
    metadata,
    { description: "", label },
    WORKSPACE_ID,
  );
  const provider = {
    ...createMockIoEventProvider({
      id: `io-${label}`,
      instance_id: instanceId,
      label,
      provider_metadata: "dx_commerce_events",
    }),
    metadata: [],
  };

  return createMockExistingIoEventsData({
    providersWithMetadata: [provider],
    registrations: [
      createMockIoEventRegistration({
        client_id: "test-client-id",
        name: getRegistrationName(provider, RUNTIME_ACTION),
        registration_id: `reg-${label}`,
      }),
    ],
  });
}

async function importReconcileWithMocks(existingData: ExistingIoEventsData) {
  vi.resetModules();

  const spies = {
    commerceInstall: vi.fn().mockResolvedValue(undefined),
    commerceUninstall: vi.fn().mockResolvedValue(undefined),
    externalInstall: vi.fn().mockResolvedValue(undefined),
    externalUninstall: vi.fn().mockResolvedValue(undefined),
    getIoEventsExistingData: vi.fn().mockResolvedValue(existingData),
  };

  vi.doMock("#management/domains/events/commerce", async () => {
    const actual = await vi.importActual<
      typeof import("#management/domains/events/commerce")
    >("#management/domains/events/commerce");
    return {
      ...actual,
      commerceEventsStep: {
        ...actual.commerceEventsStep,
        install: spies.commerceInstall,
        uninstall: spies.commerceUninstall,
      },
    };
  });

  vi.doMock("#management/domains/events/external", async () => {
    const actual = await vi.importActual<
      typeof import("#management/domains/events/external")
    >("#management/domains/events/external");
    return {
      ...actual,
      externalEventsStep: {
        ...actual.externalEventsStep,
        install: spies.externalInstall,
        uninstall: spies.externalUninstall,
      },
    };
  });

  vi.doMock("#management/domains/events/utils", async () => {
    const actual = await vi.importActual<
      typeof import("#management/domains/events/utils")
    >("#management/domains/events/utils");
    return {
      ...actual,
      getIoEventsExistingData: spies.getIoEventsExistingData,
    };
  });

  const module = await import("#management/domains/events/reconcile");
  return { reconcileEventing: module.reconcileEventing, spies };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.doUnmock("#management/domains/events/commerce");
  vi.doUnmock("#management/domains/events/external");
  vi.doUnmock("#management/domains/events/utils");
});

describe("reconcileEventing", () => {
  test("no-op when the configs are identical", async () => {
    const context = createMockEventingInstallationContext();
    const config = cfg({ external: [externalSource("A", [{ name: "a" }])] });
    const { reconcileEventing, spies } = await importReconcileWithMocks(
      createMockExistingIoEventsData(),
    );

    const result = await reconcileEventing({
      baseline: { config },
      context,
      targetConfig: config,
    });

    expect(spies.externalInstall).not.toHaveBeenCalled();
    expect(spies.getIoEventsExistingData).not.toHaveBeenCalled();
    expect(result.providers).toEqual({ added: [], removed: [] });
  });

  test("adding a provider converges via install and reports it", async () => {
    const context = createMockEventingInstallationContext();
    const baseline = cfg();
    const target = cfg({ external: [externalSource("A", [{ name: "a" }])] });
    const { reconcileEventing, spies } = await importReconcileWithMocks(
      createMockExistingIoEventsData(),
    );

    const result = await reconcileEventing({
      baseline: { config: baseline },
      context,
      targetConfig: target,
    });

    expect(spies.externalInstall).toHaveBeenCalledTimes(1);
    expect(spies.commerceInstall).not.toHaveBeenCalled();
    expect(spies.externalUninstall).not.toHaveBeenCalled();
    expect(result.providers.added).toEqual(["A"]);
  });

  test("removing a provider tears it down via uninstall on a subset", async () => {
    const context = createMockEventingInstallationContext();
    const baseline = cfg({ external: [externalSource("A", [{ name: "a" }])] });
    const target = cfg();
    const { reconcileEventing, spies } = await importReconcileWithMocks(
      createMockExistingIoEventsData(),
    );

    const result = await reconcileEventing({
      baseline: { config: baseline },
      context,
      targetConfig: target,
    });

    expect(spies.externalUninstall).toHaveBeenCalledTimes(1);
    const [subsetConfig] = spies.externalUninstall.mock.calls[0];
    expect(subsetConfig.eventing.external).toHaveLength(1);
    expect(spies.externalInstall).not.toHaveBeenCalled();
    expect(result.providers.removed).toEqual(["A"]);
  });

  test("adding an event to an existing action updates the registration in place", async () => {
    const context = createMockEventingInstallationContext();
    const baseline = cfg({
      commerce: [commerceSource("A", [{ name: "observer.a" }])],
    });
    const target = cfg({
      commerce: [
        commerceSource("A", [{ name: "observer.a" }, { name: "observer.b" }]),
      ],
    });
    const { reconcileEventing } = await importReconcileWithMocks(
      deployedCommerceProvider("A"),
    );

    await reconcileEventing({
      baseline: { config: baseline },
      context,
      targetConfig: target,
    });

    expect(context.ioEventsClient.updateRegistration).toHaveBeenCalledTimes(1);
    const [payload] = (
      context.ioEventsClient.updateRegistration as ReturnType<typeof vi.fn>
    ).mock.calls[0];
    expect(payload.registrationId).toBe("reg-A");
    expect(payload.eventsOfInterest).toHaveLength(2);
  });

  test("removing an event deletes its metadata and Commerce subscription", async () => {
    const context = createMockEventingInstallationContext();
    const baseline = cfg({
      commerce: [
        commerceSource("A", [{ name: "observer.a" }, { name: "observer.b" }]),
      ],
    });
    const target = cfg({
      commerce: [commerceSource("A", [{ name: "observer.a" }])],
    });
    const { reconcileEventing } = await importReconcileWithMocks(
      deployedCommerceProvider("A"),
    );

    await reconcileEventing({
      baseline: { config: baseline },
      context,
      targetConfig: target,
    });

    const removedCode = getIoEventCode(
      getNamespacedEvent(metadata, "observer.b"),
      "dx_commerce_events",
    );
    expect(
      context.ioEventsClient.deleteEventMetadataForProvider,
    ).toHaveBeenCalledWith(expect.objectContaining({ eventCode: removedCode }));
    expect(
      context.commerceEventsClient.deleteEventSubscription,
    ).toHaveBeenCalledWith({
      name: getNamespacedEvent(metadata, "observer.b"),
    });
  });
});
