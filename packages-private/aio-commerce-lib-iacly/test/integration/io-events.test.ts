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

import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { IoEventsOutputs } from "../../source/events/io-events/outputs";
import { IOEventsProvider } from "../../source/events/io-events/provider";
import { ioEventsFixtures, ioEventsHandlers } from "../fixtures/io-events";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const ORG_CONTEXT = {
  consumerOrgId: "test-org",
  projectId: "test-project",
  workspaceId: "test-workspace",
};

describe("IOEventsProvider — provider resource", () => {
  let provider: IOEventsProvider;

  beforeEach(() => {
    provider = new IOEventsProvider(ioEventsFixtures.client, ORG_CONTEXT);
  });

  // resources is a typed tuple: [IoEventsProviderResource, IoEventsEventMetadataResource]
  const providerResource = () => provider.resources[0];
  const metadataResource = () => provider.resources[1];

  describe("resource metadata", () => {
    it("provider resource has no deps", () => {
      expect(providerResource().dependsOn).toEqual([]);
    });

    it("event-metadata resource depends on io-events/provider", () => {
      expect(metadataResource().dependsOn).toEqual(["io-events/provider"]);
    });
  });

  describe("provider resource — check()", () => {
    it("returns io-events providers from config", async () => {
      const config = {
        ioEvents: {
          providers: [ioEventsFixtures.desired.provider],
          eventMetadata: [],
          registrations: [],
        },
      };
      const desired = await providerResource().check(config);
      expect(desired).toHaveLength(1);
    });

    it("returns [] when ioEvents config is absent", async () => {
      expect(await providerResource().check({})).toEqual([]);
    });
  });

  describe("provider resource — list()", () => {
    it("returns live providers from the API", async () => {
      server.use(...ioEventsHandlers.listProvidersOne);
      const live = await providerResource().list();
      expect(live).toHaveLength(1);
      expect(live[0].instance_id).toBe("my-instance");
    });
  });

  describe("provider resource — diff()", () => {
    it("creates when current is null", () => {
      const result = providerResource().diff(
        null,
        ioEventsFixtures.desired.provider,
      );
      expect(result.kind).toBe("create");
    });

    it("noops when current matches desired", () => {
      const result = providerResource().diff(
        ioEventsFixtures.state.provider,
        ioEventsFixtures.desired.provider,
      );
      expect(result.kind).toBe("noop");
    });
  });

  describe("provider resource — create()", () => {
    it("calls createEventProvider and returns the created provider", async () => {
      server.use(...ioEventsHandlers.createProvider);
      const state = await providerResource().create(
        ioEventsFixtures.desired.provider,
        new Map(),
      );
      expect(state.id).toBe("api-provider-id-123");
    });
  });

  describe("provider resource — outputs()", () => {
    it("returns providerId keyed by instance_id", () => {
      const outputs = providerResource().outputs([
        ioEventsFixtures.state.provider,
      ]);
      expect(outputs["my-instance"]).toEqual({
        providerId: "api-provider-id-123",
      });
    });
  });

  describe("IoEventsOutputs accessor", () => {
    it("resolves providerId from upstream map", () => {
      const upstream = new Map([
        [
          "io-events/provider",
          { "my-instance": { providerId: "api-provider-id-123" } },
        ],
      ]);
      const result = IoEventsOutputs.provider(upstream, "my-instance");
      expect(result.providerId).toBe("api-provider-id-123");
    });
  });

  describe("event-metadata resource — check()", () => {
    it("returns event metadata items from config", async () => {
      const config = {
        ioEvents: {
          providers: [],
          eventMetadata: [ioEventsFixtures.desired.metadata],
          registrations: [],
        },
      };
      const desired = await metadataResource().check(config);
      expect(desired).toHaveLength(1);
    });
  });

  describe("event-metadata resource — create()", () => {
    it("uses upstream to resolve provider ID, then calls createEventMetadata", async () => {
      server.use(...ioEventsHandlers.createMetadata);
      const upstream = new Map([
        [
          "io-events/provider",
          { "my-instance": { providerId: "api-provider-id-123" } },
        ],
      ]);
      const state = await metadataResource().create(
        ioEventsFixtures.desired.metadata,
        upstream,
      );
      expect(state.event_code).toBe("com.adobe.commerce.order.placed");
    });
  });

  describe("event-metadata resource — list()", () => {
    it("enriches metadata items with providerInstanceId and apiProviderId", async () => {
      server.use(
        ...ioEventsHandlers.listProvidersOne,
        ...ioEventsHandlers.listMetadataForProvider,
      );
      const live = await metadataResource().list();
      expect(live).toHaveLength(1);
      expect(live[0].providerInstanceId).toBe("my-instance");
      expect(live[0].apiProviderId).toBe("api-provider-id-123");
      expect(live[0].event_code).toBe("com.adobe.commerce.order.placed");
    });

    it("returns [] when there are no providers", async () => {
      server.use(...ioEventsHandlers.listProvidersEmpty);
      const live = await metadataResource().list();
      expect(live).toEqual([]);
    });
  });

  describe("event-metadata resource — diff()", () => {
    it("creates when current is null", () => {
      const result = metadataResource().diff(
        null,
        ioEventsFixtures.desired.metadata,
      );
      expect(result.kind).toBe("create");
    });

    it("noops when current matches desired", () => {
      const current = {
        providerInstanceId: "my-instance",
        apiProviderId: "api-provider-id-123",
        event_code: "com.adobe.commerce.order.placed",
        label: "Order Placed",
        description: "Fired when an order is placed",
      };
      const result = metadataResource().diff(
        current,
        ioEventsFixtures.desired.metadata,
      );
      expect(result.kind).toBe("noop");
    });

    it("replaces when label changes", () => {
      const current = {
        providerInstanceId: "my-instance",
        apiProviderId: "api-provider-id-123",
        event_code: "com.adobe.commerce.order.placed",
        label: "Old Label",
        description: "Fired when an order is placed",
      };
      const result = metadataResource().diff(
        current,
        ioEventsFixtures.desired.metadata,
      );
      expect(result.kind).toBe("replace");
    });
  });

  describe("event-metadata resource — delete()", () => {
    it("calls deleteEventMetadataForProvider with the correct identifiers", async () => {
      server.use(...ioEventsHandlers.deleteMetadata);
      const current = {
        providerInstanceId: "my-instance",
        apiProviderId: "api-provider-id-123",
        event_code: "com.adobe.commerce.order.placed",
        label: "Order Placed",
        description: "Fired when an order is placed",
      };
      await expect(
        metadataResource().delete(
          "my-instance:com.adobe.commerce.order.placed",
          current,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe("provider resource — delete()", () => {
    it("calls deleteEventProvider with the correct identifiers", async () => {
      server.use(...ioEventsHandlers.deleteProvider);
      await expect(
        providerResource().delete(
          "my-instance",
          ioEventsFixtures.state.provider,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe("provider resource — diff() replace", () => {
    it("replaces when label changes", () => {
      const result = providerResource().diff(
        { ...ioEventsFixtures.state.provider, label: "Old Label" },
        ioEventsFixtures.desired.provider,
      );
      expect(result.kind).toBe("replace");
    });
  });

  describe("IoEventsOutputs — error handling", () => {
    it("throws when instanceId is not found in upstream", () => {
      const upstream = new Map([["io-events/provider", {}]]);
      expect(() => IoEventsOutputs.provider(upstream, "nonexistent")).toThrow(
        'No io-events/provider output found for instanceId "nonexistent"',
      );
    });

    it("throws when io-events/provider key is missing from upstream", () => {
      const upstream = new Map();
      expect(() => IoEventsOutputs.provider(upstream, "my-instance")).toThrow(
        'No io-events/provider output found for instanceId "my-instance"',
      );
    });
  });

  const registrationResource = () => provider.resources[2];

  describe("registration resource", () => {
    it("depends on io-events/event-metadata", () => {
      expect(registrationResource().dependsOn).toEqual([
        "io-events/event-metadata",
      ]);
    });

    it("check() returns registrations from config", async () => {
      const config = {
        ioEvents: {
          providers: [],
          eventMetadata: [],
          registrations: [ioEventsFixtures.desired.registration],
        },
      };
      const desired = await registrationResource().check(config);
      expect(desired).toHaveLength(1);
      expect(desired[0].name).toBe("My Registration");
    });

    it("diff() creates when current is null", () => {
      const result = registrationResource().diff(
        null,
        ioEventsFixtures.desired.registration,
      );
      expect(result.kind).toBe("create");
    });

    it("create() calls createRegistration using upstream event codes", async () => {
      server.use(...ioEventsHandlers.createRegistration);
      const upstream = new Map([
        [
          "io-events/provider",
          { "my-instance": { providerId: "api-provider-id-123" } },
        ],
      ]);
      const state = await registrationResource().create(
        ioEventsFixtures.desired.registration,
        upstream,
      );
      expect(state.id).toBe("reg-id-456");
    });

    it("delete() calls deleteRegistration", async () => {
      server.use(...ioEventsHandlers.deleteRegistration);
      await expect(
        registrationResource().delete(
          "My Registration",
          ioEventsFixtures.state.registration,
        ),
      ).resolves.toBeUndefined();
    });
  });
});
