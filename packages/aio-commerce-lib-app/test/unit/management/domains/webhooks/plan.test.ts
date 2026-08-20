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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { planWebhookSubscriptions } from "#management/domains/webhooks/plan";
import { DEFAULT_INSTALLATION_PARAMS } from "#test/fixtures/installation";
import {
  createMockResolvedWebhook,
  createMockRuntimeWebhookEntry,
  createMockWebhooksConfig,
  createMockWebhooksContext,
} from "#test/fixtures/webhooks";

import type { WebhooksExecutionContext } from "#management/domains/webhooks/context";

const DEFAULT_PARAMS = DEFAULT_INSTALLATION_PARAMS;

function makeContext(
  subscribeWebhookFn = vi.fn().mockResolvedValue(null),
  getWebhookListFn = vi.fn().mockResolvedValue([]),
  params: Partial<WebhooksExecutionContext["params"]> = DEFAULT_PARAMS,
  unsubscribeWebhookFn = vi.fn().mockResolvedValue(null),
): WebhooksExecutionContext {
  return createMockWebhooksContext(
    subscribeWebhookFn,
    getWebhookListFn,
    params,
    unsubscribeWebhookFn,
  );
}

function createDefaultWebhooksConfig() {
  return createMockWebhooksConfig();
}

const UPGRADE_PATH = ["upgrade", "webhooks", "subscriptions"];

/** Resolved identity of configWithWebhooks' default webhook entry. */
const DEFAULT_RESOLVED_IDENTITY = {
  batch_name: "test_app_webhooks_default",
  hook_name: "test_app_webhooks_order_created",
  webhook_method: "plugin.order.api.order_created",
  webhook_type: "after" as const,
};

/** Resolved URL of configWithWebhooks' default (runtimeAction-based) entry, given the stubbed namespace. */
const DEFAULT_RESOLVED_URL =
  "https://test-namespace.adobeioruntime.net/api/v1/web/my-package/handle-webhook";

describe("planWebhookSubscriptions", () => {
  beforeEach(() => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("plans an add for every desired webhook when there is no baseline", async () => {
    const result = await planWebhookSubscriptions(
      {
        baseline: null,
        path: UPGRADE_PATH,
        targetConfig: createDefaultWebhooksConfig(),
      },
      makeContext(),
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toHaveLength(1);
    expect(result.plan.operations[0]).toMatchObject({
      after: expect.objectContaining(DEFAULT_RESOLVED_IDENTITY),
      kind: "add",
    });
  });

  test("blocks planning instead of guessing when a baseline's data didn't resolve", async () => {
    const result = await planWebhookSubscriptions(
      {
        // @ts-expect-error - baseline.data should never be null per the type, but a
        // malformed caller (e.g. a stale-path lookup) can still pass this at runtime;
        // this must not throw, nor silently drop previously owned webhooks.
        baseline: { config: createDefaultWebhooksConfig(), data: null },
        path: UPGRADE_PATH,
        targetConfig: createDefaultWebhooksConfig(),
      },
      makeContext(),
    );

    expect.assert(result.kind === "blocked");
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "WEBHOOK_BASELINE_UNRESOLVED",
        domain: "webhooks",
      }),
    ]);
  });

  test("plans normally when a resolved baseline previously owned no webhooks", async () => {
    const result = await planWebhookSubscriptions(
      {
        baseline: {
          config: createDefaultWebhooksConfig(),
          data: { subscribedWebhooks: [] },
        },
        path: UPGRADE_PATH,
        targetConfig: createDefaultWebhooksConfig(),
      },
      makeContext(),
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toHaveLength(1);
    expect(result.plan.operations[0]).toMatchObject({ kind: "add" });
  });

  test("never resolves developer_console_oauth into a planned add", async () => {
    const result = await planWebhookSubscriptions(
      {
        baseline: null,
        path: UPGRADE_PATH,
        targetConfig: createDefaultWebhooksConfig(),
      },
      makeContext(),
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations[0]).toMatchObject({
      after: { requiresAdobeAuth: true },
    });
    expect(result.plan.operations[0]).not.toHaveProperty(
      "after.developer_console_oauth",
    );
  });

  test("plans a remove for every baseline webhook when the domain is no longer configured", async () => {
    const baselineWebhook = createMockResolvedWebhook(
      DEFAULT_RESOLVED_IDENTITY,
    );

    const result = await planWebhookSubscriptions(
      {
        baseline: {
          config: createDefaultWebhooksConfig(),
          data: { subscribedWebhooks: [baselineWebhook] },
        },
        path: UPGRADE_PATH,
        targetConfig: null,
      },
      makeContext(),
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([
      expect.objectContaining({
        before: expect.objectContaining(DEFAULT_RESOLVED_IDENTITY),
        kind: "remove",
      }),
    ]);
  });

  test("retains desired webhooks already present in the baseline and proposes no operations", async () => {
    const config = createDefaultWebhooksConfig();
    const baselineWebhook = createMockResolvedWebhook({
      ...DEFAULT_RESOLVED_IDENTITY,
      url: DEFAULT_RESOLVED_URL,
    });

    const result = await planWebhookSubscriptions(
      {
        baseline: { config, data: { subscribedWebhooks: [baselineWebhook] } },
        path: UPGRADE_PATH,
        targetConfig: config,
      },
      makeContext(),
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toHaveLength(0);
  });

  test("plans an add and a remove when the target and baseline differ", async () => {
    const targetConfig = createMockWebhooksConfig({
      webhooks: [
        createMockRuntimeWebhookEntry({
          webhook: {
            batch_name: "products",
            hook_name: "validate",
            webhook_method: "observer.catalog_product_save_after",
          },
        }),
      ],
    });
    const baselineWebhook = createMockResolvedWebhook(
      DEFAULT_RESOLVED_IDENTITY,
    );

    const result = await planWebhookSubscriptions(
      {
        baseline: {
          config: createDefaultWebhooksConfig(),
          data: { subscribedWebhooks: [baselineWebhook] },
        },
        path: UPGRADE_PATH,
        targetConfig,
      },
      makeContext(),
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toHaveLength(2);
    expect(result.plan.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "add" }),
        expect.objectContaining({
          before: expect.objectContaining(DEFAULT_RESOLVED_IDENTITY),
          kind: "remove",
        }),
      ]),
    );
  });

  test("orders the remove before the add when a webhook is renamed (same method/type, different batch/hook)", async () => {
    const targetConfig = createMockWebhooksConfig({
      webhooks: [
        createMockRuntimeWebhookEntry({
          webhook: {
            batch_name: "default",
            hook_name: "order_created_v2",
            webhook_method: DEFAULT_RESOLVED_IDENTITY.webhook_method,
            webhook_type: DEFAULT_RESOLVED_IDENTITY.webhook_type,
          },
        }),
      ],
    });
    const baselineWebhook = createMockResolvedWebhook(
      DEFAULT_RESOLVED_IDENTITY,
    );

    const result = await planWebhookSubscriptions(
      {
        baseline: {
          config: createDefaultWebhooksConfig(),
          data: { subscribedWebhooks: [baselineWebhook] },
        },
        path: UPGRADE_PATH,
        targetConfig,
      },
      makeContext(),
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toHaveLength(2);
    expect(result.plan.operations[0]).toMatchObject({ kind: "remove" });
    expect(result.plan.operations[1]).toMatchObject({ kind: "add" });
  });

  test("treats plugin.magento.X and plugin.X as the same identity when diffing", async () => {
    const targetConfig = createMockWebhooksConfig({
      webhooks: [
        createMockRuntimeWebhookEntry({
          webhook: {
            batch_name: "default",
            hook_name: "order_created",
            webhook_method: "plugin.magento.order.api.order_created",
          },
        }),
      ],
    });
    const baselineWebhook = createMockResolvedWebhook({
      ...DEFAULT_RESOLVED_IDENTITY,
      url: DEFAULT_RESOLVED_URL,
    });

    const result = await planWebhookSubscriptions(
      {
        baseline: {
          config: createDefaultWebhooksConfig(),
          data: { subscribedWebhooks: [baselineWebhook] },
        },
        path: UPGRADE_PATH,
        targetConfig,
      },
      makeContext(),
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toHaveLength(0);
  });

  test("excludes webhooks scoped to a different environment from the desired set", async () => {
    const targetConfig = createMockWebhooksConfig({
      webhooks: [
        createMockRuntimeWebhookEntry({
          env: ["paas"],
          label: "PaaS only",
          webhook: { hook_name: "paas_only" },
        }),
      ],
    });
    const context = makeContext(vi.fn(), vi.fn().mockResolvedValue([]), {
      ...DEFAULT_PARAMS,
      AIO_COMMERCE_API_FLAVOR: "saas",
    });

    const result = await planWebhookSubscriptions(
      {
        baseline: null,
        path: UPGRADE_PATH,
        targetConfig,
      },
      context,
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toHaveLength(0);
  });

  test("never reads or writes external resources", async () => {
    const subscribeWebhook = vi.fn();
    const getWebhookList = vi.fn();
    const unsubscribeWebhook = vi.fn();
    const context = makeContext(
      subscribeWebhook,
      getWebhookList,
      DEFAULT_PARAMS,
      unsubscribeWebhook,
    );

    await planWebhookSubscriptions(
      {
        baseline: null,
        path: UPGRADE_PATH,
        targetConfig: createDefaultWebhooksConfig(),
      },
      context,
    );

    expect(getWebhookList).not.toHaveBeenCalled();
    expect(subscribeWebhook).not.toHaveBeenCalled();
    expect(unsubscribeWebhook).not.toHaveBeenCalled();
  });

  test("plans an update when a matched webhook's config differs from the target", async () => {
    const targetConfig = createMockWebhooksConfig({
      webhooks: [
        createMockRuntimeWebhookEntry({
          webhook: { fields: [{ name: "sku" }] },
        }),
      ],
    });
    const baselineWebhook = createMockResolvedWebhook({
      ...DEFAULT_RESOLVED_IDENTITY,
      url: DEFAULT_RESOLVED_URL,
    });

    const result = await planWebhookSubscriptions(
      {
        baseline: {
          config: createDefaultWebhooksConfig(),
          data: { subscribedWebhooks: [baselineWebhook] },
        },
        path: UPGRADE_PATH,
        targetConfig,
      },
      makeContext(),
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toHaveLength(1);
    expect(result.plan.operations[0]).toMatchObject({
      after: expect.objectContaining({ fields: [{ name: "sku" }] }),
      before: expect.objectContaining(DEFAULT_RESOLVED_IDENTITY),
      kind: "update",
    });
  });

  test("does not plan an update when a mutable array is only equivalently empty (undefined vs. [])", async () => {
    const targetConfig = createMockWebhooksConfig({
      webhooks: [createMockRuntimeWebhookEntry({ webhook: { fields: [] } })],
    });
    const baselineWebhook = createMockResolvedWebhook({
      ...DEFAULT_RESOLVED_IDENTITY,
      url: DEFAULT_RESOLVED_URL,
    });

    const result = await planWebhookSubscriptions(
      {
        baseline: {
          config: createDefaultWebhooksConfig(),
          data: { subscribedWebhooks: [baselineWebhook] },
        },
        path: UPGRADE_PATH,
        targetConfig,
      },
      makeContext(),
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toHaveLength(0);
  });

  test("does not plan an update when a mutable array only differs in element order", async () => {
    const rules = [
      { field: "status", operator: "eq", value: "processing" },
      { field: "total", operator: "gt", value: "100" },
    ];
    const targetConfig = createMockWebhooksConfig({
      webhooks: [
        createMockRuntimeWebhookEntry({
          webhook: { rules: [rules[1], rules[0]] },
        }),
      ],
    });
    const baselineWebhook = createMockResolvedWebhook({
      ...DEFAULT_RESOLVED_IDENTITY,
      rules: [rules[0], rules[1]],
      url: DEFAULT_RESOLVED_URL,
    });

    const result = await planWebhookSubscriptions(
      {
        baseline: {
          config: createDefaultWebhooksConfig(),
          data: { subscribedWebhooks: [baselineWebhook] },
        },
        path: UPGRADE_PATH,
        targetConfig,
      },
      makeContext(),
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toHaveLength(0);
  });

  test("orders update operations between removes and adds", async () => {
    const updatedBaselineWebhook = createMockResolvedWebhook({
      ...DEFAULT_RESOLVED_IDENTITY,
      url: DEFAULT_RESOLVED_URL,
    });
    const staleBaselineWebhook = createMockResolvedWebhook({
      batch_name: "test_app_webhooks_stale",
      hook_name: "test_app_webhooks_stale",
      webhook_method: "observer.catalog_product_save_before",
      webhook_type: "before",
    });

    const targetConfig = createMockWebhooksConfig({
      webhooks: [
        createMockRuntimeWebhookEntry({
          webhook: { fields: [{ name: "sku" }] },
        }),
        createMockRuntimeWebhookEntry({
          webhook: {
            batch_name: "new",
            hook_name: "new_hook",
            webhook_method: "observer.catalog_product_save_after",
          },
        }),
      ],
    });

    const result = await planWebhookSubscriptions(
      {
        baseline: {
          config: createDefaultWebhooksConfig(),
          data: {
            subscribedWebhooks: [updatedBaselineWebhook, staleBaselineWebhook],
          },
        },
        path: UPGRADE_PATH,
        targetConfig,
      },
      makeContext(),
    );

    expect.assert(result.kind === "planned");
    expect(result.plan.operations.map((op) => op.kind)).toEqual([
      "remove",
      "update",
      "add",
    ]);
  });
});
