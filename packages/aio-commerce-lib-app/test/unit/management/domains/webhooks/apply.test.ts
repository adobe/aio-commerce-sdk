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

import { applyWebhookSubscriptions } from "#management/domains/webhooks/apply";
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

const UPGRADE_PATH = ["upgrade", "webhooks", "subscriptions"];

/** Resolved identity of configWithWebhooks' default webhook entry. */
const DEFAULT_RESOLVED_IDENTITY = {
  batch_name: "test_app_webhooks_default",
  hook_name: "test_app_webhooks_order_created",
  webhook_method: "plugin.order.api.order_created",
  webhook_type: "after" as const,
};
describe("applyWebhookSubscriptions", () => {
  beforeEach(() => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function makeApplyContext(
    subscribeWebhookFn = vi.fn().mockResolvedValue(null),
    getWebhookListFn = vi.fn().mockResolvedValue([]),
    unsubscribeWebhookFn = vi.fn().mockResolvedValue(null),
  ) {
    return {
      ...makeContext(
        subscribeWebhookFn,
        getWebhookListFn,
        DEFAULT_PARAMS,
        unsubscribeWebhookFn,
      ),
      attemptId: "attempt-1",
      baseline: null,
      targetConfig: createMockWebhooksConfig(),
    };
  }

  function withBaseline(
    context: ReturnType<typeof makeApplyContext>,
    subscribedWebhooks: ReturnType<typeof createMockResolvedWebhook>[],
  ) {
    return {
      ...context,
      baseline: {
        config: createMockWebhooksConfig(),
        data: { subscribedWebhooks },
      },
    };
  }

  const addWebhook = createMockResolvedWebhook({
    batch_name: "test_app_webhooks_products",
    hook_name: "test_app_webhooks_validate",
    webhook_method: "observer.catalog_product_save_after",
    webhook_type: "after",
  });

  const retainedWebhook = createMockResolvedWebhook(DEFAULT_RESOLVED_IDENTITY);

  test("subscribes a planned add that is not yet live", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const context = makeApplyContext(subscribeWebhook);

    const plan = {
      operations: [
        {
          after: addWebhook,
          id: "op-1",
          kind: "add" as const,
          label: "Subscribe",
        },
      ],
      path: UPGRADE_PATH,
    };

    const result = await applyWebhookSubscriptions(plan, context);

    expect(subscribeWebhook).toHaveBeenCalledWith(addWebhook);
    expect(result.snapshotData?.subscribedWebhooks).toEqual([addWebhook]);
  });

  test("preserves baseline webhooks in the resulting snapshot", async () => {
    const context = withBaseline(makeApplyContext(), [retainedWebhook]);
    const result = await applyWebhookSubscriptions(
      { operations: [], path: UPGRADE_PATH },
      context,
    );

    expect(result.snapshotData?.subscribedWebhooks).toEqual([retainedWebhook]);
  });

  test("prunes live app-owned webhooks absent from the target", async () => {
    const targetConfig = createMockWebhooksConfig();
    const baseline = {
      config: targetConfig,
      data: { subscribedWebhooks: [retainedWebhook] },
    };

    const staleAppWebhook = createMockResolvedWebhook({
      batch_name: "test_app_webhooks_stale",
      hook_name: "test_app_webhooks_stale",
    });

    const foreignWebhook = createMockResolvedWebhook({
      batch_name: "other_app_default",
      hook_name: "other_app_stale",
    });

    const getWebhookList = vi
      .fn()
      .mockResolvedValue([retainedWebhook, staleAppWebhook, foreignWebhook]);

    const unsubscribeWebhook = vi.fn().mockResolvedValue(null);
    const context = {
      ...makeContext(
        vi.fn(),
        getWebhookList,
        DEFAULT_PARAMS,
        unsubscribeWebhook,
      ),
      attemptId: "attempt-1",
      baseline,
      targetConfig,
    };

    const result = await applyWebhookSubscriptions(
      { operations: [], path: UPGRADE_PATH },
      context,
    );

    expect(unsubscribeWebhook).toHaveBeenCalledOnce();
    expect(unsubscribeWebhook).toHaveBeenCalledWith(
      expect.objectContaining({
        batch_name: staleAppWebhook.batch_name,
        hook_name: staleAppWebhook.hook_name,
      }),
    );

    expect(result.snapshotData?.subscribedWebhooks).toEqual([retainedWebhook]);
  });

  test("attaches credentials to the subscribe call but keeps the snapshot secret-free", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const context = makeApplyContext(subscribeWebhook);

    const plan = {
      operations: [
        {
          after: { ...addWebhook, requiresAdobeAuth: true },
          id: "op-1",
          kind: "add" as const,
          label: "Subscribe",
        },
      ],
      path: UPGRADE_PATH,
    };

    const result = await applyWebhookSubscriptions(plan, context);

    expect(subscribeWebhook).toHaveBeenCalledWith(
      expect.objectContaining({ developer_console_oauth: expect.any(Object) }),
    );
    expect(result.snapshotData?.subscribedWebhooks).toEqual([addWebhook]);
    expect(result.snapshotData?.subscribedWebhooks[0]).not.toHaveProperty(
      "developer_console_oauth",
    );
  });

  test("skips subscribing an add that is already live", async () => {
    const subscribeWebhook = vi.fn();
    const getWebhookList = vi.fn().mockResolvedValue([addWebhook]);
    const context = {
      ...makeApplyContext(subscribeWebhook, getWebhookList),
      targetConfig: createMockWebhooksConfig({
        webhooks: [
          createMockRuntimeWebhookEntry({
            webhook: {
              batch_name: "products",
              hook_name: "validate",
              webhook_method: addWebhook.webhook_method,
              webhook_type: "after",
            },
          }),
        ],
      }),
    };

    const plan = {
      operations: [
        {
          after: addWebhook,
          id: "op-1",
          kind: "add" as const,
          label: "Subscribe",
        },
      ],
      path: UPGRADE_PATH,
    };

    const result = await applyWebhookSubscriptions(plan, context);

    expect(subscribeWebhook).not.toHaveBeenCalled();
    expect(result.snapshotData?.subscribedWebhooks).toEqual([addWebhook]);
  });

  test("unsubscribes a planned remove that is live", async () => {
    const unsubscribeWebhook = vi.fn().mockResolvedValue(null);
    const getWebhookList = vi.fn().mockResolvedValue([retainedWebhook]);
    const context = withBaseline(
      makeApplyContext(vi.fn(), getWebhookList, unsubscribeWebhook),
      [retainedWebhook],
    );

    const plan = {
      operations: [
        {
          before: retainedWebhook,
          id: "op-1",
          kind: "remove" as const,
          label: "Unsubscribe",
        },
      ],
      path: UPGRADE_PATH,
    };

    const result = await applyWebhookSubscriptions(plan, context);

    expect(unsubscribeWebhook).toHaveBeenCalledWith(
      expect.objectContaining({ batch_name: retainedWebhook.batch_name }),
    );
    expect(result.snapshotData?.subscribedWebhooks).toEqual([]);
  });

  test("skips unsubscribing a remove that is already absent", async () => {
    const unsubscribeWebhook = vi.fn();
    const context = makeApplyContext(
      vi.fn(),
      vi.fn().mockResolvedValue([]),
      unsubscribeWebhook,
    );

    const plan = {
      operations: [
        {
          before: retainedWebhook,
          id: "op-1",
          kind: "remove" as const,
          label: "Unsubscribe",
        },
      ],
      path: UPGRADE_PATH,
    };

    await applyWebhookSubscriptions(plan, context);

    expect(unsubscribeWebhook).not.toHaveBeenCalled();
  });

  test("aborts on the first add failure without processing remaining operations", async () => {
    const subscribeWebhook = vi
      .fn()
      .mockRejectedValue(new Error("Commerce API error"));
    const context = makeApplyContext(subscribeWebhook);

    const secondAdd = createMockResolvedWebhook({
      batch_name: "test_app_webhooks_second",
      hook_name: "test_app_webhooks_second",
      webhook_method: "observer.catalog_product_save_before",
      webhook_type: "before",
    });

    const plan = {
      operations: [
        {
          after: addWebhook,
          id: "op-1",
          kind: "add" as const,
          label: "Subscribe",
        },
        {
          after: secondAdd,
          id: "op-2",
          kind: "add" as const,
          label: "Subscribe",
        },
      ],
      path: UPGRADE_PATH,
    };

    await expect(applyWebhookSubscriptions(plan, context)).rejects.toThrow();
    expect(subscribeWebhook).toHaveBeenCalledTimes(1);
  });

  test("aborts on the first remove failure without processing remaining operations", async () => {
    const unsubscribeWebhook = vi
      .fn()
      .mockRejectedValue(new Error("Commerce API error"));
    const getWebhookList = vi
      .fn()
      .mockResolvedValue([retainedWebhook, addWebhook]);
    const context = makeApplyContext(
      vi.fn(),
      getWebhookList,
      unsubscribeWebhook,
    );

    const plan = {
      operations: [
        {
          before: retainedWebhook,
          id: "op-1",
          kind: "remove" as const,
          label: "Unsubscribe",
        },
        {
          before: addWebhook,
          id: "op-2",
          kind: "remove" as const,
          label: "Unsubscribe",
        },
      ],
      path: UPGRADE_PATH,
    };

    await expect(applyWebhookSubscriptions(plan, context)).rejects.toThrow();
    expect(unsubscribeWebhook).toHaveBeenCalledTimes(1);
  });

  test("unsubscribes the old identity before subscribing the new one for a renamed webhook", async () => {
    const callOrder: string[] = [];
    const subscribeWebhook = vi.fn().mockImplementation(async () => {
      callOrder.push("subscribe");
    });
    const unsubscribeWebhook = vi.fn().mockImplementation(async () => {
      callOrder.push("unsubscribe");
    });
    const getWebhookList = vi.fn().mockResolvedValue([retainedWebhook]);
    const context = withBaseline(
      makeApplyContext(subscribeWebhook, getWebhookList, unsubscribeWebhook),
      [retainedWebhook],
    );

    const renamedWebhook = createMockResolvedWebhook({
      ...DEFAULT_RESOLVED_IDENTITY,
      hook_name: "test_app_webhooks_order_created_v2",
    });

    const plan = {
      operations: [
        {
          before: retainedWebhook,
          id: "op-1",
          kind: "remove" as const,
          label: "Unsubscribe",
        },
        {
          after: renamedWebhook,
          id: "op-2",
          kind: "add" as const,
          label: "Subscribe",
        },
      ],
      path: UPGRADE_PATH,
    };

    await applyWebhookSubscriptions(plan, context);

    expect(callOrder).toEqual(["unsubscribe", "subscribe"]);
  });

  const updatedWebhook = createMockResolvedWebhook({
    ...DEFAULT_RESOLVED_IDENTITY,
    fields: [{ name: "sku" }],
  });

  test("applies an update by unsubscribing the live identity then subscribing the new payload", async () => {
    const callOrder: string[] = [];
    const subscribeWebhook = vi.fn().mockImplementation(async () => {
      callOrder.push("subscribe");
    });
    const unsubscribeWebhook = vi.fn().mockImplementation(async () => {
      callOrder.push("unsubscribe");
    });
    const getWebhookList = vi.fn().mockResolvedValue([retainedWebhook]);
    const context = makeApplyContext(
      subscribeWebhook,
      getWebhookList,
      unsubscribeWebhook,
    );

    const plan = {
      operations: [
        {
          after: updatedWebhook,
          before: retainedWebhook,
          id: "op-1",
          kind: "update" as const,
          label: "Update",
        },
      ],
      path: UPGRADE_PATH,
    };

    const result = await applyWebhookSubscriptions(plan, context);

    expect(callOrder).toEqual(["unsubscribe", "subscribe"]);
    expect(unsubscribeWebhook).toHaveBeenCalledWith(
      expect.objectContaining({ batch_name: retainedWebhook.batch_name }),
    );
    expect(subscribeWebhook).toHaveBeenCalledWith(updatedWebhook);
    expect(result.snapshotData?.subscribedWebhooks).toEqual([updatedWebhook]);
  });

  test("applies an update by subscribing directly when the identity isn't currently live", async () => {
    const subscribeWebhook = vi.fn().mockResolvedValue(null);
    const unsubscribeWebhook = vi.fn();
    const getWebhookList = vi.fn().mockResolvedValue([]);
    const context = withBaseline(
      makeApplyContext(subscribeWebhook, getWebhookList, unsubscribeWebhook),
      [retainedWebhook],
    );

    const plan = {
      operations: [
        {
          after: updatedWebhook,
          before: retainedWebhook,
          id: "op-1",
          kind: "update" as const,
          label: "Update",
        },
      ],
      path: UPGRADE_PATH,
    };

    await applyWebhookSubscriptions(plan, context);

    expect(unsubscribeWebhook).not.toHaveBeenCalled();
    expect(subscribeWebhook).toHaveBeenCalledWith(updatedWebhook);
  });

  test("aborts on the first update failure without processing remaining operations", async () => {
    const unsubscribeWebhook = vi
      .fn()
      .mockRejectedValue(new Error("Commerce API error"));
    const subscribeWebhook = vi.fn();
    const getWebhookList = vi.fn().mockResolvedValue([retainedWebhook]);
    const context = withBaseline(
      makeApplyContext(subscribeWebhook, getWebhookList, unsubscribeWebhook),
      [retainedWebhook],
    );

    const secondUpdate = createMockResolvedWebhook({
      batch_name: "test_app_webhooks_second",
      hook_name: "test_app_webhooks_second",
      webhook_method: "observer.catalog_product_save_before",
      webhook_type: "before",
    });

    const plan = {
      operations: [
        {
          after: updatedWebhook,
          before: retainedWebhook,
          id: "op-1",
          kind: "update" as const,
          label: "Update",
        },
        {
          after: secondUpdate,
          before: secondUpdate,
          id: "op-2",
          kind: "update" as const,
          label: "Update",
        },
      ],
      path: UPGRADE_PATH,
    };

    await expect(applyWebhookSubscriptions(plan, context)).rejects.toThrow();
    expect(subscribeWebhook).not.toHaveBeenCalled();
    expect(unsubscribeWebhook).toHaveBeenCalledTimes(1);
  });
});
