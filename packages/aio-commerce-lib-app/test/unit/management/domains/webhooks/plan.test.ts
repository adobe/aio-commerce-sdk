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

import { getInstallCommerceEnv } from "#config/lib/environment";
import { planWebhookSubscriptions } from "#management/domains/webhooks/plan";
import { resolveDesiredWebhooks } from "#management/domains/webhooks/utils";
import { DEFAULT_INSTALLATION_PARAMS } from "#test/fixtures/installation";
import {
  createMockExistingCommerceWebhook,
  createMockRuntimeWebhookEntry,
  createMockUrlWebhookEntry,
  createMockWebhooksConfig,
  createMockWebhooksContext,
} from "#test/fixtures/webhooks";

import type { CommerceWebhook } from "@adobe/aio-commerce-lib-webhooks/api";
import type { WebhooksConfig } from "#config/schema/webhooks";
import type {
  WebhookDomainPlan,
  WebhookSnapshotData,
} from "#management/domains/webhooks/types";

const UPGRADE_PATH = ["upgrade", "webhooks", "subscriptions"];

/** Resolved identity of configWithWebhooks' default webhook entry. */
const DEFAULT_RESOLVED_IDENTITY = {
  batch_name: "test_app_webhooks_default",
  hook_name: "test_app_webhooks_order_created",
  webhook_method: "plugin.order.api.order_created",
  webhook_type: "after" as const,
};

/** Values Commerce fills in for optional fields a subscribe request leaves out. */
const COMMERCE_FILLED_DEFAULTS = {
  batch_order: 0,
  fallback_error_message: "Cannot perform the operation due to an error.",
  fields: [],
  headers: [],
  priority: 0,
  required: true,
  rules: [],
  soft_timeout: 0,
  timeout: 0,
  ttl: 0,
};

const EMPTY_SNAPSHOT: WebhookSnapshotData = { subscribedWebhooks: [] };

/** Builds the live webhook Commerce would list after subscribing the config's first webhook. */
function liveFrom(
  config: WebhooksConfig,
  overrides: Partial<CommerceWebhook> = {},
): CommerceWebhook {
  const [resolved] = resolveDesiredWebhooks(
    config,
    getInstallCommerceEnv(DEFAULT_INSTALLATION_PARAMS),
  );

  const { requiresAdobeAuth, ...webhook } = resolved;
  return {
    ...COMMERCE_FILLED_DEFAULTS,
    ...webhook,
    ...(requiresAdobeAuth && {
      developer_console_oauth: {
        client_id: "client-id",
        client_secret: "******",
        environment: "production",
        org_id: "org-id",
      },
    }),
    ...overrides,
  };
}

function plan({
  baseline = null,
  target = null,
  live = [],
  failedAttempt,
}: {
  baseline?: WebhooksConfig | null;
  target?: WebhooksConfig | null;
  live?: CommerceWebhook[];
  failedAttempt?: {
    targetConfig: WebhooksConfig | null;
    plan: WebhookDomainPlan | null;
  };
}) {
  const getWebhookList = vi.fn().mockResolvedValue(live);
  const subscribeWebhook = vi.fn();
  const unsubscribeWebhook = vi.fn();
  const context = createMockWebhooksContext(
    subscribeWebhook,
    getWebhookList,
    DEFAULT_INSTALLATION_PARAMS,
    unsubscribeWebhook,
  );

  const result = planWebhookSubscriptions(
    {
      baseline: baseline ? { config: baseline, data: EMPTY_SNAPSHOT } : null,
      failedAttempt,
      path: UPGRADE_PATH,
      targetConfig: target,
    },
    context,
  );

  return { result, subscribeWebhook, unsubscribeWebhook };
}

function configWith(
  webhook: Parameters<typeof createMockRuntimeWebhookEntry>[0],
) {
  return createMockWebhooksConfig({
    webhooks: [createMockRuntimeWebhookEntry(webhook)],
  });
}

describe("planWebhookSubscriptions", () => {
  beforeEach(() => {
    vi.stubEnv("__OW_NAMESPACE", "test-namespace");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("plans an add for a new webhook", async () => {
    const target = createMockWebhooksConfig();
    const result = await plan({ target }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([
      expect.objectContaining({
        after: expect.objectContaining(DEFAULT_RESOLVED_IDENTITY),
        kind: "add",
        reason: "change",
      }),
    ]);
  });

  test("plans nothing when live matches the target and holds Commerce's own values for unset fields", async () => {
    const config = createMockWebhooksConfig();
    const result = await plan({
      baseline: config,
      live: [liveFrom(config)],
      target: config,
    }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([]);
  });

  test("plans an add when a webhook both configs declare is missing live", async () => {
    const config = createMockWebhooksConfig();
    const result = await plan({ baseline: config, target: config }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([
      expect.objectContaining({ kind: "add", reason: "drift" }),
    ]);
  });

  test("labels an add as a change when the target also changes the missing webhook", async () => {
    const result = await plan({
      baseline: createMockWebhooksConfig(),
      target: configWith({ webhook: { timeout: 30 } }),
    }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([
      expect.objectContaining({ kind: "add", reason: "change" }),
    ]);
  });

  test("plans an update when live differs from a field the target sets", async () => {
    const config = configWith({ webhook: { fields: [{ name: "sku" }] } });
    const result = await plan({
      baseline: config,
      live: [liveFrom(config, { fields: [] })],
      target: config,
    }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([
      expect.objectContaining({
        before: expect.objectContaining({ fields: [] }),
        kind: "update",
        reason: "drift",
      }),
    ]);
  });

  test("keeps a live value no config set for a field the target leaves out, as Commerce's own", async () => {
    const config = createMockWebhooksConfig();
    const result = await plan({
      baseline: config,
      live: [liveFrom(config, { timeout: 30 })],
      target: config,
    }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([]);
  });

  test("plans an update when live keeps a value the failed attempt's target set", async () => {
    const config = createMockWebhooksConfig();
    const result = await plan({
      baseline: config,
      failedAttempt: {
        plan: null,
        targetConfig: configWith({ webhook: { timeout: 30 } }),
      },
      live: [liveFrom(config, { timeout: 30 })],
      target: config,
    }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([
      expect.objectContaining({ kind: "update", reason: "drift" }),
    ]);
  });

  test("plans an update from values a failed attempt's plan carried from earlier attempts", async () => {
    const config = createMockWebhooksConfig();
    const earlier = await plan({
      baseline: config,
      failedAttempt: {
        plan: null,
        targetConfig: configWith({ webhook: { timeout: 30 } }),
      },
      target: config,
    }).result;
    expect.assert(earlier.kind === "planned");

    const result = await plan({
      baseline: config,
      failedAttempt: { plan: earlier.plan, targetConfig: config },
      live: [liveFrom(config, { timeout: 30 })],
      target: config,
    }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([
      expect.objectContaining({ kind: "update" }),
    ]);
  });

  test("plans nothing once a failed attempt already reset the value", async () => {
    const config = createMockWebhooksConfig();
    const result = await plan({
      baseline: configWith({ webhook: { timeout: 30 } }),
      failedAttempt: { plan: null, targetConfig: config },
      live: [liveFrom(config, { timeout: 0 })],
      target: config,
    }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([]);
  });

  test("does not count an empty array a config set as a value to reset", async () => {
    const config = createMockWebhooksConfig();
    const result = await plan({
      baseline: configWith({ webhook: { rules: [] } }),
      live: [liveFrom(config)],
      target: config,
    }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([]);
  });

  test("plans an update when the target drops a field the baseline set", async () => {
    const baseline = configWith({ webhook: { timeout: 30 } });
    const target = configWith({});
    const result = await plan({
      baseline,
      live: [liveFrom(baseline)],
      target,
    }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([
      expect.objectContaining({ kind: "update", reason: "change" }),
    ]);
  });

  test("plans an update when live lacks the Adobe auth the target requires", async () => {
    const config = createMockWebhooksConfig();
    const { developer_console_oauth: _, ...withoutAuth } = liveFrom(config);
    const result = await plan({
      baseline: config,
      live: [withoutAuth],
      target: config,
    }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([
      expect.objectContaining({ kind: "update" }),
    ]);
  });

  test("never puts developer_console_oauth into a planned operation", async () => {
    const result = await plan({ target: createMockWebhooksConfig() }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations[0]).toMatchObject({
      after: { requiresAdobeAuth: true },
    });
    expect(result.plan.operations[0]).not.toHaveProperty(
      "after.developer_console_oauth",
    );
  });

  test("plans a remove for an owned leftover neither config declares", async () => {
    const config = createMockWebhooksConfig();
    const leftover = liveFrom(
      configWith({ webhook: { hook_name: "leftover" } }),
    );
    const result = await plan({
      baseline: config,
      live: [liveFrom(config), leftover],
      target: config,
    }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([
      expect.objectContaining({
        before: expect.objectContaining({
          hook_name: "test_app_webhooks_leftover",
        }),
        kind: "remove",
        reason: "drift",
      }),
    ]);
  });

  test("leaves live webhooks it cannot prove the app owns", async () => {
    const config = createMockWebhooksConfig();
    const result = await plan({
      baseline: config,
      live: [
        liveFrom(config),
        createMockExistingCommerceWebhook({
          batch_name: "other_app_batch",
          hook_name: "other_app_hook",
        }),
        createMockExistingCommerceWebhook({
          hook_name: "test_app_webhooks_explicit_url",
          url: "https://example.com/hook",
        }),
        liveFrom(configWith({ webhook: { hook_name: "other_namespace" } }), {
          url: "https://other-namespace.adobeioruntime.net/api/v1/web/a/b",
        }),
      ],
      target: config,
    }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([]);
  });

  test("plans a remove for a webhook the target drops, even with an explicit url", async () => {
    const baseline = createMockWebhooksConfig({
      webhooks: [
        createMockUrlWebhookEntry({ webhook: { hook_name: "explicit" } }),
      ],
    });
    const result = await plan({
      baseline,
      live: [liveFrom(baseline)],
      target: createMockWebhooksConfig({ webhooks: [] }),
    }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([
      expect.objectContaining({
        before: expect.objectContaining({
          hook_name: "test_app_webhooks_explicit",
        }),
        kind: "remove",
        reason: "change",
      }),
    ]);
  });

  test("plans a remove for every owned live webhook when the domain is no longer configured", async () => {
    const config = createMockWebhooksConfig();
    const result = await plan({
      baseline: config,
      live: [liveFrom(config)],
      target: null,
    }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([
      expect.objectContaining({
        before: expect.objectContaining(DEFAULT_RESOLVED_IDENTITY),
        kind: "remove",
      }),
    ]);
  });

  test("plans a remove when the target scopes a webhook to another environment", async () => {
    const baseline = createMockWebhooksConfig();
    const result = await plan({
      baseline,
      live: [liveFrom(baseline)],
      target: configWith({ env: ["paas"] }),
    }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([
      expect.objectContaining({ kind: "remove" }),
    ]);
  });

  test("plans an add when the target extends a webhook to this environment", async () => {
    const result = await plan({
      baseline: configWith({ env: ["paas"] }),
      target: createMockWebhooksConfig(),
    }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([
      expect.objectContaining({
        after: expect.objectContaining(DEFAULT_RESOLVED_IDENTITY),
        kind: "add",
      }),
    ]);
  });

  test("treats plugin.magento.X and plugin.X as the same identity", async () => {
    const target = configWith({
      webhook: {
        batch_name: "default",
        hook_name: "order_created",
        webhook_method: "plugin.magento.order.api.order_created",
      },
    });
    const result = await plan({
      baseline: target,
      live: [
        liveFrom(target, {
          webhook_method: DEFAULT_RESOLVED_IDENTITY.webhook_method,
        }),
      ],
      target,
    }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([]);
  });

  test("does not plan an update when a mutable array only differs in element order", async () => {
    const rules = [
      { field: "status", operator: "eq", value: "processing" },
      { field: "total", operator: "gt", value: "100" },
    ];
    const target = configWith({ webhook: { rules } });
    const result = await plan({
      baseline: target,
      live: [liveFrom(target, { rules: [rules[1], rules[0]] })],
      target,
    }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations).toEqual([]);
  });

  test("orders removes, then updates, then adds", async () => {
    const baseline = createMockWebhooksConfig();
    const target = createMockWebhooksConfig({
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
    const leftover = liveFrom(configWith({ webhook: { hook_name: "stale" } }));

    const result = await plan({
      baseline,
      live: [liveFrom(baseline), leftover],
      target,
    }).result;

    expect.assert(result.kind === "planned");
    expect(result.plan.operations.map((op) => op.kind)).toEqual([
      "remove",
      "update",
      "add",
    ]);
  });

  test("blocks planning when the live webhooks cannot be listed", async () => {
    const context = createMockWebhooksContext(
      vi.fn(),
      vi.fn().mockRejectedValue(new Error("Commerce unavailable")),
      DEFAULT_INSTALLATION_PARAMS,
    );

    const result = await planWebhookSubscriptions(
      {
        baseline: null,
        path: UPGRADE_PATH,
        targetConfig: createMockWebhooksConfig(),
      },
      context,
    );

    expect.assert(result.kind === "blocked");
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "WEBHOOK_LIVE_READ_FAILED",
        domain: "webhooks",
        message: expect.stringContaining("Commerce unavailable"),
      }),
    ]);
  });

  describe("conflict warnings", () => {
    /** Another app's webhook on the same hook point as the app's default webhook. */
    const FOREIGN_WEBHOOK = createMockExistingCommerceWebhook({
      batch_name: "other_app_batch",
      hook_name: "other_app_hook",
    });

    const CONFLICT_WARNING = {
      blocking: false,
      code: "WEBHOOK_CONFLICTS",
      details: {
        conflictedWebhooks: [
          expect.objectContaining({ batch_name: "other_app_batch" }),
        ],
      },
      domain: "webhooks",
      message: expect.any(String),
      severity: "warning",
    };

    test("warns when a modification webhook the plan adds conflicts with another app's webhook", async () => {
      const result = await plan({
        live: [FOREIGN_WEBHOOK],
        target: configWith({ category: "modification" }),
      }).result;

      expect.assert(result.kind === "planned");
      expect(result.issues).toEqual([CONFLICT_WARNING]);
    });

    test("warns when a modification webhook the plan updates conflicts with another app's webhook", async () => {
      const config = configWith({
        category: "modification",
        webhook: { fields: [{ name: "sku" }] },
      });
      const result = await plan({
        baseline: config,
        live: [liveFrom(config, { fields: [] }), FOREIGN_WEBHOOK],
        target: config,
      }).result;

      expect.assert(result.kind === "planned");
      expect(result.plan.operations).toEqual([
        expect.objectContaining({ kind: "update" }),
      ]);
      expect(result.issues).toEqual([CONFLICT_WARNING]);
    });

    test("does not warn about a webhook the plan leaves unchanged", async () => {
      const config = configWith({ category: "modification" });
      const result = await plan({
        baseline: config,
        live: [liveFrom(config), FOREIGN_WEBHOOK],
        target: config,
      }).result;

      expect.assert(result.kind === "planned");
      expect(result.issues).toEqual([]);
    });

    test("does not warn without a target config", async () => {
      const result = await plan({
        baseline: configWith({ category: "modification" }),
        live: [FOREIGN_WEBHOOK],
      }).result;

      expect.assert(result.kind === "planned");
      expect(result.issues).toEqual([]);
    });

    test("does not warn about webhooks that are not modification webhooks", async () => {
      const result = await plan({
        live: [FOREIGN_WEBHOOK],
        target: configWith({ category: "validation" }),
      }).result;

      expect.assert(result.kind === "planned");
      expect(result.issues).toEqual([]);
    });

    test("does not warn about the app's own webhook", async () => {
      const config = configWith({
        category: "modification",
        webhook: { fields: [{ name: "sku" }] },
      });
      const result = await plan({
        baseline: config,
        live: [liveFrom(config, { fields: [] })],
        target: config,
      }).result;

      expect.assert(result.kind === "planned");
      expect(result.issues).toEqual([]);
    });
  });

  test("never writes to Commerce", async () => {
    const config = createMockWebhooksConfig();
    const { result, subscribeWebhook, unsubscribeWebhook } = plan({
      baseline: config,
      live: [liveFrom(configWith({ webhook: { hook_name: "stale" } }))],
      target: configWith({ webhook: { fields: [{ name: "sku" }] } }),
    });
    await result;

    expect(subscribeWebhook).not.toHaveBeenCalled();
    expect(unsubscribeWebhook).not.toHaveBeenCalled();
  });
});
