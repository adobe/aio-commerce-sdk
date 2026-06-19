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

import { CommerceEventsProvider } from "../../source/events/commerce-events/provider";
import {
  commerceEventsFixtures,
  commerceEventsHandlers,
} from "../fixtures/commerce-events";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("CommerceEventsProvider", () => {
  let provider: CommerceEventsProvider;

  beforeEach(() => {
    provider = new CommerceEventsProvider(commerceEventsFixtures.client);
  });

  // resources is a typed tuple: [SetupResource, ProviderResource, SubscriptionResource]
  const setupResource = () => provider.resources[0];
  const providerResource = () => provider.resources[1];
  const subscriptionResource = () => provider.resources[2];

  describe("resource metadata", () => {
    it("setup has no deps", () => {
      expect(setupResource().dependsOn).toEqual([]);
    });

    it("provider depends on io-events/provider and commerce-events/setup", () => {
      expect(providerResource().dependsOn).toEqual([
        "io-events/provider",
        "commerce-events/setup",
      ]);
    });

    it("subscription depends on commerce-events/provider", () => {
      expect(subscriptionResource().dependsOn).toEqual([
        "commerce-events/provider",
      ]);
    });
  });

  describe("setup resource", () => {
    it("check() returns a single setup config item", async () => {
      const config = {
        commerceEvents: {
          setup: commerceEventsFixtures.desired.setup,
          providers: [],
          subscriptions: [],
        },
      };
      const desired = await setupResource().check(config);
      expect(desired).toHaveLength(1);
    });

    it("check() returns [] when commerceEvents is absent", async () => {
      const desired = await setupResource().check({});
      expect(desired).toEqual([]);
    });

    it("keyFromDesired returns instanceId", () => {
      const key = setupResource().keyFromDesired(
        commerceEventsFixtures.desired.setup,
      );
      expect(key).toBe("my-instance");
    });

    it("keyFromState always returns 'setup' sentinel", () => {
      const key = setupResource().keyFromState({ applied: true });
      expect(key).toBe("setup");
    });

    it("diff() always returns create (upsert semantics)", () => {
      const result = setupResource().diff(
        null,
        commerceEventsFixtures.desired.setup,
      );
      expect(result.kind).toBe("create");
    });

    it("diff() returns create even when current state exists", () => {
      const result = setupResource().diff(
        { applied: true },
        commerceEventsFixtures.desired.setup,
      );
      expect(result.kind).toBe("create");
    });

    it("create() calls updateEventingConfiguration and returns applied state", async () => {
      server.use(...commerceEventsHandlers.updateConfiguration);
      const state = await setupResource().create(
        commerceEventsFixtures.desired.setup,
        new Map(),
      );
      expect(state).toEqual({ applied: true });
    });

    it("delete() is a no-op", async () => {
      await expect(
        setupResource().delete("setup", { applied: true }),
      ).resolves.toBeUndefined();
    });
  });

  describe("provider resource", () => {
    it("check() returns providers from config", async () => {
      const config = {
        commerceEvents: {
          setup: commerceEventsFixtures.desired.setup,
          providers: [commerceEventsFixtures.desired.provider],
          subscriptions: [],
        },
      };
      const desired = await providerResource().check(config);
      expect(desired).toHaveLength(1);
    });

    it("check() returns [] when commerceEvents is absent", async () => {
      const desired = await providerResource().check({});
      expect(desired).toEqual([]);
    });

    it("keyFromDesired returns ioEventsProviderInstanceId", () => {
      const key = providerResource().keyFromDesired(
        commerceEventsFixtures.desired.provider,
      );
      expect(key).toBe("my-instance");
    });

    it("keyFromState returns instance_id when present", () => {
      const key = providerResource().keyFromState(
        commerceEventsFixtures.state.provider,
      );
      expect(key).toBe("my-instance");
    });

    it("keyFromState falls back to provider_id when instance_id is absent", () => {
      const key = providerResource().keyFromState({
        provider_id: "commerce-provider-id-789",
      });
      expect(key).toBe("commerce-provider-id-789");
    });

    it("diff() returns create when current is null", () => {
      const result = providerResource().diff(
        null,
        commerceEventsFixtures.desired.provider,
      );
      expect(result.kind).toBe("create");
    });

    it("diff() returns noop when current matches desired", () => {
      const result = providerResource().diff(
        commerceEventsFixtures.state.provider,
        commerceEventsFixtures.desired.provider,
      );
      expect(result.kind).toBe("noop");
    });

    it("diff() returns noop when current has undefined label/description matching desired undefined", () => {
      const result = providerResource().diff(
        { provider_id: "commerce-provider-id-789" },
        { ioEventsProviderInstanceId: "my-instance" },
      );
      expect(result.kind).toBe("noop");
    });

    it("diff() returns replace when label changes", () => {
      const result = providerResource().diff(
        { ...commerceEventsFixtures.state.provider, label: "Old Label" },
        commerceEventsFixtures.desired.provider,
      );
      expect(result.kind).toBe("replace");
    });

    it("diff() returns replace when description changes", () => {
      const result = providerResource().diff(
        { ...commerceEventsFixtures.state.provider, description: "Old desc" },
        commerceEventsFixtures.desired.provider,
      );
      expect(result.kind).toBe("replace");
    });

    it("list() returns all providers from the API", async () => {
      server.use(...commerceEventsHandlers.listProviders);
      const live = await providerResource().list();
      expect(live).toHaveLength(1);
      expect(live[0]).toMatchObject({
        provider_id: "commerce-provider-id-789",
      });
    });

    it("create() uses upstream io-events/provider output to get the API provider ID", async () => {
      server.use(...commerceEventsHandlers.createProvider);
      const upstream = new Map([
        [
          "io-events/provider",
          { "my-instance": { providerId: "io-api-provider-id" } },
        ],
      ]);
      const state = await providerResource().create(
        commerceEventsFixtures.desired.provider,
        upstream,
      );
      expect(state.provider_id).toBe("commerce-provider-id-789");
    });

    it("delete() calls deleteEventProvider with correct provider_id", async () => {
      server.use(...commerceEventsHandlers.deleteProvider);
      await expect(
        providerResource().delete(
          "my-instance",
          commerceEventsFixtures.state.provider,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe("subscription resource", () => {
    it("check() returns subscriptions from config", async () => {
      const config = {
        commerceEvents: {
          setup: commerceEventsFixtures.desired.setup,
          providers: [],
          subscriptions: [commerceEventsFixtures.desired.subscription],
        },
      };
      const desired = await subscriptionResource().check(config);
      expect(desired).toHaveLength(1);
    });

    it("check() returns [] when commerceEvents is absent", async () => {
      const desired = await subscriptionResource().check({});
      expect(desired).toEqual([]);
    });

    it("keyFromDesired returns eventCode", () => {
      const key = subscriptionResource().keyFromDesired(
        commerceEventsFixtures.desired.subscription,
      );
      expect(key).toBe("observer.catalog_product_save_after");
    });

    it("keyFromState returns name", () => {
      const state = {
        name: "observer.catalog_product_save_after",
        parent: "",
        provider_id: "default" as const,
        fields: [],
        rules: [],
        destination: "default" as const,
        priority: false,
        hipaa_audit_required: false,
      };
      const key = subscriptionResource().keyFromState(state);
      expect(key).toBe("observer.catalog_product_save_after");
    });

    it("diff() returns create when current is null", () => {
      const result = subscriptionResource().diff(
        null,
        commerceEventsFixtures.desired.subscription,
      );
      expect(result.kind).toBe("create");
    });

    it("diff() returns noop when current matches desired", () => {
      const current = {
        name: "observer.catalog_product_save_after",
        parent: "",
        provider_id: "default" as const,
        fields: [{ name: "entity_id" }],
        rules: [],
        destination: "default" as const,
        priority: false,
        hipaa_audit_required: false,
      };
      const result = subscriptionResource().diff(
        current,
        commerceEventsFixtures.desired.subscription,
      );
      expect(result.kind).toBe("noop");
    });

    it("diff() returns replace when fields change", () => {
      const current = {
        name: "observer.catalog_product_save_after",
        parent: "",
        provider_id: "default" as const,
        fields: [{ name: "old_field" }],
        rules: [],
        destination: "default" as const,
        priority: false,
        hipaa_audit_required: false,
      };
      const result = subscriptionResource().diff(
        current,
        commerceEventsFixtures.desired.subscription,
      );
      expect(result.kind).toBe("replace");
    });

    it("list() returns all subscriptions from the API", async () => {
      server.use(...commerceEventsHandlers.listSubscriptions);
      const live = await subscriptionResource().list();
      expect(live).toHaveLength(1);
      expect(live[0].name).toBe("observer.catalog_product_save_after");
    });

    it("create() calls createEventSubscription and reconstructs state from desired", async () => {
      server.use(...commerceEventsHandlers.createSubscription);
      const state = await subscriptionResource().create(
        commerceEventsFixtures.desired.subscription,
        new Map(),
      );
      expect(state.name).toBe("observer.catalog_product_save_after");
    });

    it("create() handles subscription with no fields", async () => {
      server.use(...commerceEventsHandlers.createSubscription);
      const state = await subscriptionResource().create(
        {
          eventCode: "observer.catalog_product_save_after",
          providerInstanceId: "my-instance",
        },
        new Map(),
      );
      expect(state.name).toBe("observer.catalog_product_save_after");
      expect(state.fields).toEqual([]);
    });

    it("delete() calls deleteEventSubscription with correct name", async () => {
      server.use(...commerceEventsHandlers.deleteSubscription);
      const current = {
        name: "observer.catalog_product_save_after",
        parent: "",
        provider_id: "default" as const,
        fields: [{ name: "entity_id" }],
        rules: [],
        destination: "default" as const,
        priority: false,
        hipaa_audit_required: false,
      };
      await expect(
        subscriptionResource().delete(
          "observer.catalog_product_save_after",
          current,
        ),
      ).resolves.toBeUndefined();
    });
  });
});
