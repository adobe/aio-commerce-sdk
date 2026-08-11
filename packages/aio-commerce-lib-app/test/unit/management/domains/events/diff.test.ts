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

import {
  COMMERCE_SUBSCRIPTION_DOMAIN,
  eventingDomainCollectors,
  IO_EVENTS_METADATA_DOMAIN,
  IO_EVENTS_PROVIDER_DOMAIN,
  IO_EVENTS_REGISTRATION_DOMAIN,
} from "#management/domains/events/diff";
import {
  diffConfig,
  getChangesForDomain,
  isEmptyPlan,
} from "#management/upgrade/diff";
import { createMockMetadata } from "#test/fixtures/config";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";
import type { ResourceChange, ResourceKind } from "#management/upgrade/types";

type TestEvent = {
  name: string;
  label?: string;
  description?: string;
  runtimeActions?: string[];
  fields?: { name: string }[];
};

function commerceSource(
  providerLabel: string,
  events: TestEvent[],
  key?: string,
) {
  return {
    events: events.map((event) => ({
      description: "event description",
      fields: [{ name: "field" }],
      label: "Event",
      runtimeActions: ["my-package/action"],
      ...event,
    })),
    provider: {
      description: `${providerLabel} description`,
      label: providerLabel,
      ...(key ? { key } : {}),
    },
  };
}

function externalSource(
  providerLabel: string,
  events: TestEvent[],
  key?: string,
) {
  return {
    events: events.map((event) => ({
      description: "event description",
      label: "Event",
      runtimeActions: ["my-package/action"],
      ...event,
    })),
    provider: {
      description: `${providerLabel} description`,
      label: providerLabel,
      ...(key ? { key } : {}),
    },
  };
}

function cfg(eventing: {
  commerce?: ReturnType<typeof commerceSource>[];
  external?: ReturnType<typeof externalSource>[];
}): CommerceAppConfigOutputModel {
  return {
    eventing,
    metadata: createMockMetadata("diff-app"),
  } as unknown as CommerceAppConfigOutputModel;
}

/** Maps a domain's operative changes to `{ identity: kind }` for concise assertions. */
function kindsByIdentity(
  changes: ResourceChange[],
): Record<string, ResourceKind> {
  return Object.fromEntries(changes.map((c) => [c.identity, c.kind]));
}

describe("eventingDomainCollectors via diffConfig", () => {
  test("no changes between identical configs yields an empty plan", () => {
    const config = cfg({
      commerce: [commerceSource("Commerce Provider", [{ name: "observer.a" }])],
      external: [externalSource("External Provider", [{ name: "ext.a" }])],
    });

    const diff = diffConfig(config, config, eventingDomainCollectors);
    expect(isEmptyPlan(diff)).toBe(true);
  });

  test("adding a provider adds its provider, metadata, and registration", () => {
    const baseline = cfg({
      external: [externalSource("Provider A", [{ name: "a" }])],
    });
    const target = cfg({
      external: [
        externalSource("Provider A", [{ name: "a" }]),
        externalSource("Provider B", [{ name: "b" }]),
      ],
    });

    const diff = diffConfig(baseline, target, eventingDomainCollectors);

    const providers = getChangesForDomain(diff, IO_EVENTS_PROVIDER_DOMAIN);
    expect(providers).toEqual([
      expect.objectContaining({ identity: "Provider B", kind: "added" }),
    ]);
    expect(
      getChangesForDomain(diff, IO_EVENTS_METADATA_DOMAIN).every(
        (c) => c.kind === "added",
      ),
    ).toBe(true);
    expect(
      getChangesForDomain(diff, IO_EVENTS_REGISTRATION_DOMAIN).map(
        (c) => c.kind,
      ),
    ).toEqual(["added"]);
  });

  test("removing a provider removes it destructively along with its sub-resources", () => {
    const baseline = cfg({
      external: [
        externalSource("Provider A", [{ name: "a" }]),
        externalSource("Provider B", [{ name: "b" }]),
      ],
    });
    const target = cfg({
      external: [externalSource("Provider A", [{ name: "a" }])],
    });

    const diff = diffConfig(baseline, target, eventingDomainCollectors);

    const provider = getChangesForDomain(diff, IO_EVENTS_PROVIDER_DOMAIN);
    expect(provider).toEqual([
      expect.objectContaining({
        destructive: true,
        identity: "Provider B",
        kind: "removed",
      }),
    ]);
    expect(
      getChangesForDomain(diff, IO_EVENTS_METADATA_DOMAIN).map((c) => c.kind),
    ).toEqual(["removed"]);
    expect(
      getChangesForDomain(diff, IO_EVENTS_REGISTRATION_DOMAIN).map(
        (c) => c.kind,
      ),
    ).toEqual(["removed"]);
  });

  test("adding an event on a new runtime action adds a metadata and a registration", () => {
    const baseline = cfg({
      external: [
        externalSource("Provider A", [
          { name: "a", runtimeActions: ["pkg/act-a"] },
        ]),
      ],
    });
    const target = cfg({
      external: [
        externalSource("Provider A", [
          { name: "a", runtimeActions: ["pkg/act-a"] },
          { name: "b", runtimeActions: ["pkg/act-b"] },
        ]),
      ],
    });

    const diff = diffConfig(baseline, target, eventingDomainCollectors);

    expect(getChangesForDomain(diff, IO_EVENTS_PROVIDER_DOMAIN)).toEqual([]);
    expect(
      kindsByIdentity(getChangesForDomain(diff, IO_EVENTS_REGISTRATION_DOMAIN)),
    ).toEqual({ "Provider A:pkg/act-b": "added" });
    expect(
      getChangesForDomain(diff, IO_EVENTS_METADATA_DOMAIN).map((c) => c.kind),
    ).toEqual(["added"]);
  });

  test("adding an event on an existing runtime action changes that registration (supported)", () => {
    const baseline = cfg({
      external: [
        externalSource("Provider A", [
          { name: "a", runtimeActions: ["pkg/act"] },
        ]),
      ],
    });
    const target = cfg({
      external: [
        externalSource("Provider A", [
          { name: "a", runtimeActions: ["pkg/act"] },
          { name: "b", runtimeActions: ["pkg/act"] },
        ]),
      ],
    });

    const diff = diffConfig(baseline, target, eventingDomainCollectors);

    const registrations = getChangesForDomain(
      diff,
      IO_EVENTS_REGISTRATION_DOMAIN,
    );
    expect(registrations).toEqual([
      expect.objectContaining({
        identity: "Provider A:pkg/act",
        kind: "changed",
        supported: true,
      }),
    ]);
    // The added event still contributes a new metadata entry.
    expect(
      getChangesForDomain(diff, IO_EVENTS_METADATA_DOMAIN).map((c) => c.kind),
    ).toEqual(["added"]);
  });

  test("commerce source add/remove drives subscriptions and I/O resources", () => {
    const baseline = cfg({
      commerce: [commerceSource("Commerce", [{ name: "observer.a" }])],
    });
    const target = cfg({
      commerce: [
        commerceSource("Commerce", [
          { name: "observer.a" },
          { name: "observer.b" },
        ]),
      ],
    });

    const diff = diffConfig(baseline, target, eventingDomainCollectors);

    const subs = getChangesForDomain(diff, COMMERCE_SUBSCRIPTION_DOMAIN);
    expect(subs).toHaveLength(1);
    expect(subs[0].kind).toBe("added");
    expect(subs[0].destructive).toBe(false);
  });

  test("removing the whole commerce domain removes subscriptions and I/O resources", () => {
    const baseline = cfg({
      commerce: [commerceSource("Commerce", [{ name: "observer.a" }])],
    });
    const target = cfg({ external: [] });

    const diff = diffConfig(baseline, target, eventingDomainCollectors);

    expect(
      getChangesForDomain(diff, COMMERCE_SUBSCRIPTION_DOMAIN).map(
        (c) => c.kind,
      ),
    ).toEqual(["removed"]);
    expect(
      getChangesForDomain(diff, IO_EVENTS_PROVIDER_DOMAIN).map((c) => ({
        destructive: c.destructive,
        kind: c.kind,
      })),
    ).toEqual([{ destructive: true, kind: "removed" }]);
  });

  test("removing the whole external domain removes its provider destructively", () => {
    const baseline = cfg({
      external: [externalSource("External Provider", [{ name: "a" }])],
    });
    const target = cfg({ commerce: [] });

    const diff = diffConfig(baseline, target, eventingDomainCollectors);

    expect(getChangesForDomain(diff, IO_EVENTS_PROVIDER_DOMAIN)).toEqual([
      expect.objectContaining({
        destructive: true,
        identity: "External Provider",
        kind: "removed",
      }),
    ]);
  });
});
