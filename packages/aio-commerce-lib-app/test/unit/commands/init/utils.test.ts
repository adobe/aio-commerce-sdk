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

import { getDefaultCommerceAppConfig } from "#commands/init/utils";

import type { CommerceAppConfigDomain } from "#config/index";

vi.mock("@aio-commerce-sdk/scripting-utils/project", () => ({
  isESM: vi.fn(() => Promise.resolve(false)),
}));

function makeDomains(
  ...domains: CommerceAppConfigDomain[]
): Set<CommerceAppConfigDomain> {
  return new Set(domains);
}

const BASE_ANSWERS = {
  appName: "Test App",
  configFile: "app.commerce.config.ts",
  configFormat: "ts" as const,
};

describe("getDefaultCommerceAppConfig", () => {
  test("includes webhooks defaults when 'webhooks' domain is selected", async () => {
    const output = await getDefaultCommerceAppConfig("/fake/cwd", {
      ...BASE_ANSWERS,
      domains: makeDomains("webhooks"),
    });

    expect(output).toContain("webhooks");
    expect(output).toContain("webhook_method");
  });

  test("does NOT include webhooks when 'webhooks' domain is not selected", async () => {
    const output = await getDefaultCommerceAppConfig("/fake/cwd", {
      ...BASE_ANSWERS,
      domains: makeDomains("businessConfig.schema"),
    });

    expect(output).not.toContain("webhooks");
    expect(output).not.toContain("webhook_method");
  });

  test("includes businessConfig defaults when 'businessConfig.schema' domain is selected", async () => {
    const output = await getDefaultCommerceAppConfig("/fake/cwd", {
      ...BASE_ANSWERS,
      domains: makeDomains("businessConfig.schema"),
    });

    expect(output).toContain("businessConfig");
    expect(output).toContain("schema");
  });

  test("includes eventing.commerce defaults when that domain is selected", async () => {
    const output = await getDefaultCommerceAppConfig("/fake/cwd", {
      ...BASE_ANSWERS,
      domains: makeDomains("eventing.commerce"),
    });

    expect(output).toContain("commerce");
    expect(output).toContain("eventing");
  });

  test("includes eventing.external defaults when that domain is selected", async () => {
    const output = await getDefaultCommerceAppConfig("/fake/cwd", {
      ...BASE_ANSWERS,
      domains: makeDomains("eventing.external"),
    });

    expect(output).toContain("external");
    expect(output).toContain("eventing");
  });

  test("includes both webhooks and eventing when both domains are selected", async () => {
    const output = await getDefaultCommerceAppConfig("/fake/cwd", {
      ...BASE_ANSWERS,
      domains: makeDomains("webhooks", "eventing.commerce"),
    });

    expect(output).toContain("webhooks");
    expect(output).toContain("webhook_method");
    expect(output).toContain("commerce");
    expect(output).toContain("eventing");
  });

  test("produces minimal config (only metadata) when no feature domains are selected", async () => {
    const output = await getDefaultCommerceAppConfig("/fake/cwd", {
      ...BASE_ANSWERS,
      domains: makeDomains(),
    });

    expect(output).toContain("metadata");
    expect(output).not.toContain("webhooks");
    expect(output).not.toContain("businessConfig");
    expect(output).not.toContain("eventing");
  });
});
