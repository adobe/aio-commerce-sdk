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

import { describe, expect, it } from "vitest";

import { AdminUiProvider } from "../../source/admin-ui/provider";
import { CommerceEventsProvider } from "../../source/events/commerce-events/provider";
import { IOEventsProvider } from "../../source/events/io-events/provider";
import { WebhooksProvider } from "../../source/webhooks/provider";

import type { Resource } from "@aio-commerce-sdk/iacly";
import type { LibIaclyConfig } from "../../source/index";

const ORG_CONTEXT = {
  consumerOrgId: "org",
  projectId: "proj",
  workspaceId: "ws",
};

// null as any — these tests don't make HTTP calls, only inspect metadata.
const mockClient = null as any;

describe("WebhooksProvider structure", () => {
  const p = new WebhooksProvider(mockClient);
  it("has one resource with correct kind and no deps", () => {
    expect(p.resources).toHaveLength(1);
    expect(p.resources[0].kind).toBe("webhooks/webhook");
    expect(p.resources[0].dependsOn).toEqual([]);
  });
});

describe("IOEventsProvider structure", () => {
  const p = new IOEventsProvider(mockClient, ORG_CONTEXT);
  it("has three resources", () => {
    expect(p.resources).toHaveLength(3);
  });
  it("provider resource: no deps", () => {
    const r = p.resources.find((r) => r.kind === "io-events/provider");
    expect(r).toBeDefined();
    expect((r as Resource<LibIaclyConfig, unknown, unknown>).dependsOn).toEqual(
      [],
    );
    expect(
      (r as Resource<LibIaclyConfig, unknown, unknown>).outputs,
    ).toBeTypeOf("function");
  });
  it("event-metadata resource: depends on io-events/provider", () => {
    const r = p.resources.find((r) => r.kind === "io-events/event-metadata");
    expect(r).toBeDefined();
    expect((r as Resource<LibIaclyConfig, unknown, unknown>).dependsOn).toEqual(
      ["io-events/provider"],
    );
  });
  it("registration resource: depends on io-events/event-metadata", () => {
    const r = p.resources.find((r) => r.kind === "io-events/registration");
    expect(r).toBeDefined();
    expect((r as Resource<LibIaclyConfig, unknown, unknown>).dependsOn).toEqual(
      ["io-events/event-metadata"],
    );
  });
});

describe("CommerceEventsProvider structure", () => {
  const p = new CommerceEventsProvider(mockClient);
  it("has three resources", () => {
    expect(p.resources).toHaveLength(3);
  });
  it("setup resource: no deps", () => {
    const r = p.resources.find((r) => r.kind === "commerce-events/setup");
    expect(r).toBeDefined();
    expect((r as Resource<LibIaclyConfig, unknown, unknown>).dependsOn).toEqual(
      [],
    );
  });
  it("provider resource: depends on io-events/provider and commerce-events/setup", () => {
    const r = p.resources.find((r) => r.kind === "commerce-events/provider");
    expect(r).toBeDefined();
    const deps = (r as Resource<LibIaclyConfig, unknown, unknown>).dependsOn;
    expect(deps).toContain("io-events/provider");
    expect(deps).toContain("commerce-events/setup");
  });
  it("subscription resource: depends on commerce-events/provider", () => {
    const r = p.resources.find(
      (r) => r.kind === "commerce-events/subscription",
    );
    expect(r).toBeDefined();
    expect((r as Resource<LibIaclyConfig, unknown, unknown>).dependsOn).toEqual(
      ["commerce-events/provider"],
    );
  });
});

describe("AdminUiProvider structure", () => {
  const p = new AdminUiProvider(mockClient);
  it("has one snapshot-only resource", () => {
    expect(p.resources).toHaveLength(1);
    expect(p.resources[0].kind).toBe("admin-ui/extension");
    expect(p.resources[0].dependsOn).toEqual([]);
    const r = p.resources[0] as Resource<LibIaclyConfig, unknown, unknown>;
    expect(r.list).toBeUndefined();
  });
});
