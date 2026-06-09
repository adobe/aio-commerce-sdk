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
  appliesToEnv,
  filterAppConfigByEnv,
  getInstallCommerceEnv,
} from "#config/env-filter";

import type { CommerceAppConfigOutputModel } from "#config/schema/app";

describe("appliesToEnv", () => {
  test("keeps an item without env on any environment", () => {
    expect(appliesToEnv({}, "paas")).toBe(true);
    expect(appliesToEnv({}, "saas")).toBe(true);
  });

  test("keeps an item whose env includes the target", () => {
    expect(appliesToEnv({ env: ["paas"] }, "paas")).toBe(true);
    expect(appliesToEnv({ env: ["paas", "saas"] }, "saas")).toBe(true);
  });

  test("drops an item scoped to a different environment", () => {
    expect(appliesToEnv({ env: ["paas"] }, "saas")).toBe(false);
    expect(appliesToEnv({ env: ["saas"] }, "paas")).toBe(false);
  });
});

describe("getInstallCommerceEnv", () => {
  test("reads AIO_COMMERCE_API_FLAVOR from params", () => {
    expect(getInstallCommerceEnv({ AIO_COMMERCE_API_FLAVOR: "saas" })).toBe(
      "saas",
    );
  });

  test("returns an empty string when the flavor is absent", () => {
    expect(getInstallCommerceEnv({})).toBe("");
  });
});

describe("filterAppConfigByEnv", () => {
  const config = {
    metadata: {
      id: "test-app",
      displayName: "Test",
      description: "Test",
      version: "1.0.0",
    },
    webhooks: [
      { label: "all", env: undefined },
      { label: "paas-only", env: ["paas"] },
      { label: "saas-only", env: ["saas"] },
    ],
    eventing: {
      commerce: [
        {
          provider: { label: "Mixed" },
          events: [{ name: "plugin.a", env: ["saas"] }, { name: "plugin.b" }],
        },
        {
          provider: { label: "Paas Only" },
          events: [{ name: "plugin.c", env: ["paas"] }],
        },
      ],
      external: [
        {
          provider: { label: "Ext" },
          events: [{ name: "ext.a", env: ["saas"] }],
        },
      ],
    },
  } as unknown as CommerceAppConfigOutputModel;

  test("filters webhooks to the target environment", () => {
    const filtered = filterAppConfigByEnv(config, "saas");
    expect(filtered.webhooks?.map((w) => w.label)).toEqual([
      "all",
      "saas-only",
    ]);
  });

  test("keeps only applicable events and drops empty providers", () => {
    const filtered = filterAppConfigByEnv(config, "saas");

    // "Paas Only" provider is dropped; "Mixed" keeps both events.
    expect(filtered.eventing?.commerce).toHaveLength(1);
    expect(filtered.eventing?.commerce?.[0]?.events.map((e) => e.name)).toEqual(
      ["plugin.a", "plugin.b"],
    );
    expect(filtered.eventing?.external).toHaveLength(1);
  });

  test("drops external provider with no applicable events on paas", () => {
    const filtered = filterAppConfigByEnv(config, "paas");

    expect(filtered.eventing?.external).toHaveLength(0);
    // "Mixed" keeps only the un-scoped event; "Paas Only" survives.
    expect(filtered.eventing?.commerce).toHaveLength(2);
    expect(filtered.eventing?.commerce?.[0]?.events.map((e) => e.name)).toEqual(
      ["plugin.b"],
    );
  });

  test("does not mutate the original config", () => {
    filterAppConfigByEnv(config, "paas");
    expect(config.webhooks).toHaveLength(3);
    expect(config.eventing?.commerce?.[0]?.events).toHaveLength(2);
  });
});
