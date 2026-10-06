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

import { describe, expect, test, vi } from "vitest";

import { validateWebhookSubscriptionsPlan } from "#management/domains/webhooks/validate";
import {
  createMockExistingCommerceWebhook,
  createMockRuntimeWebhookEntry,
  createMockWebhooksConfig,
  createMockWebhooksContext,
} from "#test/fixtures/webhooks";

import type { PlanningInput } from "#management/common/workflow/resource";
import type {
  WebhookDomainPlan,
  WebhookOperationValue,
  WebhookSnapshotData,
} from "#management/domains/webhooks/types";

const OWN_IDENTITY = {
  batch_name: "test_app_webhooks_default",
  hook_name: "test_app_webhooks_order_created",
  webhook_method: "plugin.order.api.order_created",
  webhook_type: "after",
};

/** Another app's webhook on the same hook point as the app's default webhook. */
const FOREIGN_WEBHOOK = createMockExistingCommerceWebhook({
  batch_name: "other_app_batch",
  hook_name: "other_app_hook",
});

function planWith(
  kind: "add" | "update" | "remove",
  value: WebhookOperationValue = OWN_IDENTITY,
): WebhookDomainPlan {
  const operations = {
    add: { after: value, kind: "add" as const },
    remove: { before: value, kind: "remove" as const },
    update: { after: value, before: value, kind: "update" as const },
  };
  const operation = operations[kind];

  return {
    operations: [
      { id: "op", label: "op", reason: "change" as const, ...operation },
    ],
    path: ["installation", "webhooks", "subscriptions"],
  };
}

function inputFor(category: "modification" | "validation") {
  return {
    baseline: null,
    path: ["installation", "webhooks", "subscriptions"],
    targetConfig: createMockWebhooksConfig({
      webhooks: [createMockRuntimeWebhookEntry({ category })],
    }),
  } as unknown as PlanningInput<
    ReturnType<typeof createMockWebhooksConfig>,
    WebhookSnapshotData
  >;
}

describe("validateWebhookSubscriptionsPlan", () => {
  test.each(["add", "update"] as const)(
    "warns when a modification webhook the plan %ss conflicts with another app's webhook",
    async (kind) => {
      const context = createMockWebhooksContext(
        undefined,
        vi.fn().mockResolvedValue([FOREIGN_WEBHOOK]),
      );

      const issues = await validateWebhookSubscriptionsPlan(
        planWith(kind),
        inputFor("modification"),
        context,
      );

      expect(issues).toEqual([
        expect.objectContaining({
          code: "WEBHOOK_CONFLICTS",
          details: {
            conflictedWebhooks: [
              expect.objectContaining({ batch_name: "other_app_batch" }),
            ],
          },
          severity: "warning",
        }),
      ]);
    },
  );

  test("ignores webhooks the plan removes and does not read Commerce", async () => {
    const getWebhookList = vi.fn().mockResolvedValue([FOREIGN_WEBHOOK]);
    const context = createMockWebhooksContext(undefined, getWebhookList);

    const issues = await validateWebhookSubscriptionsPlan(
      planWith("remove"),
      inputFor("modification"),
      context,
    );

    expect(issues).toEqual([]);
    expect(getWebhookList).not.toHaveBeenCalled();
  });

  test("ignores webhooks that are not modification webhooks", async () => {
    const context = createMockWebhooksContext(
      undefined,
      vi.fn().mockResolvedValue([FOREIGN_WEBHOOK]),
    );

    const issues = await validateWebhookSubscriptionsPlan(
      planWith("add"),
      inputFor("validation"),
      context,
    );

    expect(issues).toEqual([]);
  });

  test("does not warn about the app's own webhook", async () => {
    const context = createMockWebhooksContext(
      undefined,
      vi
        .fn()
        .mockResolvedValue([createMockExistingCommerceWebhook(OWN_IDENTITY)]),
    );

    const issues = await validateWebhookSubscriptionsPlan(
      planWith("add"),
      inputFor("modification"),
      context,
    );

    expect(issues).toEqual([]);
  });
});
