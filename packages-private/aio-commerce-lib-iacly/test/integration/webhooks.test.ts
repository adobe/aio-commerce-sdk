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

import { AdobeCommerceHttpClient } from "@adobe/aio-commerce-lib-api";
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

import { WebhooksProvider } from "../../source/webhooks/provider";
import { webhookFixtures, webhookHandlers } from "../fixtures/webhooks";

import type { LibIaclyConfig } from "../../source/index";

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Use an ImsAuthProvider directly to avoid network calls to IMS during tests.
// For SaaS, AdobeCommerceHttpClient appends /V1 to baseUrl, so baseUrl must not include it.
const client = new AdobeCommerceHttpClient({
  config: { baseUrl: "https://commerce.test/", flavor: "saas" },
  auth: {
    getAccessToken: async () => "test-token",
    getHeaders: async () => ({ Authorization: "Bearer test-token" }),
  },
});

describe("WebhooksProvider", () => {
  let provider: WebhooksProvider;

  beforeEach(() => {
    provider = new WebhooksProvider(client);
  });

  describe("resource metadata", () => {
    it("has correct kind and no dependencies", () => {
      const [resource] = provider.resources;
      expect(resource.kind).toBe("webhooks/webhook");
      expect(resource.dependsOn).toEqual([]);
    });
  });

  describe("check()", () => {
    it("returns the webhooks array from config", async () => {
      const config: LibIaclyConfig = {
        webhooks: [webhookFixtures.desired.one],
      };
      const [resource] = provider.resources;
      const desired = await resource.check(config);
      expect(desired).toHaveLength(1);
      expect(desired[0]).toEqual(webhookFixtures.desired.one);
    });

    it("returns [] when config.webhooks is absent", async () => {
      const [resource] = provider.resources;
      const desired = await resource.check({});
      expect(desired).toEqual([]);
    });
  });

  describe("keyFromDesired / keyFromState", () => {
    it("produces the same composite key", () => {
      const [resource] = provider.resources;
      const desired = webhookFixtures.desired.one;
      const state = webhookFixtures.state.one;
      expect(resource.keyFromDesired(desired)).toBe(
        "observer:myapp:order_place",
      );
      expect(resource.keyFromState(state)).toBe("observer:myapp:order_place");
    });
  });

  describe("diff()", () => {
    it("returns create when current is null", () => {
      const [resource] = provider.resources;
      const result = resource.diff(null, webhookFixtures.desired.one);
      expect(result).toEqual({
        kind: "create",
        desired: webhookFixtures.desired.one,
      });
    });

    it("returns noop when current matches desired", () => {
      const [resource] = provider.resources;
      const result = resource.diff(
        webhookFixtures.state.one,
        webhookFixtures.desired.one,
      );
      expect(result.kind).toBe("noop");
    });

    it("returns replace when url differs", () => {
      const [resource] = provider.resources;
      const changed = {
        ...webhookFixtures.desired.one,
        url: "https://new.example.com/hook",
      };
      const result = resource.diff(webhookFixtures.state.one, changed);
      expect(result.kind).toBe("replace");
    });
  });

  describe("list()", () => {
    it("returns all subscribed webhooks from the API", async () => {
      server.use(...webhookHandlers.listOne);
      const [resource] = provider.resources;
      const live = await resource.list?.();
      expect(live).toHaveLength(1);
      expect(live[0]).toMatchObject({
        webhook_method: "observer",
        hook_name: "order_place",
      });
    });
  });

  describe("create()", () => {
    it("calls subscribeWebhook and returns the desired config as state", async () => {
      server.use(...webhookHandlers.subscribe);
      const [resource] = provider.resources;
      const state = await resource.create(
        webhookFixtures.desired.one,
        new Map(),
      );
      expect(state).toMatchObject({
        webhook_method: "observer",
        batch_name: "myapp",
        hook_name: "order_place",
      });
    });
  });

  describe("delete()", () => {
    it("calls unsubscribeWebhook with the correct identifiers", async () => {
      server.use(...webhookHandlers.unsubscribe);
      const [resource] = provider.resources;
      await expect(
        resource.delete(
          "observer:myapp:order_place",
          webhookFixtures.state.one,
        ),
      ).resolves.toBeUndefined();
    });
  });
});
