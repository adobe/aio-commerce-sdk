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

import { createMockMetadata } from "#test/fixtures/config";
import {
  createMockEventingInstallationContext,
  createMockExistingIoEventsData,
} from "#test/fixtures/eventing";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

const RUNTIME_ACTION = "my-package/action";

function source(label: string, events: { name: string }[]) {
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

function cfg(
  external?: ReturnType<typeof source>[],
): CommerceAppConfigOutputModel {
  return {
    ...(external ? { eventing: { external } } : {}),
    metadata: createMockMetadata("upgrade"),
  } as unknown as CommerceAppConfigOutputModel;
}

async function importWithMocks() {
  vi.resetModules();
  const spies = {
    commerceInstall: vi.fn().mockResolvedValue(undefined),
    commerceUninstall: vi.fn().mockResolvedValue(undefined),
    externalInstall: vi.fn().mockResolvedValue(undefined),
    externalUninstall: vi.fn().mockResolvedValue(undefined),
    getIoEventsExistingData: vi
      .fn()
      .mockResolvedValue(createMockExistingIoEventsData()),
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

  const { executeUpgrade } = await import("#management/upgrade/runner");
  const { appUpgradeDomains } = await import("#management/upgrade-domains");
  return { appUpgradeDomains, executeUpgrade, spies };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  vi.doUnmock("#management/domains/events/commerce");
  vi.doUnmock("#management/domains/events/external");
  vi.doUnmock("#management/domains/events/utils");
});

describe("runUpgrade path drives eventing add/remove", () => {
  test("adding an event provider converges it and reports the diff", async () => {
    const context = createMockEventingInstallationContext();
    const { executeUpgrade, appUpgradeDomains, spies } =
      await importWithMocks();

    const result = await executeUpgrade({
      baseline: { config: cfg() },
      context,
      domains: appUpgradeDomains,
      targetConfig: cfg([source("A", [{ name: "a" }])]),
    });

    expect(result.status).toBe("applied");
    expect(spies.externalInstall).toHaveBeenCalledTimes(1);
    expect(spies.externalUninstall).not.toHaveBeenCalled();
    // The provider (and its event's metadata + registration) surface as additive changes.
    expect(
      result.diff.changes.filter((c) => c.kind === "added").length,
    ).toBeGreaterThanOrEqual(3);
  });

  test("removing an event provider tears it down", async () => {
    const context = createMockEventingInstallationContext();
    const { executeUpgrade, appUpgradeDomains, spies } =
      await importWithMocks();

    const result = await executeUpgrade({
      baseline: { config: cfg([source("A", [{ name: "a" }])]) },
      context,
      domains: appUpgradeDomains,
      targetConfig: cfg(),
    });

    expect(result.status).toBe("applied");
    expect(spies.externalUninstall).toHaveBeenCalledTimes(1);
    expect(spies.externalInstall).not.toHaveBeenCalled();
  });

  test("no eventing changes is a no-op", async () => {
    const context = createMockEventingInstallationContext();
    const { executeUpgrade, appUpgradeDomains, spies } =
      await importWithMocks();
    const config = cfg([source("A", [{ name: "a" }])]);

    const result = await executeUpgrade({
      baseline: { config },
      context,
      domains: appUpgradeDomains,
      targetConfig: config,
    });

    expect(result.status).toBe("empty");
    expect(spies.externalInstall).not.toHaveBeenCalled();
    expect(spies.externalUninstall).not.toHaveBeenCalled();
  });
});
