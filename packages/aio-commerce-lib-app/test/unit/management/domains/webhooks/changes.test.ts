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

import { planWebhookChanges } from "#management/domains/webhooks/changes";
import { createMockMetadata } from "#test/fixtures/config";
import { createMockRuntimeWebhookEntry } from "#test/fixtures/webhooks";

import type { CommerceEnv } from "@adobe/aio-commerce-lib-core/commerce";
import type { WebhookEntry } from "#config/schema/webhooks";

function entry(
  hookName: string,
  overrides: { timeout?: number; env?: CommerceEnv[] } = {},
): WebhookEntry {
  const { env, ...webhook } = overrides;
  return createMockRuntimeWebhookEntry({
    ...(env && { env }),
    webhook: { batch_name: "batch", hook_name: hookName, ...webhook },
  });
}

function config(...webhooks: WebhookEntry[]) {
  return { metadata: createMockMetadata("my-app"), webhooks };
}

describe("planWebhookChanges", () => {
  beforeEach(() => {
    vi.stubEnv("__OW_NAMESPACE", "test-ns");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test.each([
    {
      baseline: null,
      expected: [["add", "one"]],
      name: "adds every webhook without a baseline",
      target: config(entry("one")),
    },
    {
      baseline: config(entry("one")),
      expected: [["remove", "one"]],
      name: "removes every webhook without a target",
      target: null,
    },
    {
      baseline: config(entry("one")),
      expected: [],
      name: "ignores an unchanged webhook",
      target: config(entry("one")),
    },
    {
      baseline: config(entry("one")),
      expected: [["update", "one"]],
      name: "updates a webhook whose config changed",
      target: config(entry("one", { timeout: 10 })),
    },
    {
      baseline: config(entry("one"), entry("two")),
      expected: [
        ["add", "three"],
        ["remove", "two"],
      ],
      name: "adds and removes by key",
      target: config(entry("one"), entry("three")),
    },
    {
      baseline: null,
      expected: [],
      name: "has no change without either config",
      target: null,
    },
  ])("$name", ({ baseline, target, expected }) => {
    const changes = planWebhookChanges(baseline, target, "paas");

    expect(
      changes.map(({ kind, key }) => [kind, key.split(":").at(-1)]),
    ).toEqual(expected.map(([kind, hook]) => [kind, `my_app_${hook}`]));
    for (const change of changes) {
      expect(change.itemRef.key).toBe(change.key);
    }
  });

  test("only counts the webhooks that apply to the environment", () => {
    const target = config(
      entry("paas", { env: ["paas"] }),
      entry("saas", { env: ["saas"] }),
      entry("all"),
    );

    expect(
      planWebhookChanges(null, target, "saas").map((c) =>
        c.key.split(":").at(-1),
      ),
    ).toEqual(["my_app_saas", "my_app_all"]);
  });

  test("carries the item reference of the target entry for an update", () => {
    const [change] = planWebhookChanges(
      config(entry("one")),
      config(entry("one", { timeout: 10 })),
      "paas",
    );

    expect(change?.itemRef.config).toEqual(entry("one", { timeout: 10 }));
  });
});
